/**
 * TyD Engine - Serializer, Validator, and Parser for Software Inc. mod files
 * GitHub Pages compatible - pure client-side JavaScript
 */

const TyDEngine = (function() {
  'use strict';

  // ─── Serialization ───

  function serializeValue(value, indent = 1) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      // Quote if contains spaces, special chars, or looks like it needs quoting
      if (/\s|[;\[\]{}]/.test(value) || value === '') {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      // Array of objects (tables)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return value.map(item => serializeTable(item, indent)).join('\n');
      }
      // Array of primitives
      const items = value.map(v => {
        if (typeof v === 'string') return serializeStringForArray(v);
        return String(v);
      }).join('; ');
      return `[ ${items} ]`;
    }
    if (typeof value === 'object') {
      return serializeTable(value, indent);
    }
    return String(value);
  }

  function serializeStringForArray(str) {
    if (/\s|[;\[\]{}]/.test(str) || str === '') {
      return `"${str.replace(/"/g, '\\"')}"`;
    }
    return str;
  }

  function serializeTable(obj, indent = 1) {
    const tabs = '\t'.repeat(indent);
    const lines = [];
    lines.push(tabs + '{');

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;

      const serialized = serializeValue(value, indent + 1);
      if (serialized === null) continue;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested table on its own line(s)
        lines.push(`${tabs}\t${key}`);
        lines.push(serialized);
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        // Array of tables (like Features, Categories)
        lines.push(`${tabs}\t${key}`);
        lines.push(`${tabs}\t\t[`);
        // Each item is a table, already indented by serializeValue
        const inner = value.map(item => {
          const s = serializeTable(item, indent + 2);
          // Remove the leading tabs from the first line since we'll add them
          return s;
        }).join('\n');
        lines.push(inner);
        lines.push(`${tabs}\t\t]`);
      } else {
        // Simple value on one line
        lines.push(`${tabs}\t${key}\t\t${serialized}`);
      }
    }

    lines.push(tabs + '}');
    return lines.join('\n');
  }

  function serializeSoftwareType(st) {
    const lines = ['SoftwareType'];
    lines.push(serializeTable(st, 0));
    return lines.join('\n');
  }

  function serializeCompanyType(ct) {
    const lines = ['CompanyType'];
    lines.push(serializeTable(ct, 0));
    return lines.join('\n');
  }

  function serializeNameGenerator(ng) {
    // Name generators are plain text files, not TyD
    return ng.raw || '';
  }

  function serializePersonalities(pg) {
    const lines = ['PersonalityGraph'];
    lines.push(serializeTable(pg, 0));
    return lines.join('\n');
  }

  function serializeMeta(meta) {
    const lines = [];
    for (const [key, value] of Object.entries(meta)) {
      if (!value) continue;
      lines.push(`${key}\t\t"${value.replace(/"/g, '\\"')}"`);
    }
    return lines.join('\n');
  }

  // ─── Validation ───

  function validateSoftwareType(st) {
    const errors = [];
    const warnings = [];

    if (!st.Name || st.Name.trim() === '') {
      errors.push({ field: 'Name', message: 'Software name is required.' });
    }

    if (!st.Description || st.Description.trim() === '') {
      warnings.push({ field: 'Description', message: 'Description is empty — tooltips will be blank.' });
    }

    if (!st.SubmarketNames || !Array.isArray(st.SubmarketNames) || st.SubmarketNames.length !== 3) {
      errors.push({ field: 'SubmarketNames', message: 'Exactly 3 submarket names are required.' });
    } else if (st.SubmarketNames.some(n => !n || n.trim() === '')) {
      errors.push({ field: 'SubmarketNames', message: 'All 3 submarket names must be filled.' });
    }

    if (st.Random < 0 || st.Random > 1) {
      errors.push({ field: 'Random', message: 'Random must be between 0.0 and 1.0.' });
    }

    if (st.Popularity < 0 || st.Popularity > 1) {
      errors.push({ field: 'Popularity', message: 'Popularity must be between 0.0 and 1.0.' });
    }

    if (st.Iterative < 0 || st.Iterative > 1) {
      errors.push({ field: 'Iterative', message: 'Iterative must be between 0.0 and 1.0.' });
    }

    if (st.OptimalDevTime <= 0) {
      errors.push({ field: 'OptimalDevTime', message: 'OptimalDevTime must be greater than 0.' });
    }

    if (!st.Features || st.Features.length === 0) {
      warnings.push({ field: 'Features', message: 'No features defined — the software will have nothing to develop.' });
    }

    // Feature validation
    if (st.Features) {
      let totalDevTime = 0;
      st.Features.forEach((feat, fi) => {
        if (!feat.Name || feat.Name.trim() === '') {
          errors.push({ field: `Feature${fi}.Name`, message: `Feature ${fi + 1} has no name.` });
        }
        if (!feat.Spec || feat.Spec.trim() === '') {
          warnings.push({ field: `Feature${fi}.Spec`, message: `Feature ${fi + 1} has no specialization.` });
        }
        if (feat.DevTime > 0) totalDevTime += feat.DevTime;

        if (feat.Submarkets) {
          if (!Array.isArray(feat.Submarkets) || feat.Submarkets.length !== 3) {
            errors.push({ field: `Feature${fi}.Submarkets`, message: `Feature ${fi + 1} Submarkets must have exactly 3 values.` });
          }
        }

        if (feat.Features) {
          feat.Features.forEach((sub, si) => {
            if (!sub.Name || sub.Name.trim() === '') {
              errors.push({ field: `Feature${fi}.Sub${si}.Name`, message: `SubFeature ${si + 1} of Feature ${fi + 1} has no name.` });
            }
            if (sub.Level < 1 || sub.Level > 3) {
              errors.push({ field: `Feature${fi}.Sub${si}.Level`, message: `SubFeature ${si + 1} Level must be 1, 2, or 3.` });
            }
            if (sub.Level === 3 && sub.Submarkets && sub.Submarkets.length === 3 && (sub.Submarkets[0] !== 0 || sub.Submarkets[1] !== 0 || sub.Submarkets[2] !== 0)) {
              warnings.push({ field: `Feature${fi}.Sub${si}.Submarkets`, message: `Level 3 features should have Submarkets 0.` });
            }
            if (sub.DevTime > 0) totalDevTime += sub.DevTime;
          });
        }
      });

      if (st.OptimalDevTime > 0 && totalDevTime < st.OptimalDevTime * 0.5) {
        warnings.push({ field: 'Features', message: `Total feature dev time (${totalDevTime}) is much less than OptimalDevTime (${st.OptimalDevTime}). Players may not reach 100% satisfaction. Use TEST_DEV_MOD in-game to verify.` });
      }
    }

    // Category vs root warnings
    if (st.Categories && st.Categories.length > 0) {
      if (st.Popularity !== undefined && st.Popularity !== null && st.Popularity !== '') {
        warnings.push({ field: 'Popularity', message: 'Categories are defined — root Popularity will be ignored by the game.' });
      }
      if (st.Retention !== undefined && st.Retention !== null && st.Retention !== '') {
        warnings.push({ field: 'Retention', message: 'Categories are defined — root Retention will be ignored by the game.' });
      }
      if (st.Iterative !== undefined && st.Iterative !== null && st.Iterative !== '') {
        warnings.push({ field: 'Iterative', message: 'Categories are defined — root Iterative will be ignored by the game.' });
      }
    }

    // OSSupport validation
    const osVal = String(st.OSSupport).toLowerCase().trim();
    if (osVal !== 'true' && osVal !== 'false' && osVal !== '') {
      // It's a custom value like "Computer" — that's valid
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  function validateCompanyType(ct) {
    const errors = [];
    const warnings = [];

    if (!ct.Specialization || ct.Specialization.trim() === '') {
      errors.push({ field: 'Specialization', message: 'Specialization is required.' });
    }

    if (ct.PerYear < 0 || ct.PerYear > 1) {
      errors.push({ field: 'PerYear', message: 'PerYear should typically be between 0 and 1 (default 0.2).' });
    }

    if (ct.Min < 0) {
      errors.push({ field: 'Min', message: 'Min must be 0 or greater.' });
    }

    if (ct.Max < ct.Min) {
      errors.push({ field: 'Max', message: 'Max must be greater than or equal to Min.' });
    }

    if (!ct.Types || ct.Types.length === 0) {
      warnings.push({ field: 'Types', message: 'No software types defined — this company will do nothing.' });
    } else {
      ct.Types.forEach((t, i) => {
        if (!t.Software || t.Software.trim() === '') {
          errors.push({ field: `Types[${i}].Software`, message: `Type ${i + 1} has no software name.` });
        }
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ─── Simple Parser (Basic) ───
  // Parses a TyD string into a rough JS object. Not perfect but handles common cases.

  function parseTyD(text) {
    const lines = text.split('\n');
    const result = {};
    let currentRoot = null;
    let stack = [];
    let inArray = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Very basic parsing for root table detection
      if (trimmed === 'SoftwareType' || trimmed === 'CompanyType' || trimmed === 'PersonalityGraph') {
        currentRoot = trimmed;
        continue;
      }

      if (trimmed === '{' || trimmed === '[') {
        stack.push(trimmed);
        continue;
      }
      if (trimmed === '}' || trimmed === ']') {
        stack.pop();
        continue;
      }

      // Try to parse key-value pairs
      const match = trimmed.match(/^([A-Za-z_]+)\s+(.+)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();

        // Remove trailing comments
        const commentIdx = value.indexOf('#');
        if (commentIdx > 0) value = value.slice(0, commentIdx).trim();

        // Unquote strings
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/\\"/g, '"');
        }

        // Parse booleans
        if (value === 'True') value = true;
        else if (value === 'False') value = false;
        // Parse numbers
        else if (/^-?\d+(\.\d+)?$/.test(value)) value = parseFloat(value);
        // Parse arrays (very basic)
        else if (value.startsWith('[') && value.endsWith(']')) {
          const inner = value.slice(1, -1).trim();
          if (inner === '') {
            value = [];
          } else {
            value = inner.split(';').map(s => {
              s = s.trim();
              if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/\\"/g, '"');
              if (s === 'True') return true;
              if (s === 'False') return false;
              if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
              return s;
            });
          }
        }

        result[key] = value;
      }
    }

    return { type: currentRoot, data: result };
  }

  // ─── Format Helpers ───

  function formatSubmarkets(input) {
    if (!input) return [0, 0, 0];
    if (Array.isArray(input)) return input.map(Number);
    // Split by spaces, commas, semicolons, tabs
    return input.split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(Number);
  }

  function formatSubmarketNames(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return input.split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(s => s !== '');
  }

  function formatOSSupport(value) {
    if (!value) return null; // omit
    const v = String(value).trim();
    if (v.toLowerCase() === 'true') return 'True';
    if (v.toLowerCase() === 'false') return 'False';
    // Return as-is for custom values like "Computer" or "[ Computer; Console ]"
    return v;
  }

  // ─── Public API ───

  return {
    serializeSoftwareType,
    serializeCompanyType,
    serializeNameGenerator,
    serializePersonalities,
    serializeMeta,
    validateSoftwareType,
    validateCompanyType,
    parseTyD,
    formatSubmarkets,
    formatSubmarketNames,
    formatOSSupport
  };
})();

// Export for module systems or attach to window
if (typeof window !== 'undefined') {
  window.TyDEngine = TyDEngine;
}
