/* IAM Access Atlas — Clover Health IAM
   Depends on: data.js (exposes const APP_DATA)
*/

(function () {
  'use strict';

  // Load saved theme immediately to prevent flash of unstyled content
  (function () {
    try {
      const saved = localStorage.getItem('iam_atlas_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}
  })();

  // ── DOM refs ────────────────────────────────────────────────────────
  const scrollLanding = document.getElementById('scroll-landing');
  const appNavBar     = document.getElementById('app-nav-bar');
  const appContent    = document.getElementById('app-content');
  const btnManager      = document.getElementById('btn-manager');
  const btnStaff        = document.getElementById('btn-staff');
  const btnInsights     = document.getElementById('btn-insights');
  const insightsContent = document.getElementById('insights-content');
  const insightsBackBtn = document.getElementById('insights-back-btn');
  const backBtn         = document.getElementById('back-btn');
  const modeIndicator = document.getElementById('mode-indicator');
  const introText     = document.getElementById('intro-text');
  const emptySubText  = document.getElementById('empty-sub-text');
  const appSelect     = document.getElementById('app-select');
  const roleSearch    = document.getElementById('role-search');
  const clearBtn      = document.getElementById('clear-search');
  const appHeader     = document.getElementById('app-header');
  const appNameEl     = document.getElementById('app-name');
  const draftBadge    = document.getElementById('draft-badge');
  const appRoleCount  = document.getElementById('app-role-count');
  const emptyState    = document.getElementById('empty-state');
  const tableCard     = document.getElementById('table-card');
  const rolesBody     = document.getElementById('roles-body');
  const noResults     = document.getElementById('no-results');
  const noResultsTerm = document.getElementById('no-results-term');
  const resultCount   = document.getElementById('result-count');
  const coveredHeader = document.getElementById('covered-header');
  const dataTimestamp = document.getElementById('data-timestamp');

  // ── Manager/Staff feature refs ───────────────────────────────────────
  const announcementsBanner = document.getElementById('announcements-banner');
  const roleFilterStrip     = document.getElementById('role-filter-strip');
  const managerActions      = document.getElementById('manager-actions');
  const btnPrint            = document.getElementById('btn-print');
  const btnCopy             = document.getElementById('btn-copy');
  const compareAppSelect    = document.getElementById('compare-app-select');
  const btnChangelog        = document.getElementById('btn-changelog');
  const riskHeader          = document.getElementById('risk-header');
  const phiAlert            = document.getElementById('phi-alert');
  const uarStatusStrip      = document.getElementById('uar-status-strip');
  const phiAlertDismissBtn  = document.getElementById('phi-alert-dismiss');
  const btnCompareRoles     = document.getElementById('btn-compare-roles');
  const roleComparePanel    = document.getElementById('role-compare-panel');
  const comparePanelClose   = document.getElementById('compare-panel-close');
  const compareRoleA        = document.getElementById('compare-role-a');
  const compareRoleB        = document.getElementById('compare-role-b');
  const compareResult       = document.getElementById('compare-result');

  // ── Modal refs ───────────────────────────────────────────────────────
  const statModal      = document.getElementById('stat-modal');
  const modalTitle     = document.getElementById('modal-title');
  const modalBody      = document.getElementById('modal-body');
  const modalClose     = document.getElementById('modal-close');
  const modalSearch    = document.getElementById('modal-search');
  const modalCount     = document.getElementById('modal-count');
  const modalSearchWrap = document.getElementById('modal-search-wrap');
  const statBtnApps    = document.getElementById('stat-btn-apps');
  const statBtnRoles   = document.getElementById('stat-btn-roles');
  const statBtnPhi     = document.getElementById('stat-btn-phi');

  // ── State ────────────────────────────────────────────────────────────
  let currentApp             = null;
  let currentMode            = null;
  let managerFilter          = 'all';
  let phiAlertDismissed      = false;
  let lastFocusedBeforeModal = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let insightsCharts = {};

  // ── Mode selection ───────────────────────────────────────────────────
  function selectMode(mode) {
    currentMode = mode;

    if (mode === 'insights') {
      scrollLanding.classList.add('hidden');
      appNavBar.classList.remove('hidden');
      appContent.classList.add('hidden');
      window.scrollTo(0, 0);
      insightsContent.classList.remove('hidden', 'entering');
      void insightsContent.offsetWidth;
      insightsContent.classList.add('entering');
      renderInsightsView();
      return;
    }

    insightsContent.classList.add('hidden');
    modeIndicator.textContent = mode === 'manager' ? 'Manager View' : 'Staff View';

    introText.innerHTML = mode === 'manager'
      ? '<strong>Managers:</strong> Select an application to view all roles, descriptions, and admin status for your team.'
      : '<strong>Staff:</strong> Select your application, then search for your role name to see your access level.';

    emptySubText.textContent = mode === 'manager'
      ? 'Select an application from the dropdown to view all roles.'
      : 'Select your application, then type your role name in the search box.';

    // Reset mode-specific state
    managerFilter     = 'all';
    phiAlertDismissed = false;
    phiAlert.classList.add('hidden');
    roleComparePanel.classList.add('hidden');
    compareResult.classList.add('hidden');
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));

    if (mode === 'manager') {
      renderAnnouncements();
    } else {
      announcementsBanner.classList.add('hidden');
    }

    scrollLanding.classList.add('hidden');
    appNavBar.classList.remove('hidden');
    window.scrollTo(0, 0);
    appContent.classList.remove('hidden', 'entering');
    void appContent.offsetWidth; // force reflow to re-trigger animation
    appContent.classList.add('entering');

    setTimeout(() => appSelect.focus(), 350);
  }

  function goBack() {
    if (currentMode === 'insights') {
      insightsContent.classList.add('hidden');
      insightsContent.classList.remove('entering');
      appNavBar.classList.add('hidden');
      scrollLanding.classList.remove('hidden');
      document.title = 'IAM Access Atlas | Clover Health IAM';
      currentMode = null;
      Object.values(insightsCharts).forEach(c => c.destroy());
      insightsCharts = {};
      setTimeout(() => {
        document.getElementById('mode-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    appContent.classList.add('hidden');
    appContent.classList.remove('entering');
    appNavBar.classList.add('hidden');
    scrollLanding.classList.remove('hidden');
    document.title = 'IAM Access Atlas | Clover Health IAM';
    setTimeout(() => {
      document.getElementById('mode-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    currentApp        = null;
    currentMode       = null;
    managerFilter     = 'all';
    phiAlertDismissed = false;
    appSelect.value    = '';
    roleSearch.value   = '';
    roleSearch.disabled = true;
    clearBtn.classList.add('hidden');
    phiAlert.classList.add('hidden');
    roleComparePanel.classList.add('hidden');
    roleFilterStrip.classList.add('hidden');
    managerActions.classList.add('hidden');
    uarStatusStrip.classList.add('hidden');
    announcementsBanner.classList.add('hidden');
    showEmptyState();
  }

  // ── Stat counter animation ────────────────────────────────────────────
  function animateCounter(el, target, duration) {
    if (!el) return;
    if (prefersReducedMotion) { el.textContent = target; return; }
    const start = performance.now();
    requestAnimationFrame(function tick(now) {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(ease * target);
      if (t < 1) requestAnimationFrame(tick);
    });
  }

  // ── Scroll-triggered fade-in ──────────────────────────────────────────
  function setupFadeIn() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // ── Init ─────────────────────────────────────────────────────────────
  function init() {
    if (typeof APP_DATA === 'undefined') {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('.empty-title').textContent = 'Role data unavailable';
      emptyState.querySelector('.empty-sub').innerHTML =
        'data.js could not be loaded. <a href="mailto:iam@cloverhealth.com?subject=IAM+Access+Atlas+Error">Report this to the IAM team \u2197</a>.';
      return;
    }

    if (!APP_DATA.applications || APP_DATA.applications.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('.empty-title').textContent = 'No applications found';
      emptyState.querySelector('.empty-sub').textContent =
        'data.js loaded but contains no applications. Run build_from_csv.py to regenerate.';
      return;
    }

    // Populate timestamp
    if (APP_DATA.generated) {
      dataTimestamp.textContent = 'Last updated: ' + APP_DATA.generated;
    }

    // Animated stat counters
    const totalApps  = APP_DATA.applications.length;
    const totalRoles = APP_DATA.applications.reduce((s, a) => s + a.roles.length, 0);
    const phiApps    = APP_DATA.applications.filter(
      a => a.roles.some(r => r.covered !== null && r.covered !== undefined)
    ).length;
    // Trigger counters when stats section scrolls into view
    let countersStarted = false;
    const statsObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !countersStarted) {
        countersStarted = true;
        animateCounter(document.getElementById('stat-apps'),  totalApps,  1200);
        animateCounter(document.getElementById('stat-roles'), totalRoles, 1500);
        animateCounter(document.getElementById('stat-phi'),   phiApps,    1000);
        statsObserver.disconnect();
      }
    }, { threshold: 0.25 });
    statsObserver.observe(document.getElementById('stats-section'));

    // Hero scroll fade (skip for prefers-reduced-motion users)
    if (!prefersReducedMotion) {
      const heroEl = document.getElementById('hero-section');
      window.addEventListener('scroll', () => {
        if (scrollLanding.classList.contains('hidden')) return;
        heroEl.style.opacity = String(Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.55)));
      }, { passive: true });
    }

    // Sort apps alphabetically and populate dropdown
    const apps = [...APP_DATA.applications].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    apps.forEach(app => {
      const opt = document.createElement('option');
      opt.value = app.name;
      opt.textContent = app.name + (app.draft ? ' (DRAFT)' : '');
      appSelect.appendChild(opt);
    });

    // Event listeners
    btnManager.addEventListener('click', () => selectMode('manager'));
    btnStaff.addEventListener('click',   () => selectMode('staff'));
    if (btnInsights) btnInsights.addEventListener('click', () => selectMode('insights'));
    backBtn.addEventListener('click', goBack);
    if (insightsBackBtn) insightsBackBtn.addEventListener('click', goBack);
    appSelect.addEventListener('change', onAppChange);
    roleSearch.addEventListener('input', onSearch);
    clearBtn.addEventListener('click', clearSearch);

    // Stat modal triggers
    const openStat = (type) => () => openStatModal(type);
    const keyActivate = (type) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStatModal(type); } };
    statBtnApps.addEventListener('click',   openStat('apps'));
    statBtnApps.addEventListener('keydown', keyActivate('apps'));
    statBtnRoles.addEventListener('click',   openStat('roles'));
    statBtnRoles.addEventListener('keydown', keyActivate('roles'));
    statBtnPhi.addEventListener('click',   openStat('phi'));
    statBtnPhi.addEventListener('keydown', keyActivate('phi'));

    // Modal close
    modalClose.addEventListener('click', closeModal);
    statModal.addEventListener('click', e => { if (e.target === statModal) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!statModal.classList.contains('hidden')) {
          closeModal();
        } else if (!roleComparePanel.classList.contains('hidden')) {
          roleComparePanel.classList.add('hidden');
          btnCompareRoles.textContent = 'Compare two roles';
          btnCompareRoles.focus();
        }
      } else if (
        e.key === '/' &&
        document.activeElement !== roleSearch &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'SELECT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        !roleSearch.disabled &&
        statModal.classList.contains('hidden')
      ) {
        e.preventDefault();
        roleSearch.focus();
      }
    });

    // Modal search
    modalSearch.addEventListener('input', () => filterModal(modalSearch.value.trim()));

    // Manager: filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        managerFilter = pill.dataset.filter;
        document.querySelectorAll('.filter-pill').forEach(p => {
          const isSelected = p === pill;
          p.classList.toggle('active', isSelected);
          p.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
        if (currentApp) renderApp(currentApp, roleSearch.value.trim());
      });
    });

    // Manager: print
    btnPrint.addEventListener('click', () => window.print());

    // Manager: copy table
    btnCopy.addEventListener('click', () => {
      if (!currentApp) return;
      const term = roleSearch.value.trim().toLowerCase();
      let roles = term ? currentApp.roles.filter(r => r.role && matchRole(r.role.toLowerCase(), term)) : [...currentApp.roles];
      if (managerFilter === 'admin') roles = roles.filter(r => r.admin === true);
      else if (managerFilter === 'phi') roles = roles.filter(r => r.covered === true);
      const header = 'Role\tDescription\tAdmin\tCovered (PHI)';
      const rows = roles.map(r =>
        [r.role || '', r.description || '', r.admin == null ? '—' : (r.admin ? 'Yes' : 'No'), r.covered == null ? '—' : (r.covered ? 'Yes' : 'No')].join('\t')
      );
      navigator.clipboard.writeText([header, ...rows].join('\n')).then(() => {
        const orig = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        setTimeout(() => { btnCopy.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Copy table'; }, 2000);
      });
    });

    // Manager: app comparison
    compareAppSelect.addEventListener('change', () => {
      const selected = compareAppSelect.value;
      if (!selected || !currentApp) { compareAppSelect.value = ''; return; }
      const app2 = APP_DATA.applications.find(a => a.name === selected);
      if (app2) openComparisonModal(currentApp, app2);
      compareAppSelect.value = '';
    });

    // Manager: changelog
    btnChangelog.addEventListener('click', openChangelogModal);

    // Staff: PHI alert dismiss
    phiAlertDismissBtn.addEventListener('click', () => {
      phiAlertDismissed = true;
      phiAlert.classList.add('hidden');
    });

    // Staff: compare roles toggle
    btnCompareRoles.addEventListener('click', () => {
      const isHidden = roleComparePanel.classList.contains('hidden');
      if (isHidden) {
        roleComparePanel.classList.remove('hidden');
        btnCompareRoles.textContent = 'Hide comparison';
      } else {
        roleComparePanel.classList.add('hidden');
        btnCompareRoles.textContent = 'Compare two roles';
      }
    });

    comparePanelClose.addEventListener('click', () => {
      roleComparePanel.classList.add('hidden');
      btnCompareRoles.textContent = 'Compare two roles';
    });

    compareRoleA.addEventListener('change', renderRoleComparison);
    compareRoleB.addEventListener('change', renderRoleComparison);
  }

  // ── App selection ────────────────────────────────────────────────────
  function onAppChange() {
    const selected = appSelect.value;

    if (!selected) {
      currentApp = null;
      roleSearch.value = '';
      roleSearch.disabled = true;
      clearBtn.classList.add('hidden');
      showEmptyState();
      return;
    }

    currentApp = APP_DATA.applications.find(a => a.name === selected) || null;

    if (!currentApp) {
      showEmptyState();
      return;
    }

    roleSearch.disabled = false;
    roleSearch.value = '';
    clearBtn.classList.add('hidden');

    // Reset comparison panel when app changes
    roleComparePanel.classList.add('hidden');
    compareResult.classList.add('hidden');
    populateRoleCompareSelects(currentApp);

    // Populate compare-app-select (all other apps)
    compareAppSelect.innerHTML = '<option value="">Compare with app\u2026</option>';
    const sorted = [...APP_DATA.applications].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(app => {
      if (app.name === currentApp.name) return;
      const opt = document.createElement('option');
      opt.value = app.name;
      opt.textContent = app.name + (app.draft ? ' (DRAFT)' : '');
      compareAppSelect.appendChild(opt);
    });

    renderApp(currentApp, '');
  }

  // ── Search ───────────────────────────────────────────────────────────
  function onSearch() {
    if (!currentApp) return;
    const term = roleSearch.value.trim();
    clearBtn.classList.toggle('hidden', term === '');
    renderApp(currentApp, term);
  }

  function clearSearch() {
    roleSearch.value = '';
    clearBtn.classList.add('hidden');
    roleSearch.focus();
    if (currentApp) renderApp(currentApp, '');
  }

  // ── Render ───────────────────────────────────────────────────────────
  function renderApp(app, searchTerm) {
    // App header
    appNameEl.textContent = app.name;
    document.title = app.name + ' — IAM Access Atlas';
    draftBadge.classList.toggle('hidden', !app.draft);
    appHeader.classList.remove('hidden');

    // Print header
    const printTitle = document.getElementById('print-app-title');
    const printMeta  = document.getElementById('print-meta');
    if (printTitle) printTitle.textContent = app.name;
    if (printMeta)  printMeta.textContent  = 'Generated: ' + (APP_DATA.generated || '\u2014') + '  \u00B7  IAM Access Atlas \u00B7 Clover Health';

    // Determine if any role in this app uses the "covered" column
    const hasCovered = app.roles.some(r => r.covered !== null && r.covered !== undefined);
    coveredHeader.classList.toggle('hidden', !hasCovered);

    // Also update all covered cells
    const coverColCells = document.querySelectorAll('.covered-cell');
    coverColCells.forEach(c => c.classList.toggle('hidden', !hasCovered));

    // Show/hide mode-specific UI elements
    if (currentMode === 'manager') {
      riskHeader.classList.add('hidden');
      roleFilterStrip.classList.remove('hidden');
      managerActions.classList.remove('hidden');
      btnCompareRoles.classList.add('hidden');
      renderUarStatus(findUarReview(app.name));
    } else {
      riskHeader.classList.remove('hidden');
      roleFilterStrip.classList.add('hidden');
      managerActions.classList.add('hidden');
      btnCompareRoles.classList.remove('hidden');
      uarStatusStrip.classList.add('hidden');
    }

    // Filter roles by search term
    const term = searchTerm.toLowerCase();
    let filtered = term
      ? app.roles.filter(r => r.role && matchRole(r.role.toLowerCase(), term))
      : [...app.roles];

    // Manager: apply additional filter pill
    if (currentMode === 'manager' && managerFilter !== 'all') {
      if (managerFilter === 'admin') filtered = filtered.filter(r => r.admin === true);
      else if (managerFilter === 'phi') filtered = filtered.filter(r => r.covered === true);
    }

    // Total role count line
    if (searchTerm) {
      appRoleCount.textContent =
        filtered.length + ' of ' + app.roles.length + ' role' +
        (app.roles.length !== 1 ? 's' : '') + ' match "' + searchTerm + '"';
    } else {
      appRoleCount.textContent =
        app.roles.length + ' role' + (app.roles.length !== 1 ? 's' : '');
    }

    // Build table rows
    rolesBody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.add('hidden');
      tableCard.classList.remove('hidden');
      noResults.classList.remove('hidden');
      noResultsTerm.textContent = '"' + searchTerm + '"';
      resultCount.textContent = '';
      phiAlert.classList.add('hidden');
      return;
    }

    noResults.classList.add('hidden');

    filtered.forEach(r => {
      const tr = document.createElement('tr');

      // Role name
      const tdRole = document.createElement('td');
      tdRole.className = 'col-role';
      tdRole.textContent = r.role;
      tr.appendChild(tdRole);

      // Description
      const tdDesc = document.createElement('td');
      tdDesc.className = 'col-description';
      tdDesc.textContent = r.description || '—';
      tr.appendChild(tdDesc);

      // Admin badge
      const tdAdmin = document.createElement('td');
      tdAdmin.className = 'col-admin';
      tdAdmin.appendChild(makeBadge(r.admin, 'admin'));
      tr.appendChild(tdAdmin);

      // Covered badge (conditionally shown)
      const tdCovered = document.createElement('td');
      tdCovered.className = 'col-covered covered-cell' + (hasCovered ? '' : ' hidden');
      if (hasCovered) {
        tdCovered.appendChild(makeBadge(r.covered, 'covered'));
      } else {
        tdCovered.textContent = '';
      }
      tr.appendChild(tdCovered);

      // Risk badge — staff mode only
      if (currentMode === 'staff') {
        const tdRisk = document.createElement('td');
        tdRisk.className = 'col-risk';
        tdRisk.appendChild(makeRiskBadge(r.admin, r.covered));
        tr.appendChild(tdRisk);
      }

      rolesBody.appendChild(tr);
    });

    // PHI awareness alert — staff mode only
    if (currentMode === 'staff' && !phiAlertDismissed) {
      const hasPhi = filtered.some(r => r.covered === true);
      phiAlert.classList.toggle('hidden', !hasPhi);
    }

    // Result count footer
    resultCount.textContent = filtered.length + ' role' + (filtered.length !== 1 ? 's' : '') +
      (searchTerm ? ' shown' : '');

    // Show table
    emptyState.classList.add('hidden');
    tableCard.classList.remove('hidden');
  }

  // ── Role match (supports * wildcard) ────────────────────────────────
  function matchRole(name, term) {
    if (!term.includes('*')) return name.includes(term);
    const parts = term.split('*').map(p => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(parts.join('.*')).test(name);
  }

  // ── Badge helper ─────────────────────────────────────────────────────
  function makeBadge(value, type) {
    const span = document.createElement('span');
    span.className = 'badge';

    if (value === null || value === undefined) {
      span.textContent = '—';
      span.style.color = '#A0A0A0';
      span.style.fontSize = '1rem';
      return span;
    }

    if (type === 'admin') {
      if (value === true) {
        span.classList.add('badge-admin-yes');
        span.textContent = 'Yes';
      } else {
        span.classList.add('badge-admin-no');
        span.textContent = 'No';
      }
    } else if (type === 'covered') {
      if (value === true) {
        span.classList.add('badge-covered-yes');
        span.textContent = 'Yes';
      } else {
        span.classList.add('badge-covered-no');
        span.textContent = 'No';
      }
    }

    return span;
  }

  // ── Risk badge helper ─────────────────────────────────────────────────
  function makeRiskBadge(admin, covered) {
    const span = document.createElement('span');
    span.className = 'badge';

    if ((admin === null || admin === undefined) && (covered === null || covered === undefined)) {
      span.textContent = '—';
      span.style.color = '#A0A0A0';
      span.style.fontSize = '1rem';
      return span;
    }

    if (admin === true && covered === true) {
      span.classList.add('badge-risk-high');
      span.textContent = 'High Risk';
    } else if (admin === true) {
      span.classList.add('badge-risk-elevated');
      span.textContent = 'Elevated';
    } else if (covered === true) {
      span.classList.add('badge-risk-sensitive');
      span.textContent = 'Sensitive';
    } else {
      span.classList.add('badge-risk-standard');
      span.textContent = 'Standard';
    }

    return span;
  }

  // ── Announcements ─────────────────────────────────────────────────────
  function renderAnnouncements() {
    if (!APP_DATA.announcements || APP_DATA.announcements.length === 0) {
      announcementsBanner.classList.add('hidden');
      return;
    }
    const dismissed = JSON.parse(sessionStorage.getItem('iam_dismissed_announcements') || '[]');
    const visible = APP_DATA.announcements.filter(a => !dismissed.includes(a.id));
    if (visible.length === 0) {
      announcementsBanner.classList.add('hidden');
      return;
    }

    announcementsBanner.innerHTML = '';
    visible.forEach(announcement => {
      const row = document.createElement('div');
      row.className = 'announcement-row' + (announcement.type === 'warning' ? ' warning' : '');

      const dateSpan = document.createElement('span');
      dateSpan.className = 'announcement-date';
      dateSpan.textContent = announcement.date;
      row.appendChild(dateSpan);

      const textSpan = document.createElement('span');
      textSpan.className = 'announcement-text';
      textSpan.textContent = announcement.text;
      row.appendChild(textSpan);

      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'announcement-dismiss';
      dismissBtn.setAttribute('aria-label', 'Dismiss');
      dismissBtn.innerHTML = '&times;';
      dismissBtn.addEventListener('click', () => {
        const d = JSON.parse(sessionStorage.getItem('iam_dismissed_announcements') || '[]');
        d.push(announcement.id);
        sessionStorage.setItem('iam_dismissed_announcements', JSON.stringify(d));
        row.remove();
        if (announcementsBanner.children.length === 0) announcementsBanner.classList.add('hidden');
      });
      row.appendChild(dismissBtn);

      announcementsBanner.appendChild(row);
    });
    announcementsBanner.classList.remove('hidden');
  }

  // ── UAR status ────────────────────────────────────────────────────────

  function findUarReview(appName) {
    if (typeof UAR_DATA === 'undefined' || !UAR_DATA.reviews) return null;
    const needle = appName.toLowerCase();

    const matches = UAR_DATA.reviews.filter(r => {
      if (!r.appName) return false;
      const hay = r.appName.toLowerCase();
      if (hay === needle) return true;
      // One name starts with the other (min 3 chars to avoid noise)
      const shorter = hay.length <= needle.length ? hay : needle;
      const longer  = hay.length <= needle.length ? needle : hay;
      return shorter.length >= 3 && longer.startsWith(shorter);
    });

    if (matches.length === 0) return null;

    // Active reviews first, then most recent by launch date
    matches.sort((a, b) => {
      const aActive = a.statusCategory !== 'done' ? 0 : 1;
      const bActive = b.statusCategory !== 'done' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (b.launchDate || '').localeCompare(a.launchDate || '');
    });

    return matches[0];
  }

  function renderUarStatus(review) {
    if (!uarStatusStrip) return;
    if (!review) {
      uarStatusStrip.classList.add('hidden');
      return;
    }

    const catClass = { todo: 'uar-todo', in_progress: 'uar-in-progress', done: 'uar-done' };
    uarStatusStrip.className = 'uar-status-strip ' + (catClass[review.statusCategory] || 'uar-in-progress');

    const parts = [];
    parts.push('<span class="uar-dot"></span>');
    parts.push('UAR: <span class="uar-status-label">' + review.status + '</span>');

    if (review.launchDate) {
      parts.push('<span class="uar-meta">\u00B7 Launched ' + formatDate(review.launchDate) + '</span>');
    }
    if (review.assignee) {
      parts.push('<span class="uar-meta">\u00B7 ' + review.assignee.split(' ')[0] + '</span>');
    }

    parts.push(
      '<a class="uar-link" href="' + review.url + '" target="_blank" rel="noopener noreferrer">' +
      review.key + ' \u2197</a>'
    );

    if (review.isSox)     parts.push('<span class="badge badge-sox">SoX</span>');
    if (review.isHiTrust) parts.push('<span class="badge badge-hitrust">HiTrust</span>');

    uarStatusStrip.innerHTML = parts.join(' ');
    uarStatusStrip.classList.remove('hidden');
  }

  function formatDate(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10);
  }

  // ── Manager: app comparison modal ────────────────────────────────────
  function openComparisonModal(app1, app2) {
    modalTitle.textContent = app1.name + ' vs ' + app2.name;
    modalSearchWrap.classList.add('hidden');
    modalSearch.value = '';
    modalCount.textContent = '';

    modalBody.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'comparison-grid';

    [app1, app2].forEach(app => {
      const col = document.createElement('div');
      col.className = 'comparison-col';

      const colHeader = document.createElement('div');
      colHeader.className = 'comparison-col-header';
      colHeader.textContent = app.name;
      col.appendChild(colHeader);

      app.roles.forEach(r => {
        const row = document.createElement('div');
        row.className = 'comparison-role-row';

        const nameEl = document.createElement('div');
        nameEl.className = 'comparison-role-name';
        nameEl.textContent = r.role || '—';
        row.appendChild(nameEl);

        const badges = document.createElement('div');
        badges.className = 'comparison-role-badges';
        badges.appendChild(makeBadge(r.admin, 'admin'));
        if (r.covered !== null && r.covered !== undefined) badges.appendChild(makeBadge(r.covered, 'covered'));
        row.appendChild(badges);

        col.appendChild(row);
      });

      grid.appendChild(col);
    });

    modalBody.appendChild(grid);
    lastFocusedBeforeModal = document.activeElement;
    statModal.classList.remove('hidden');
    statModal.addEventListener('keydown', handleModalKeydown);
    setTimeout(() => modalClose.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  // ── Manager: changelog modal ──────────────────────────────────────────
  function openChangelogModal() {
    modalTitle.textContent = 'Recent Role Changes';
    modalSearchWrap.classList.add('hidden');
    modalSearch.value = '';
    modalBody.innerHTML = '';

    if (!APP_DATA.changelog || APP_DATA.changelog.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:2rem 1.5rem;text-align:center;color:#8A8A8A;font-size:0.875rem;';
      empty.textContent = 'No recent changes recorded.';
      modalBody.appendChild(empty);
      modalCount.textContent = '';
    } else {
      const sorted = [...APP_DATA.changelog].sort((a, b) => b.date.localeCompare(a.date));
      sorted.forEach(entry => {
        const row = document.createElement('div');
        row.className = 'changelog-row';

        const dateEl = document.createElement('span');
        dateEl.className = 'changelog-date';
        dateEl.textContent = entry.date;
        row.appendChild(dateEl);

        const appEl = document.createElement('span');
        appEl.className = 'changelog-app';
        appEl.textContent = entry.appName;
        row.appendChild(appEl);

        const roleEl = document.createElement('span');
        roleEl.className = 'changelog-role';
        roleEl.textContent = entry.role;
        row.appendChild(roleEl);

        const changeEl = document.createElement('span');
        changeEl.className = 'changelog-change';
        changeEl.textContent = entry.change;
        row.appendChild(changeEl);

        const typeBadge = document.createElement('span');
        typeBadge.className = 'badge badge-cl-' + (entry.type || 'updated');
        typeBadge.textContent = entry.type ? (entry.type.charAt(0).toUpperCase() + entry.type.slice(1)) : 'Updated';
        row.appendChild(typeBadge);

        modalBody.appendChild(row);
      });
      modalCount.textContent = sorted.length + ' entr' + (sorted.length !== 1 ? 'ies' : 'y');
    }

    lastFocusedBeforeModal = document.activeElement;
    statModal.classList.remove('hidden');
    statModal.addEventListener('keydown', handleModalKeydown);
    setTimeout(() => modalClose.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  // ── Staff: role comparison panel ──────────────────────────────────────
  function populateRoleCompareSelects(app) {
    const placeholder = '<option value="">Select role\u2026</option>';
    compareRoleA.innerHTML = placeholder;
    compareRoleB.innerHTML = placeholder;
    app.roles.forEach(r => {
      if (!r.role) return;
      const optA = document.createElement('option');
      optA.value = r.role;
      optA.textContent = r.role;
      compareRoleA.appendChild(optA);

      const optB = optA.cloneNode(true);
      compareRoleB.appendChild(optB);
    });
  }

  function renderRoleComparison() {
    const nameA = compareRoleA.value;
    const nameB = compareRoleB.value;
    if (!nameA || !nameB || nameA === nameB) {
      compareResult.classList.add('hidden');
      return;
    }

    const roleA = currentApp.roles.find(r => r.role === nameA);
    const roleB = currentApp.roles.find(r => r.role === nameB);
    if (!roleA || !roleB) return;

    compareResult.innerHTML = '';
    compareResult.classList.remove('hidden');

    [roleA, roleB].forEach(r => {
      const card = document.createElement('div');
      card.className = 'compare-card';

      const title = document.createElement('div');
      title.className = 'compare-card-title';
      title.textContent = r.role;
      card.appendChild(title);

      const fields = [
        { label: 'Description', value: r.description || '—', isText: true },
        { label: 'Admin',       value: null,   badge: makeBadge(r.admin, 'admin') },
        { label: 'PHI Covered', value: null,   badge: makeBadge(r.covered, 'covered') },
        { label: 'Risk Level',  value: null,   badge: makeRiskBadge(r.admin, r.covered) },
      ];

      fields.forEach(f => {
        const field = document.createElement('div');
        field.className = 'compare-card-field';

        const label = document.createElement('span');
        label.className = 'compare-field-label';
        label.textContent = f.label;
        field.appendChild(label);

        if (f.isText) {
          const val = document.createElement('span');
          val.className = 'compare-field-value';
          val.textContent = f.value;
          field.appendChild(val);
        } else {
          field.appendChild(f.badge);
        }

        card.appendChild(field);
      });

      compareResult.appendChild(card);
    });
  }

  // ── State helpers ─────────────────────────────────────────────────────
  function showEmptyState() {
    appHeader.classList.add('hidden');
    tableCard.classList.add('hidden');
    emptyState.classList.remove('hidden');
    resultCount.textContent = '';
    roleFilterStrip.classList.add('hidden');
    managerActions.classList.add('hidden');
    uarStatusStrip.classList.add('hidden');
    roleComparePanel.classList.add('hidden');
    phiAlert.classList.add('hidden');
  }

  function showError(msg) {
    emptyState.classList.remove('hidden');
    emptyState.querySelector('.empty-title').textContent = 'Error';
    emptyState.querySelector('.empty-sub').textContent = msg;
  }

  // ── Modal focus helpers ───────────────────────────────────────────────
  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
      let node = el;
      while (node && node !== container) {
        if (node.classList && node.classList.contains('hidden')) return false;
        const s = window.getComputedStyle(node);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
        node = node.parentElement;
      }
      return true;
    });
  }

  function handleModalKeydown(e) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(statModal);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  // ── Stat modals ───────────────────────────────────────────────────────
  let currentModalType = null;
  let allModalItems    = [];   // cache for search filtering

  function openStatModal(type) {
    currentModalType = type;
    modalSearch.value = '';

    if (type === 'apps') {
      modalTitle.textContent = 'All Applications (' + APP_DATA.applications.length + ')';
      allModalItems = [...APP_DATA.applications].sort((a, b) => a.name.localeCompare(b.name));
      renderAppsModal(allModalItems);
    } else if (type === 'roles') {
      const flat = [];
      APP_DATA.applications.forEach(app => {
        app.roles.forEach(r => flat.push({ app: app.name, role: r.role, description: r.description, admin: r.admin, covered: r.covered }));
      });
      flat.sort((a, b) => a.app.localeCompare(b.app) || (a.role || '').localeCompare(b.role || ''));
      const total = APP_DATA.applications.reduce((s, a) => s + a.roles.length, 0);
      modalTitle.textContent = 'All Roles (' + total + ')';
      allModalItems = flat;
      renderRolesModal(flat);
    } else if (type === 'phi') {
      const phiApps = APP_DATA.applications.filter(
        a => a.roles.some(r => r.covered !== null && r.covered !== undefined)
      ).sort((a, b) => a.name.localeCompare(b.name));
      modalTitle.textContent = 'PHI-Covered Applications (' + phiApps.length + ')';
      allModalItems = phiApps;
      renderPhiModal(phiApps);
    }

    lastFocusedBeforeModal = document.activeElement;
    statModal.classList.remove('hidden');
    statModal.addEventListener('keydown', handleModalKeydown);
    setTimeout(() => modalSearch.focus(), 100);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    statModal.classList.add('hidden');
    statModal.removeEventListener('keydown', handleModalKeydown);
    modalSearchWrap.classList.remove('hidden');
    compareAppSelect.value = '';
    currentModalType = null;
    allModalItems    = [];
    document.body.style.overflow = '';
    if (lastFocusedBeforeModal) {
      lastFocusedBeforeModal.focus();
      lastFocusedBeforeModal = null;
    }
  }

  function navigateToApp(appName) {
    closeModal();
    if (!currentMode) selectMode('manager');
    appSelect.value = appName;
    onAppChange();
    // Scroll into view
    setTimeout(() => appSelect.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);
  }

  function renderAppsModal(apps) {
    modalBody.innerHTML = '';
    apps.forEach(app => {
      const div = document.createElement('div');
      div.className = 'modal-app-item';
      div.setAttribute('role', 'button');
      div.setAttribute('tabindex', '0');
      div.setAttribute('title', 'Open ' + app.name);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'modal-app-name';
      nameSpan.textContent = app.name;
      div.appendChild(nameSpan);

      if (app.draft) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-draft';
        badge.textContent = 'DRAFT';
        div.appendChild(badge);
      }

      const meta = document.createElement('span');
      meta.className = 'modal-app-meta';
      meta.textContent = app.roles.length + ' role' + (app.roles.length !== 1 ? 's' : '');
      div.appendChild(meta);

      const arrow = document.createElement('span');
      arrow.className = 'modal-app-arrow';
      arrow.textContent = '→';
      div.appendChild(arrow);

      div.addEventListener('click', () => navigateToApp(app.name));
      div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToApp(app.name); } });
      modalBody.appendChild(div);
    });
    modalCount.textContent = apps.length + ' application' + (apps.length !== 1 ? 's' : '');
  }

  function renderRolesModal(roles) {
    modalBody.innerHTML = '';

    // Header row
    const header = document.createElement('div');
    header.className = 'modal-roles-header';
    ['Application', 'Role', 'Admin', 'Covered'].forEach(h => {
      const span = document.createElement('span');
      span.textContent = h;
      header.appendChild(span);
    });
    modalBody.appendChild(header);

    roles.forEach(r => {
      const row = document.createElement('div');
      row.className = 'modal-role-row';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('title', 'Open ' + r.app);
      row.style.cursor = 'pointer';

      const appSpan = document.createElement('span');
      appSpan.className = 'modal-role-app';
      appSpan.textContent = r.app;
      row.appendChild(appSpan);

      const roleSpan = document.createElement('span');
      roleSpan.className = 'modal-role-name';
      roleSpan.textContent = r.role || '—';
      row.appendChild(roleSpan);

      row.appendChild(makeBadge(r.admin, 'admin'));

      const covCell = document.createElement('span');
      if (r.covered !== null && r.covered !== undefined) {
        covCell.appendChild(makeBadge(r.covered, 'covered'));
      } else {
        covCell.style.color = '#A0A0A0';
        covCell.textContent = '—';
      }
      row.appendChild(covCell);

      row.addEventListener('click', () => navigateToApp(r.app));
      row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToApp(r.app); } });
      modalBody.appendChild(row);
    });

    modalCount.textContent = roles.length + ' role' + (roles.length !== 1 ? 's' : '');
  }

  function renderPhiModal(apps) {
    modalBody.innerHTML = '';
    apps.forEach(app => {
      const coveredCount = app.roles.filter(r => r.covered === true).length;
      const div = document.createElement('div');
      div.className = 'modal-app-item';
      div.setAttribute('role', 'button');
      div.setAttribute('tabindex', '0');
      div.setAttribute('title', 'Open ' + app.name);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'modal-app-name';
      nameSpan.textContent = app.name;
      div.appendChild(nameSpan);

      if (app.draft) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-draft';
        badge.textContent = 'DRAFT';
        div.appendChild(badge);
      }

      const meta = document.createElement('span');
      meta.className = 'modal-app-meta';
      meta.textContent = coveredCount + ' covered role' + (coveredCount !== 1 ? 's' : '');
      div.appendChild(meta);

      const arrow = document.createElement('span');
      arrow.className = 'modal-app-arrow';
      arrow.textContent = '→';
      div.appendChild(arrow);

      div.addEventListener('click', () => navigateToApp(app.name));
      div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToApp(app.name); } });
      modalBody.appendChild(div);
    });
    modalCount.textContent = apps.length + ' application' + (apps.length !== 1 ? 's' : '') + ' with PHI-covered roles';
  }

  function filterModal(term) {
    const t = term.toLowerCase();
    if (currentModalType === 'apps' || currentModalType === 'phi') {
      const filtered = t ? allModalItems.filter(a => a.name.toLowerCase().includes(t)) : allModalItems;
      if (currentModalType === 'apps') renderAppsModal(filtered);
      else renderPhiModal(filtered);
    } else if (currentModalType === 'roles') {
      const filtered = t
        ? allModalItems.filter(r =>
            (r.app || '').toLowerCase().includes(t) ||
            (r.role || '').toLowerCase().includes(t) ||
            (r.description || '').toLowerCase().includes(t)
          )
        : allModalItems;
      renderRolesModal(filtered);
    }
  }

  // ── Insights: compute catalog-wide metrics ────────────────────────────
  function computeInsightsData() {
    const apps = APP_DATA.applications;
    const totalApps  = apps.length;
    const totalRoles = apps.reduce((s, a) => s + a.roles.length, 0);
    const phiCoveredApps = apps.filter(a => a.roles.some(r => r.covered === true)).length;
    const adminRoles     = apps.reduce((s, a) => s + a.roles.filter(r => r.admin === true).length, 0);
    const highRiskRoles  = apps.reduce((s, a) =>
      s + a.roles.filter(r => r.admin === true && r.covered === true).length, 0);

    // PHI coverage buckets (per app)
    let phiCovered = 0, phiNotCovered = 0, phiUnknown = 0;
    apps.forEach(a => {
      if (a.roles.some(r => r.covered === true))      phiCovered++;
      else if (a.roles.some(r => r.covered === false)) phiNotCovered++;
      else                                              phiUnknown++;
    });

    // Risk distribution (per role)
    let riskHigh = 0, riskElevated = 0, riskSensitive = 0, riskStandard = 0, riskUnknown = 0;
    apps.forEach(a => {
      a.roles.forEach(r => {
        const aNull = r.admin === null || r.admin === undefined;
        const cNull = r.covered === null || r.covered === undefined;
        if (aNull && cNull)                          { riskUnknown++; return; }
        if (r.admin === true && r.covered === true)    riskHigh++;
        else if (r.admin === true)                     riskElevated++;
        else if (r.covered === true)                   riskSensitive++;
        else                                           riskStandard++;
      });
    });

    // Top 10 apps by role count
    const topByRoleCount = [...apps]
      .sort((a, b) => b.roles.length - a.roles.length)
      .slice(0, 10);

    // Admin density: top 10 apps with ≥3 roles, sorted by admin ratio
    const adminDensity = apps
      .filter(a => a.roles.length >= 3)
      .map(a => {
        const adminCount = a.roles.filter(r => r.admin === true).length;
        return { name: a.name, ratio: adminCount / a.roles.length, adminCount, total: a.roles.length };
      })
      .filter(a => a.adminCount > 0)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);

    // Hygiene flags: apps with structural data gaps
    const hygieneFlags = [];
    apps.forEach(a => {
      const flags = [];
      if (a.roles.length === 0) {
        flags.push('No roles cataloged');
      }
      if (a.roles.length > 0 &&
          a.roles.every(r => r.covered === null || r.covered === undefined)) {
        flags.push('PHI coverage unknown');
      }
      if (a.roles.length > 0 &&
          a.roles.every(r => r.admin === null || r.admin === undefined)) {
        flags.push('Admin status unknown');
      }
      if (flags.length > 0) hygieneFlags.push({ name: a.name, flags });
    });

    return {
      totalApps, totalRoles, phiCoveredApps, adminRoles, highRiskRoles,
      phiCovered, phiNotCovered, phiUnknown,
      riskHigh, riskElevated, riskSensitive, riskStandard, riskUnknown,
      topByRoleCount, adminDensity, hygieneFlags
    };
  }

  // ── Insights: render all charts and tables ────────────────────────────
  function renderInsightsView() {
    Object.values(insightsCharts).forEach(c => c.destroy());
    insightsCharts = {};
    document.title = 'Insights \u2014 IAM Access Atlas';

    const d    = computeInsightsData();
    const anim = prefersReducedMotion ? false : { duration: 500 };
    const trim = s => s.length > 28 ? s.slice(0, 27) + '\u2026' : s;

    // KPI tiles
    document.getElementById('kpi-total-apps').textContent  = d.totalApps;
    document.getElementById('kpi-total-roles').textContent = d.totalRoles;
    document.getElementById('kpi-phi-apps').textContent    = d.phiCoveredApps;
    document.getElementById('kpi-admin-roles').textContent = d.adminRoles;
    document.getElementById('kpi-high-risk').textContent   = d.highRiskRoles;

    if (typeof Chart === 'undefined') return;

    // PHI coverage donut
    const phiCtx = document.getElementById('chart-phi');
    if (phiCtx) {
      insightsCharts['phi'] = new Chart(phiCtx, {
        type: 'doughnut',
        data: {
          labels: ['PHI-Covered', 'Not Covered', 'Unknown'],
          datasets: [{
            data: [d.phiCovered, d.phiNotCovered, d.phiUnknown],
            backgroundColor: ['#FBE8C3', '#D5E8D0', '#E8E5F0'],
            borderColor:     ['#C8A045', '#5A9A52', '#A090C8'],
            borderWidth: 1.5,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: anim,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 12 }, padding: 16, color: '#3A3A4A' }
            }
          }
        }
      });
      const tb = document.querySelector('#chart-phi-table tbody');
      if (tb) tb.innerHTML =
        '<tr><td>PHI-Covered</td><td>' + d.phiCovered + '</td></tr>' +
        '<tr><td>Not Covered</td><td>' + d.phiNotCovered + '</td></tr>' +
        '<tr><td>Unknown</td><td>'     + d.phiUnknown   + '</td></tr>';
    }

    // Risk distribution bar
    const riskCtx = document.getElementById('chart-risk');
    if (riskCtx) {
      insightsCharts['risk'] = new Chart(riskCtx, {
        type: 'bar',
        data: {
          labels: ['High Risk', 'Elevated', 'Sensitive', 'Standard', 'Unknown'],
          datasets: [{
            data: [d.riskHigh, d.riskElevated, d.riskSensitive, d.riskStandard, d.riskUnknown],
            backgroundColor: ['#F5DADA', '#FBE8C3', '#FFF3CD', '#D5E8D0', '#E8E5F0'],
            borderColor:     ['#8B3333', '#7A5200', '#664D00', '#2D5C28', '#6B6B6B'],
            borderWidth: 1.5,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: anim,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, color: '#6B6B6B', font: { size: 11 } }, grid: { color: '#F0EDF8' } },
            x: { ticks: { color: '#3A3A4A', font: { size: 11 } }, grid: { display: false } }
          }
        }
      });
      const tb2 = document.querySelector('#chart-risk-table tbody');
      if (tb2) tb2.innerHTML =
        [['High Risk', d.riskHigh], ['Elevated', d.riskElevated],
         ['Sensitive', d.riskSensitive], ['Standard', d.riskStandard], ['Unknown', d.riskUnknown]]
        .map(([l, v]) => '<tr><td>' + l + '</td><td>' + v + '</td></tr>').join('');
    }

    // Top 10 apps by role count (horizontal bar)
    const topCtx = document.getElementById('chart-top-apps');
    if (topCtx) {
      insightsCharts['topApps'] = new Chart(topCtx, {
        type: 'bar',
        data: {
          labels: d.topByRoleCount.map(a => trim(a.name)),
          datasets: [{
            data: d.topByRoleCount.map(a => a.roles.length),
            backgroundColor: '#EAE8F4',
            borderColor: '#7C8EC8',
            borderWidth: 1.5,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          animation: anim,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1, color: '#6B6B6B', font: { size: 11 } }, grid: { color: '#F0EDF8' } },
            y: { ticks: { color: '#3A3A4A', font: { size: 11 } }, grid: { display: false } }
          }
        }
      });
      const tb3 = document.querySelector('#chart-top-apps-table tbody');
      if (tb3) tb3.innerHTML = d.topByRoleCount
        .map(a => '<tr><td>' + a.name + '</td><td>' + a.roles.length + '</td></tr>').join('');
    }

    // Admin density (horizontal bar)
    const densityCard = document.getElementById('chart-admin-density-card');
    const densityCtx  = document.getElementById('chart-admin-density');
    if (densityCtx) {
      if (d.adminDensity.length === 0) {
        if (densityCard) densityCard.classList.add('hidden');
      } else {
        if (densityCard) densityCard.classList.remove('hidden');
        insightsCharts['density'] = new Chart(densityCtx, {
          type: 'bar',
          data: {
            labels: d.adminDensity.map(a => trim(a.name)),
            datasets: [{
              data: d.adminDensity.map(a => Math.round(a.ratio * 100)),
              backgroundColor: '#F5DADA',
              borderColor: '#8B3333',
              borderWidth: 1.5,
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: anim,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ' ' + ctx.parsed.x + '% admin (' +
                    d.adminDensity[ctx.dataIndex].adminCount + '/' +
                    d.adminDensity[ctx.dataIndex].total + ' roles)'
                }
              }
            },
            scales: {
              x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', color: '#6B6B6B', font: { size: 11 } }, grid: { color: '#F0EDF8' } },
              y: { ticks: { color: '#3A3A4A', font: { size: 11 } }, grid: { display: false } }
            }
          }
        });
        const tb4 = document.querySelector('#chart-admin-density-table tbody');
        if (tb4) tb4.innerHTML = d.adminDensity
          .map(a => '<tr><td>' + a.name + '</td><td>' + Math.round(a.ratio * 100) + '%</td></tr>').join('');
      }
    }

    // Catalog hygiene flags table
    const hygieneWrap = document.getElementById('hygiene-table-wrap');
    if (!hygieneWrap) return;
    hygieneWrap.innerHTML = '';

    if (d.hygieneFlags.length === 0) {
      hygieneWrap.innerHTML = '<p class="hygiene-empty">No catalog hygiene issues found.</p>';
      return;
    }

    hygieneWrap.innerHTML = '<p class="hygiene-intro">Click any row to open the application in Manager view.</p>';

    const table = document.createElement('table');
    table.className = 'hygiene-table';
    table.innerHTML = '<thead><tr><th scope="col">Application</th><th scope="col">Flags</th></tr></thead>';
    const tbody = document.createElement('tbody');

    d.hygieneFlags.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'hygiene-row';
      tr.setAttribute('tabindex', '0');
      tr.setAttribute('role', 'button');
      tr.setAttribute('title', 'Open ' + item.name + ' in Manager view');

      const tdName = document.createElement('td');
      tdName.textContent = item.name;
      tr.appendChild(tdName);

      const tdFlags = document.createElement('td');
      const wrap    = document.createElement('div');
      wrap.className = 'hygiene-flags';
      item.flags.forEach(f => {
        const span = document.createElement('span');
        span.className = 'hygiene-flag';
        span.textContent = f;
        wrap.appendChild(span);
      });
      tdFlags.appendChild(wrap);
      tr.appendChild(tdFlags);

      const activate = () => navigateToAppFromInsights(item.name);
      tr.addEventListener('click', activate);
      tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    hygieneWrap.appendChild(table);
  }

  // ── Insights: navigate to app in manager view ─────────────────────────
  function navigateToAppFromInsights(appName) {
    Object.values(insightsCharts).forEach(c => c.destroy());
    insightsCharts = {};
    insightsContent.classList.add('hidden');
    insightsContent.classList.remove('entering');
    selectMode('manager');
    appSelect.value = appName;
    onAppChange();
    setTimeout(() => appSelect.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);
  }

  // ── Start ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
