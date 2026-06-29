/**
 * Studio - Shared UI utilities, navigation, storage, and theming
 */

const Studio = (function() {
  'use strict';

  // ─── Theme / Dark Mode ───

  function initTheme() {
    const saved = localStorage.getItem('simc_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('simc_theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  // ─── LocalStorage Projects ───

  const STORAGE_KEY = 'simc_projects';
  const CURRENT_KEY = 'simc_current_project';

  function getProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveProject(project) {
    const projects = getProjects();
    const existing = projects.findIndex(p => p.id === project.id);
    project.updatedAt = new Date().toISOString();
    if (existing >= 0) {
      projects[existing] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(CURRENT_KEY, project.id);
  }

  function loadProject(id) {
    const projects = getProjects();
    return projects.find(p => p.id === id) || null;
  }

  function deleteProject(id) {
    let projects = getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    const current = localStorage.getItem(CURRENT_KEY);
    if (current === id) {
      localStorage.removeItem(CURRENT_KEY);
    }
  }

  function getCurrentProjectId() {
    return localStorage.getItem(CURRENT_KEY);
  }

  function createProject(name) {
    const id = 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    return {
      id,
      name: name || 'Untitled Mod',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      meta: { name: name || 'Untitled Mod', description: '', author: '' },
      softwareTypes: [],
      companyTypes: [],
      nameGenerators: [],
      personalities: null
    };
  }

  // ─── UI Helpers ───

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function createElement(tag, classes = '', attrs = {}) {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  // ─── Modal System ───

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
  }

  function closeAllModals() {
    document.querySelectorAll('.studio-modal-overlay').forEach(m => m.classList.remove('open'));
  }

  // ─── Toast Notifications ───

  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = createElement('div', `studio-fade-in studio-alert studio-alert-${type}`, {
      style: 'margin-bottom: 0.5rem; min-width: 280px;'
    });
    toast.innerHTML = `
      <span>${message}</span>
      <button class="studio-btn studio-btn-ghost studio-btn-sm" onclick="this.parentElement.remove()" aria-label="Dismiss">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function createToastContainer() {
    const container = createElement('div', '', {
      id: 'toast-container',
      style: 'position: fixed; top: 80px; right: 1rem; z-index: 200; display: flex; flex-direction: column; gap: 0.5rem;'
    });
    document.body.appendChild(container);
    return container;
  }

  // ─── Clipboard ───

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard!', 'success');
    } catch (err) {
      // Fallback
      const textarea = createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast('Copied to clipboard!', 'success');
    }
  }

  // ─── Download ───

  function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Accordion ───

  function initAccordions() {
    document.querySelectorAll('.studio-card-header[data-accordion]').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const chevron = header.querySelector('.studio-accordion-chevron');
        if (body) body.classList.toggle('open');
        if (chevron) chevron.classList.toggle('open');
      });
    });
  }

  // ─── Header Injection ───

  function injectHeader(options = {}) {
    const existing = document.querySelector('.studio-header');
    if (existing) return;

    const showBack = options.showBack !== false;
    const backUrl = options.backUrl || 'index.html';
    const title = options.title || 'Software Inc Mod Studio';

    const header = createElement('header', 'studio-header');
    header.innerHTML = `
      <a href="${backUrl}" class="studio-header-brand" style="text-decoration:none;">
        ${showBack ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>` : ''}
        <span>${title}</span>
      </a>
      <div class="studio-header-actions">
        <button class="studio-btn studio-btn-ghost studio-btn-icon" id="theme-toggle" title="Toggle theme" aria-label="Toggle theme">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        </button>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    header.querySelector('#theme-toggle').addEventListener('click', toggleTheme);
  }

  // ─── Icons (SVG strings) ───

  const Icons = {
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    terminal: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
    home: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
  };

  // ─── Tooltip System ───

  let tooltipEl = null;

  function initTooltips() {
    // Create shared tooltip element
    if (!tooltipEl) {
      tooltipEl = createElement('div', '', {
        style: 'position:fixed; z-index:9999; pointer-events:none; opacity:0; visibility:hidden; transition:opacity 0.15s ease; max-width:280px; padding:0.5rem 0.75rem; background:var(--text-primary); color:var(--bg-primary); font-size:0.8125rem; border-radius:0.5rem; line-height:1.4; box-shadow:var(--shadow-lg);'
      });
      document.body.appendChild(tooltipEl);
    }

    // Use event delegation for dynamic content
    document.body.addEventListener('mouseenter', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;
      const text = target.getAttribute('data-tooltip');
      if (!text) return;
      tooltipEl.textContent = text;
      tooltipEl.style.opacity = '1';
      tooltipEl.style.visibility = 'visible';
      positionTooltip(target);
    }, true);

    document.body.addEventListener('mouseleave', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;
      tooltipEl.style.opacity = '0';
      tooltipEl.style.visibility = 'hidden';
    }, true);

    document.body.addEventListener('mousemove', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;
      positionTooltip(target);
    });
  }

  function positionTooltip(target) {
    if (!tooltipEl) return;
    const rect = target.getBoundingClientRect();
    const ttRect = tooltipEl.getBoundingClientRect();
    let top = rect.top - ttRect.height - 8;
    let left = rect.left + (rect.width / 2) - (ttRect.width / 2);

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + ttRect.width > window.innerWidth - 8) left = window.innerWidth - ttRect.width - 8;
    if (top < 8) top = rect.bottom + 8; // flip to bottom if not enough space above

    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
  }

  // ─── Init ───

  function init() {
    initTheme();
    initTooltips();
    // Close modals on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('studio-modal-overlay')) {
        e.target.classList.remove('open');
      }
    });
    // Escape to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  return {
    init,
    initTheme,
    applyTheme,
    toggleTheme,
    getProjects,
    saveProject,
    loadProject,
    deleteProject,
    getCurrentProjectId,
    createProject,
    $,
    $$,
    createElement,
    openModal,
    closeModal,
    closeAllModals,
    toast,
    copyToClipboard,
    downloadTextFile,
    initAccordions,
    initTooltips,
    injectHeader,
    Icons
  };
})();

if (typeof window !== 'undefined') {
  window.Studio = Studio;
}
