/* ============================================================
.FILENAME
    core.js

.SYNOPSIS
    Core runtime and router for TreeAdv HTML application

.DESCRIPTION
    Provides the central runtime environment for the TreeAdv
    interactive HTML report (routing, runtime state, 
    debug logging, and export utilities)

    Responsibilities include:
      - Page routing with simple top navigation
      - Lazy module initialization
      - Debug instrumentation
      - Export utilities (JSON / CSV)
      - Runtime state management

    Designed to support very large datasets (>1M files) and
    cooperate with modular components:
        dashboard.js
        tree.js
        heatmap.js
        compare.js
        catalog.js

.NOTES
    Supports DebugMode via window.__DEBUG__
    Uses simple top navigation instead of sidebar
============================================================ */

"use strict";

/* ============================================================
   DEBUG FLAGS
   ============================================================ */
const FA_DEBUG_CORE = window.__FA_DEBUG_CORE__ ?? window.__DEBUG__;
const FA_DEBUG_ROUTER = window.__FA_DEBUG_ROUTER__ ?? window.__DEBUG__;

/* ============================================================
   GLOBAL STATE
   ============================================================ */
window.__FA_DATASET__ = null;
window.__FA_MODULES_INITIALIZED__ = {};
window.__FA_LARGE_DATASET__ = false;
window.__FA_CURRENT_PAGE__ = 'dashboard';

/* ============================================================
   LOGGER
   ============================================================ */
function fa_log(...m) {
  if (FA_DEBUG_CORE) console.log("[TreeAdv]", ...m);
}

/* ============================================================
   EXTREME DEBUG SNAPSHOT
   ============================================================ */
window.fa_extremeDebug = function(stage) {
  if (!window.__DEBUG__) return;
  console.log("========== EXTREME DEBUG ==========");
  console.log("Stage:", stage);
  console.log("Dataset:", window.__FA_DATASET__);
  console.log("Modules:", window.__FA_MODULES_INITIALIZED__);
  console.log("Current page:", window.__FA_CURRENT_PAGE__);
  console.log("===================================");
};

/* ============================================================
   LAYOUT BUILDER - Simple Top Navigation
   ============================================================ */
window.fa_buildBaseLayout = function() {
  if (FA_DEBUG_CORE) console.log("[Core] Building base layout with top navigation");
  
  const app = document.getElementById("app");
  if (!app) {
    console.error("App container missing");
    return false;
  }
  
  if (app.dataset.initialized) return true;

  app.innerHTML = `
    <!-- Top Navigation Bar -->
    <nav class="top-nav">
      <div class="nav-brand">
        <i class="fa-solid fa-tree"></i>
        <span>TreeAdv</span>
      </div>
      
      <div class="nav-menu">
        <button class="nav-item" onclick="fa_show('dashboard')" data-page="dashboard">
          <i class="fa-solid fa-gauge-high"></i>
          <span>Dashboard</span>
        </button>
        <button class="nav-item" onclick="fa_show('tree')" data-page="tree">
          <i class="fa-solid fa-diagram-project"></i>
          <span>Tree</span>
        </button>
        <button class="nav-item" onclick="fa_show('heatmap')" data-page="heatmap">
          <i class="fa-solid fa-fire"></i>
          <span>Heatmap</span>
        </button>
        <button class="nav-item" onclick="fa_show('compare')" data-page="compare">
          <i class="fa-solid fa-code-compare"></i>
          <span>Compare</span>
        </button>
      </div>
      
      <div class="nav-actions">
        <button class="btn" onclick="fa_toggleDark()" title="Toggle dark mode">
          <i class="fa-solid fa-moon"></i>
        </button>
        <button class="btn" onclick="fa_exportJSON()" title="Export JSON">
          <i class="fa-solid fa-download"></i>
        </button>
        <button class="btn" onclick="fa_exportCSV(window.__FA_FILES__ ?? [])" title="Export CSV">
          <i class="fa-solid fa-file-csv"></i>
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="main-content">
      <section id="dashboard" class="page"></section>
      <section id="tree" class="page"></section>
      <section id="heatmap" class="page"></section>
      <section id="compare" class="page"></section>
    </main>
  `;

  app.dataset.initialized = true;
  return true;
};

/* ============================================================
   PAGE ROUTER
   ============================================================ */
window.fa_show = function(pageId) {
  if (FA_DEBUG_ROUTER) console.log("[Router] Switching to page:", pageId);
  
  // Update current page
  window.__FA_CURRENT_PAGE__ = pageId;
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  
  // Show selected page
  const page = document.getElementById(pageId);
  if (!page) {
    console.error("Page not found:", pageId);
    return;
  }
  page.style.display = 'block';
  page.classList.add('active');
  
  // Update active state in navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.page === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Initialize module if needed
  fa_initModule(pageId);
};

