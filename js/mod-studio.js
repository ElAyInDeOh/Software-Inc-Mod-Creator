/**
 * ModStudio - Virtual filesystem + zip packaging for complete Software Inc mods.
 *
 * A "mod" is a folder structure (meta.tyd + SoftwareTypes/, CompanyTypes/,
 * NameGenerators/, Personalities/) stored in localStorage as a flat path→record
 * map. Files can be created in-app, imported from existing Studio projects via
 * TyDEngine serialization, or pasted as raw text. Mods are downloaded as .zip
 * using the vendored JSZip (js/vendor/jszip.min.js).
 *
 * No AI dependence — works identically in ai-enabled and web-only modes.
 */
const ModStudio = (function () {
  'use strict';

  const STORAGE_KEY = 'simc_mods';
  const CURRENT_KEY = 'simc_current_mod';

  /* Canonical Software Inc mod folders. Empty folders are persisted as
     path-with-trailing-slash markers so a fresh blank mod looks right. */
  const CANONICAL_FOLDERS = [
    'SoftwareTypes/',
    'CompanyTypes/',
    'NameGenerators/',
    'Personalities/'
  ];

  /* Default file kinds — drives icon + editor language hint. */
  function inferKind(path) {
    const lower = path.toLowerCase();
    if (lower.endsWith('.tyd')) return 'tyd';
    if (lower.endsWith('.txt')) return 'text';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif')) return 'image';
    if (lower.endsWith('.md')) return 'markdown';
    return 'text';
  }

  /* ─── Persistence ─── */

  function getMods() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveMods(mods) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mods));
  }

  function saveMod(mod) {
    const mods = getMods();
    const i = mods.findIndex(m => m.id === mod.id);
    mod.updatedAt = new Date().toISOString();
    if (i >= 0) mods[i] = mod; else mods.push(mod);
    saveMods(mods);
    localStorage.setItem(CURRENT_KEY, mod.id);
    return mod;
  }

  function loadMod(id) {
    return getMods().find(m => m.id === id) || null;
  }

  function deleteMod(id) {
    let mods = getMods();
    mods = mods.filter(m => m.id !== id);
    saveMods(mods);
    if (localStorage.getItem(CURRENT_KEY) === id) localStorage.removeItem(CURRENT_KEY);
  }

  function getCurrentModId() {
    return localStorage.getItem(CURRENT_KEY);
  }

  function createMod(name) {
    const id = 'mod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    const now = new Date().toISOString();
    const files = {};
    CANONICAL_FOLDERS.forEach(f => { files[f] = { folder: true }; });
    return {
      id,
      name: name || 'Untitled Mod',
      description: '',
      createdAt: now,
      updatedAt: now,
      files
    };
  }

  /* ─── File operations ─── */

  function normalizePath(path) {
    if (!path) return '';
    let p = path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
    return p;
  }

  function getParentDir(path) {
    const p = normalizePath(path);
    const i = p.lastIndexOf('/');
    return i < 0 ? '' : p.slice(0, i + 1);
  }

  function getBaseName(path) {
    const p = normalizePath(path);
    const i = p.lastIndexOf('/');
    return i < 0 ? p : p.slice(i + 1);
  }

  function isFolderRecord(rec) {
    return rec && (rec.folder === true || rec.isFolder === true);
  }

  function ensureFolder(mod, folderPath) {
    let p = normalizePath(folderPath);
    if (!p.endsWith('/')) p += '/';
    if (p === '/') return;
    if (!mod.files[p]) mod.files[p] = { folder: true };
    /* Also ensure all ancestor folders exist as markers. */
    const parts = p.split('/').filter(Boolean);
    let acc = '';
    for (let i = 0; i < parts.length; i++) {
      acc += parts[i] + '/';
      if (!mod.files[acc]) mod.files[acc] = { folder: true };
    }
  }

  function addFile(mod, path, content) {
    const p = normalizePath(path);
    if (!p) return { error: 'Empty path' };
    if (p.endsWith('/')) return { error: 'Use addFolder for folders' };
    ensureFolder(mod, getParentDir(p));
    mod.files[p] = { content: content || '', kind: inferKind(p) };
    return { path: p };
  }

  function addFolder(mod, folderPath) {
    ensureFolder(mod, folderPath);
    return { ok: true };
  }

  function renamePath(mod, oldPath, newPath) {
    const op = normalizePath(oldPath);
    const np = normalizePath(newPath);
    if (!op || !np) return { error: 'Invalid path' };
    if (op === np) return { ok: true };
    if (mod.files[np] !== undefined) return { error: 'A file/folder with that name already exists' };

    const rec = mod.files[op];
    if (!rec) return { error: 'Source does not exist' };

    if (isFolderRecord(rec)) {
      /* Move folder + all descendants. */
      const oprefix = op.endsWith('/') ? op : op + '/';
      const toMove = Object.keys(mod.files).filter(k => k === op || k.startsWith(oprefix));
      toMove.forEach(k => {
        const rel = k.slice(oprefix.length);
        const target = np.endsWith('/') ? np + rel : np + '/' + rel;
        mod.files[target] = mod.files[k];
        delete mod.files[k];
      });
    } else {
      ensureFolder(mod, getParentDir(np));
      mod.files[np] = rec;
      delete mod.files[op];
    }
    return { ok: true };
  }

  function deletePath(mod, path) {
    const p = normalizePath(path);
    if (!p) return;
    const rec = mod.files[p];
    if (isFolderRecord(rec)) {
      const prefix = p.endsWith('/') ? p : p + '/';
      Object.keys(mod.files).filter(k => k === p || k.startsWith(prefix)).forEach(k => delete mod.files[k]);
    } else {
      delete mod.files[p];
    }
    /* Prune now-empty folder markers (leave canonical ones). */
    pruneEmptyFolders(mod);
  }

  function pruneEmptyFolders(mod) {
    const paths = Object.keys(mod.files);
    const folderPaths = paths.filter(p => isFolderRecord(mod.files[p]));
    folderPaths.forEach(fp => {
      if (CANONICAL_FOLDERS.indexOf(fp) >= 0) return; /* keep canonical even if empty */
      const prefix = fp.endsWith('/') ? fp : fp + '/';
      const hasChild = paths.some(p => p !== fp && p.startsWith(prefix));
      if (!hasChild) delete mod.files[fp];
    });
  }

  function getFileContent(mod, path) {
    const rec = mod.files[normalizePath(path)];
    return rec && !isFolderRecord(rec) ? (rec.content || '') : null;
  }

  function setFileContent(mod, path, content) {
    const p = normalizePath(path);
    if (mod.files[p] && !isFolderRecord(mod.files[p])) {
      mod.files[p].content = content;
    }
  }

  /* ─── Tree building (for UI) ─── */

  function buildTree(mod) {
    const root = { name: '', path: '', folder: true, children: [] };
    const seen = {};
    const paths = Object.keys(mod.files).sort();
    paths.forEach(p => {
      const rec = mod.files[p];
      const parts = p.split('/').filter(Boolean);
      let cursor = root;
      let acc = '';
      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        acc += parts[i] + (isLast ? '' : '/');
        const isFolder = isLast && isFolderRecord(rec);
        /* Normalize key to trailing-slash form so folder markers
           ('SoftwareTypes/') and file ancestors ('SoftwareTypes')
           resolve to the same node. */
        const folderKey = acc.endsWith('/') ? acc : acc + '/';
        if (isFolder) {
          if (!seen[folderKey]) {
            seen[folderKey] = { name: parts[i], path: folderKey, folder: true, children: [] };
            cursor.children.push(seen[folderKey]);
          }
          cursor = seen[folderKey];
        } else if (i === parts.length - 1 && !isFolder) {
          /* file */
          cursor.children.push({ name: parts[i], path: p, folder: false, kind: rec.kind || inferKind(p) });
        } else {
          /* implicit ancestor folder */
          if (!seen[folderKey]) {
            seen[folderKey] = { name: parts[i], path: folderKey, folder: true, children: [] };
            cursor.children.push(seen[folderKey]);
          }
          cursor = seen[folderKey];
        }
      }
    });
    /* Sort: folders first, then files, alphabetical. */
    function sortNode(n) {
      if (!n.children) return;
      n.children.sort((a, b) => (a.folder === b.folder ? a.name.localeCompare(b.name) : a.folder ? -1 : 1));
      n.children.forEach(sortNode);
    }
    sortNode(root);
    return root;
  }

  /* ─── Structure validation ─── */

  function validateStructure(mod) {
    const errors = [];
    const warnings = [];
    const paths = Object.keys(mod.files);
    const filesOnly = paths.filter(p => !isFolderRecord(mod.files[p]));

    if (filesOnly.length === 0) {
      warnings.push({ field: 'files', message: 'Mod is empty — add at least one file.' });
    }
    if (mod.files['meta.tyd'] === undefined || isFolderRecord(mod.files['meta.tyd'])) {
      warnings.push({ field: 'meta.tyd', message: 'No meta.tyd at root — Software Inc needs mod name/description/author here.' });
    }
    const hasSW = filesOnly.some(p => p.toLowerCase().startsWith('softwaretypes/') && p.toLowerCase().endsWith('.tyd'));
    if (!hasSW) warnings.push({ field: 'SoftwareTypes', message: 'No SoftwareTypes/*.tyd — the mod adds no software products.' });
    const hasCT = filesOnly.some(p => p.toLowerCase().startsWith('companytypes/') && p.toLowerCase().endsWith('.tyd'));
    if (!hasCT) warnings.push({ field: 'CompanyTypes', message: 'No CompanyTypes/*.tyd — no AI companies. (Optional but common.)' });

    /* Reserved / suspicious names. */
    filesOnly.forEach(p => {
      if (/[<>:"|?*]/.test(p)) errors.push({ field: p, message: 'Filename contains illegal characters.' });
    });

    return { valid: errors.length === 0, errors, warnings, fileCount: filesOnly.length };
  }

  /* ─── Zip packaging (JSZip) ─── */

  async function exportZip(mod, opts) {
    opts = opts || {};
    if (typeof window === 'undefined' || typeof window.JSZip !== 'function') {
      throw new Error('JSZip not loaded. Expected js/vendor/jszip.min.js');
    }
    const zip = new window.JSZip();
    const root = opts.flattenRoot === true ? '' : (sanitizeFileName(mod.name || 'mod') + '/');
    Object.keys(mod.files).forEach(p => {
      const rec = mod.files[p];
      if (isFolderRecord(rec)) return; /* folders are implicit from file paths */
      zip.file(root + p, rec.content || '');
    });
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    return blob;
  }

  function sanitizeFileName(name) {
    return (name || 'mod').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^\.+|\.+$/g, '') || 'mod';
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ─── Bridge: import from existing Studio project ─── */

  function importFromProject(project) {
    /* project = Studio.loadProject(id) — has softwareTypes[], companyTypes[],
       nameGenerators[], personalities, meta. Each entity is serialized via
       TyDEngine into the matching canonical folder. */
    if (!project) return { added: 0 };
    if (typeof window === 'undefined' || !window.TyDEngine) {
      throw new Error('TyDEngine not loaded');
    }
    let added = 0;
    const mod = createMod(project.meta && project.meta.name ? project.meta.name : (project.name || 'Imported Mod'));

    /* meta.tyd */
    if (project.meta && (project.meta.name || project.meta.description || project.meta.author)) {
      mod.files['meta.tyd'] = { content: window.TyDEngine.serializeMeta(project.meta), kind: 'tyd' };
      added++;
    }

    /* SoftwareTypes */
    (project.softwareTypes || []).forEach((st, i) => {
      const fname = sanitizeTydFileName(st.Name || ('software_' + (i + 1))) + '.tyd';
      mod.files['SoftwareTypes/' + fname] = { content: window.TyDEngine.serializeSoftwareType(st), kind: 'tyd' };
      added++;
    });

    /* CompanyTypes */
    (project.companyTypes || []).forEach((ct, i) => {
      const fname = sanitizeTydFileName(ct.Specialization || ('company_' + (i + 1))) + '.tyd';
      mod.files['CompanyTypes/' + fname] = { content: window.TyDEngine.serializeCompanyType(ct), kind: 'tyd' };
      added++;
    });

    /* NameGenerators (.txt) */
    (project.nameGenerators || []).forEach((ng, i) => {
      const fname = sanitizeTydFileName(ng.name || ('names_' + (i + 1))) + '.txt';
      const content = ng.raw || window.TyDEngine.serializeNameGenerator(ng);
      mod.files['NameGenerators/' + fname] = { content: content, kind: 'text' };
      added++;
    });

    /* Personalities */
    if (project.personalities) {
      mod.files['Personalities/Personalities.tyd'] = { content: window.TyDEngine.serializePersonalities(project.personalities), kind: 'tyd' };
      added++;
    }

    pruneEmptyFolders(mod);
    return { mod, added };
  }

  function sanitizeTydFileName(name) {
    return (name || '').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^\.+|\.+$/g, '').slice(0, 60) || 'untitled';
  }

  /* ─── Example mod ─── */

  function createExampleMod(name) {
    const mod = createMod(name || 'Example Mod');

    mod.files['meta.tyd'] = {
      content: 'Name\t\t"' + (mod.name) + '"\nDescription\t"A starter example mod created by Software Inc Mod Studio."\nAuthor\t\t"Mod Studio"',
      kind: 'tyd'
    };

    /* One sample software type via a minimal object + TyDEngine. */
    if (window.TyDEngine) {
      const sampleSW = {
        Name: 'Example App',
        Description: 'An example software type to show the folder layout.',
        Random: 0.3,
        OSSupport: 'True',
        Popularity: 0.6,
        Retention: 36,
        IdealPrice: 40,
        OptimalDevTime: 30,
        SubmarketNames: ['Design', 'Speed', 'Features'],
        Iterative: 0.5,
        NameGenerator: '',
        OneClient: false,
        InHouse: false,
        Unlock: 1990,
        Hardware: false,
        Categories: [],
        Features: [
          { Name: 'Core Engine', Spec: 'System', Description: 'Main engine module', DevTime: 6, CodeArt: 0.6, Submarkets: [2, 1, 1], Optional: false, Features: [] }
        ],
        AddOns: [],
        Manufacturing: null
      };
      mod.files['SoftwareTypes/Example App.tyd'] = { content: window.TyDEngine.serializeSoftwareType(sampleSW), kind: 'tyd' };

      const sampleCT = {
        Specialization: 'Example Co',
        PerYear: 0.2,
        Frameworks: true,
        Min: 1,
        Max: 3,
        Types: [{ Software: 'Example App', Chance: 1 }],
        Addons: []
      };
      mod.files['CompanyTypes/Example Co.tyd'] = { content: window.TyDEngine.serializeCompanyType(sampleCT), kind: 'tyd' };
    }

    mod.files['NameGenerators/example_names.txt'] = {
      content: '-start(base)\n-base(end,stop)\nCyber\nTech\nSuper\nUltra\nMega\n-end(stop)\nStudios\nInteractive\nGames\nSystems',
      kind: 'text'
    };

    pruneEmptyFolders(mod);
    return mod;
  }

  /* ─── Public API ─── */

  return {
    CANONICAL_FOLDERS,
    getMods,
    saveMod,
    loadMod,
    deleteMod,
    getCurrentModId,
    createMod,
    addFile,
    addFolder,
    renamePath,
    deletePath,
    getFileContent,
    setFileContent,
    buildTree,
    validateStructure,
    exportZip,
    triggerDownload,
    importFromProject,
    createExampleMod,
    inferKind,
    normalizePath,
    getBaseName,
    getParentDir
  };
})();

if (typeof window !== 'undefined') {
  window.ModStudio = ModStudio;
}