/* ============================================================
   MODULE INITIALIZATION (LAZY)
   ============================================================ */
function fa_initModule(pageId) {
  if (window.__FA_MODULES_INITIALIZED__[pageId]) {
    if (FA_DEBUG_CORE) console.log(`[Core] Module ${pageId} already initialized`);
    return;
  }
  
  const dataset = window.__FA_DATASET__;
  if (!dataset) {
    console.warn(`[Router] Cannot initialize ${pageId}: no dataset`);
    return;
  }
  
  try {
    if (FA_DEBUG_CORE) console.log(`[Core] Initializing module: ${pageId}`);
    
    switch(pageId) {
      case "dashboard":
        if (typeof window.fa_dashboard_init === "function") {
          window.fa_dashboard_init(dataset);
        } else {
          console.warn(`[Core] fa_dashboard_init not found`);
        }
        break;
      case "tree":
        if (typeof window.fa_tree_init === "function") {
          window.fa_tree_init(dataset);
        } else {
          console.warn(`[Core] fa_tree_init not found`);
        }
        break;
      case "heatmap":
        if (typeof window.fa_heatmap_init === "function") {
          window.fa_heatmap_init(dataset);
        } else {
          console.warn(`[Core] fa_heatmap_init not found`);
        }
        break;
      case "compare":
        if (typeof window.fa_compare_init === "function") {
          window.fa_compare_init(dataset);
        } else {
          console.warn(`[Core] fa_compare_init not found`);
        }
        break;
    }
    window.__FA_MODULES_INITIALIZED__[pageId] = true;
    if (FA_DEBUG_CORE) console.log(`[Core] Module ${pageId} initialized successfully`);
  } catch (err) {
    console.error(`Module init error (${pageId}):`, err);
    console.error(err.stack);
  }
}

/* ============================================================
   DARK MODE TOGGLE
   ============================================================ */
window.fa_toggleDark = function() {
  document.body.classList.toggle('dark');
  localStorage.setItem('treeadv_dark', document.body.classList.contains('dark'));
  
  // Update icon
  const btn = document.querySelector('.nav-actions .btn:first-child i');
  if (btn) {
    btn.className = document.body.classList.contains('dark') 
      ? 'fa-solid fa-sun' 
      : 'fa-solid fa-moon';
  }
  
  if (FA_DEBUG_CORE) console.log("[Core] Dark mode:", document.body.classList.contains('dark'));
};

// Load dark mode preference
(function loadTheme() {
  const dark = localStorage.getItem('treeadv_dark');
  if (dark === 'true') {
    document.body.classList.add('dark');
    // Update icon after DOM is loaded
    setTimeout(() => {
      const btn = document.querySelector('.nav-actions .btn:first-child i');
      if (btn) btn.className = 'fa-solid fa-sun';
    }, 100);
  }
})();

/* ============================================================
   JSON EXPORT
   ============================================================ */
window.fa_exportJSON = function() {
  const data = window.__FA_DATASET__;
  if (!data) {
    alert("No data available to export");
    return;
  }
  
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `treeadv-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (FA_DEBUG_CORE) console.log("[Core] JSON exported successfully");
  } catch (err) {
    console.error("[Core] Error exporting JSON:", err);
    alert("Error exporting JSON: " + err.message);
  }
};

/* ============================================================
   CSV EXPORT
   ============================================================ */
window.fa_exportCSV = function(files) {
  if (!files || !files.length) {
    alert("No file data available for CSV export");
    return;
  }
  
  try {
    const rows = ['"Path","Size (Bytes)","Size (Human)","Modified","Hash","ACL","ReadOnly","Hidden","Cloud"'];
    files.forEach(f => {
      const path = (f.Path || f.FullPath || f.Name || '').replace(/"/g, '""');
      const size = f.SizeBytes || 0;
      const sizeHuman = f.SizePretty || formatSize(size);
      const modified = f.LastWriteTime || '';
      const hash = f.Hash || '';
      const acl = f.AclSddl ? 'Yes' : '';
      const readonly = f.IsReadOnly ? 'Yes' : '';
      const hidden = f.IsHidden ? 'Yes' : '';
      const cloud = (f.IsOffline || f.IsSparse) ? 'Yes' : '';
      rows.push(`"${path}",${size},"${sizeHuman}","${modified}","${hash}","${acl}","${readonly}","${hidden}","${cloud}"`);
    });
    
    const blob = new Blob([rows.join('\n')], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `treeadv-files-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (FA_DEBUG_CORE) console.log("[Core] CSV exported successfully");
  } catch (err) {
    console.error("[Core] Error exporting CSV:", err);
    alert("Error exporting CSV: " + err.message);
  }
};

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

/* ============================================================
   INITIALIZATION
   ============================================================ */
// Export core functions to global scope
window.fa_log = fa_log;
window.fa_initModule = fa_initModule;
window.formatSize = formatSize;