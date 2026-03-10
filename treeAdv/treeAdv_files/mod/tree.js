/* ============================================================
  tree.js — High Performance Tree Explorer with Custom Icons
  
  FEATURES
  - High performance tree viewer with lazy rendering
  - Incremental DOM rendering for huge datasets
  - Expand/collapse nodes
  - Search filter
  - CUSTOM ICONS:
  * Files: Icons from catalog.js based on file name
  * Directories: Special folder icons (open/closed)
  * Colors: Category-based colors for file icons
  * Tooltips: Category name on hover
  - Extra attribute badges with color coding
  - Directory stats badges
  - Sorting options (7 types)
  - Metadata filters overlay
  
  DEPENDENCIES
  - Requires catalog.js for file icons and colors
============================================================ */

"use strict";

/* ============================================================
  CONFIGURATION
============================================================ */
const FA_TREE_BATCH_SIZE = 500;
const FA_TREE_INDENT = 20;

/* ============================================================
  GLOBAL STATE
============================================================ */
window.__FA_TREE_ROOT__ = null;
window.__FA_TREE_INDEX__ = [];
window.__FA_TREE_CONTAINER__ = null;
let __renderPointer = 0;
let __visibleNodes = [];
let __searchTerm = "";
let __totalScannedSize = 0;
let __isTreeInitialized = false; // Avoid double initialization

/* ============================================================
  SORTING STATE
============================================================ */
const SortOptions = {
  NAME_ASC: 'name-asc',
  NAME_DESC: 'name-desc',
  SIZE_DESC: 'size-desc',
  SIZE_ASC: 'size-asc',
  DATE_DESC: 'date-desc',
  DATE_ASC: 'date-asc',
  TYPE: 'type'
};

let __currentSort = SortOptions.NAME_ASC;

/* ============================================================
  METADATA FILTERS STATE
============================================================ */
const MetadataFilters = {
  DIR_MODIFIED: 'dir-modified',
  DIR_SIZE: 'dir-size',
  DIR_COUNT: 'dir-count',
  DIR_PERCENT: 'dir-percent',
  
  FILE_HASH: 'file-hash',
  FILE_ACL: 'file-acl',
  FILE_CTIME: 'file-ctime',
  FILE_READONLY: 'file-readonly',
  FILE_HIDDEN: 'file-hidden',
  FILE_CLOUD: 'file-cloud'
};

let __metadataFilters = {
  [MetadataFilters.DIR_MODIFIED]: true,
  [MetadataFilters.DIR_SIZE]: true,
  [MetadataFilters.DIR_COUNT]: true,
  [MetadataFilters.DIR_PERCENT]: true,
  [MetadataFilters.FILE_HASH]: true,
  [MetadataFilters.FILE_ACL]: true,
  [MetadataFilters.FILE_CTIME]: true,
  [MetadataFilters.FILE_READONLY]: true,
  [MetadataFilters.FILE_HIDDEN]: true,
  [MetadataFilters.FILE_CLOUD]: true
};

/* ============================================================
  DEBUG
============================================================ */
function fa_tree_log(...m) {
  if (window.__DEBUG__) console.log("[Tree]", ...m);
}

/* ============================================================
  FORMATTING HELPERS
============================================================ */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString();
    } catch {
    return dateStr;
  }
}

/* ============================================================
  DIRECTORY STATS CALCULATION
============================================================ */
function calculateDirectoryStats(node) {
  if (!node) return { size: 0, itemCount: 0, lastModified: null };
  
  let totalSize = 0;
  let itemCount = 0;
  let latestModified = node.LastWriteTime ? new Date(node.LastWriteTime) : null;
  
  function walk(n) {
    if (!n) return;
    
    itemCount++;
    
    if (n.IsDirectory === false) {
      const size = Number(n.SizeBytes || n.sizeBytes || 0);
      totalSize += size;
    }
    
    if (n.LastWriteTime) {
      const modDate = new Date(n.LastWriteTime);
      if (!latestModified || modDate > latestModified) {
        latestModified = modDate;
      }
    }
    
    if (n.IsDirectory && n.Children && Array.isArray(n.Children)) {
      n.Children.forEach(walk);
    }
  }
  
  walk(node);
  return {
    size: totalSize,
    itemCount: itemCount,
    lastModified: latestModified
  };
}

/* ============================================================
  SORTING FUNCTIONS
============================================================ */
function getNodeSortValue(node, sortOption) {
  switch (sortOption) {
    case SortOptions.NAME_ASC:
    case SortOptions.NAME_DESC:
    return (node.Name || '').toLowerCase();
    
    case SortOptions.SIZE_DESC:
    case SortOptions.SIZE_ASC:
    if (node.IsDirectory) {
      return node._stats?.size || 0;
      } else {
      return Number(node.SizeBytes || node.sizeBytes || 0);
    }
    
    case SortOptions.DATE_DESC:
    case SortOptions.DATE_ASC:
    return node.LastWriteTime ? new Date(node.LastWriteTime).getTime() : 0;
    
    case SortOptions.TYPE:
    if (node.IsDirectory) return '0_directory';
    const ext = (node.Name || '').split('.').pop() || '';
    return `1_${ext}`;
    
    default:
    return 0;
  }
}

function compareNodes(a, b) {
  const valA = getNodeSortValue(a, __currentSort);
  const valB = getNodeSortValue(b, __currentSort);
  
  switch (__currentSort) {
    case SortOptions.NAME_ASC:
    return String(valA).localeCompare(String(valB));
    case SortOptions.NAME_DESC:
    return String(valB).localeCompare(String(valA));
    case SortOptions.SIZE_DESC:
    return Number(valB) - Number(valA);
    case SortOptions.SIZE_ASC:
    return Number(valA) - Number(valB);
    case SortOptions.DATE_DESC:
    return Number(valB) - Number(valA);
    case SortOptions.DATE_ASC:
    return Number(valA) - Number(valB);
    case SortOptions.TYPE:
    return String(valA).localeCompare(String(valB));
    default:
    return 0;
  }
}

/* ============================================================
  INIT TREE
============================================================ */
window.fa_tree_init = function(dataset) {
  // Avoid double initialization
  if (__isTreeInitialized) {
    console.log("%c🌳 [Tree] Already initialized, skipping...", "color: #f59e0b");
    return;
  }
  
  console.log("%c🌳 [Tree] Initializing tree...", "color: #22c55e; font-weight: bold");
  
  const sec = document.getElementById("tree");
  if (!sec) {
    console.error("[Tree] Tree section not found");
    return;
  }
  
  // Verifica che FA_CATALOG sia disponibile
  if (window.FA_CATALOG) {
    console.log("%c✅ [Tree] FA_CATALOG available", "color: #22c55e");
    console.log("[Tree] FA_CATALOG methods:", Object.keys(window.FA_CATALOG).join(', '));
    
    // Test di alcune icone per debug
    console.log("[Tree] Testing catalog with common extensions:");
    const testFiles = ['test.txt', 'document.pdf', 'image.jpg', 'archive.zip', 'script.ps1', 'movie.mp4'];
    testFiles.forEach(file => {
      try {
        const lookup = window.FA_CATALOG.fa_lookup(file);
        console.log(`  - ${file}:`, lookup);
        } catch (e) {
        console.warn(`  - ${file}: ERROR`, e);
      }
    });
    } else {
    console.warn("❌ [Tree] FA_CATALOG not available - icons will use defaults");
  }
  
  // Calculate total scanned size from root
  if (dataset.tree) {
    const rootStats = calculateDirectoryStats(dataset.tree);
    __totalScannedSize = rootStats.size;
    console.log(`[Tree] Total scanned size: ${formatSize(__totalScannedSize)}`);
  }
  
  sec.innerHTML = `
    <div class="card">
  <div class="card-title">
  <i class="fa-solid fa-diagram-project"></i>
  Tree Explorer
  </div>
  
  <!-- Toolbar with sorting and filters -->
  <div class="tree-toolbar">
  <div class="toolbar-group">
  <button class="btn" onclick="fa_tree_toggleFilters()" title="Toggle metadata filters">
  <i class="fa-solid fa-sliders"></i> Filters
  </button>
  
  <select id="treeSortSelect" class="tree-select" onchange="fa_tree_changeSort(this.value)">
  <option value="${SortOptions.NAME_ASC}">📋 Name (A-Z)</option>
  <option value="${SortOptions.NAME_DESC}">📋 Name (Z-A)</option>
  <option value="${SortOptions.SIZE_DESC}">📊 Size (Largest first)</option>
  <option value="${SortOptions.SIZE_ASC}">📊 Size (Smallest first)</option>
  <option value="${SortOptions.DATE_DESC}">🕒 Date (Newest first)</option>
  <option value="${SortOptions.DATE_ASC}">🕒 Date (Oldest first)</option>
  <option value="${SortOptions.TYPE}">🔤 By type</option>
  </select>
  </div>
  
  <div class="toolbar-group">
  <button class="btn" onclick="fa_tree_expandAll()">
  <i class="fa-solid fa-expand"></i> Expand all
  </button>
  <button class="btn" onclick="fa_tree_collapseAll()">
  <i class="fa-solid fa-compress"></i> Collapse
  </button>
  <input id="treeSearch"
  class="tree-search"
  type="text"
  placeholder="Search files and folders..."
  oninput="fa_tree_search()">
  </div>
  </div>
  
  <!-- Overlay Filters Panel -->
  <div id="filtersOverlay" class="filters-overlay" onclick="fa_tree_closeFilters()"></div>
  <div id="filtersPanel" class="filters-panel">
  <div class="filters-header">
  <h3><i class="fa-solid fa-sliders"></i> Metadata Filters</h3>
  <button class="btn-close" onclick="fa_tree_closeFilters()" title="Close filters">
  <i class="fa-solid fa-times"></i>
  </button>
  </div>
  
  <div class="filters-grid">
  <div class="filters-group">
  <h4><i class="fa-solid fa-folder"></i> Directories</h4>
  <div class="filters-items">
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.DIR_MODIFIED}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.DIR_MODIFIED}', this.checked)">
  <i class="fa-regular fa-calendar"></i>
  <span>Last modified</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.DIR_SIZE}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.DIR_SIZE}', this.checked)">
  <i class="fa-solid fa-weight-hanging"></i>
  <span>Total size</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.DIR_COUNT}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.DIR_COUNT}', this.checked)">
  <i class="fa-solid fa-files"></i>
  <span>Item count</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.DIR_PERCENT}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.DIR_PERCENT}', this.checked)">
  <i class="fa-solid fa-chart-pie"></i>
  <span>Usage %</span>
  </label>
  </div>
  </div>
  
  <div class="filters-group">
  <h4><i class="fa-solid fa-file"></i> Files</h4>
  <div class="filters-items">
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.FILE_HASH}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.FILE_HASH}', this.checked)">
  <i class="fa-solid fa-fingerprint"></i>
  <span>Hash</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.FILE_ACL}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.FILE_ACL}', this.checked)">
  <i class="fa-solid fa-shield"></i>
  <span>ACL</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.FILE_CTIME}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.FILE_CTIME}', this.checked)">
  <i class="fa-regular fa-calendar-plus"></i>
  <span>Creation time</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.FILE_READONLY}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.FILE_READONLY}', this.checked)">
  <i class="fa-solid fa-lock"></i>
  <span>ReadOnly</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.FILE_HIDDEN}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.FILE_HIDDEN}', this.checked)">
  <i class="fa-solid fa-eye-slash"></i>
  <span>Hidden</span>
  </label>
  <label class="filter-checkbox">
  <input type="checkbox" data-filter="${MetadataFilters.FILE_CLOUD}" checked onchange="fa_tree_toggleMetadataFilter('${MetadataFilters.FILE_CLOUD}', this.checked)">
  <i class="fa-solid fa-cloud"></i>
  <span>Cloud</span>
  </label>
  </div>
  </div>
  </div>
  
  <div class="filters-actions">
  <button class="btn btn-small" onclick="fa_tree_setAllFilters(true)">
  <i class="fa-solid fa-check-square"></i> Select all
  </button>
  <button class="btn btn-small" onclick="fa_tree_setAllFilters(false)">
  <i class="fa-regular fa-square"></i> Clear all
  </button>
  </div>
  </div>
  
  <div id="treeContainer" class="tree-container"></div>
    </div>
  `;
  
  window.__FA_TREE_CONTAINER__ = document.getElementById("treeContainer");
  window.__FA_TREE_ROOT__ = dataset.tree;
  
  // Set initial sort select value
  const sortSelect = document.getElementById("treeSortSelect");
  if (sortSelect) sortSelect.value = __currentSort;
  
  buildIndex();
  computeVisibleNodes();
  startRender();
  
  __isTreeInitialized = true;
  fa_tree_log("%c✅ [Tree] Initialization complete", "color: #22c55e");
};

/* ============================================================
  BUILD FLATTENED INDEX WITH SORTING
============================================================ */
function buildIndex() {
  console.log("[Tree] Building flattened index...");
  const root = window.__FA_TREE_ROOT__;
  window.__FA_TREE_INDEX__ = [];
  
  function walk(node, depth, parent) {
    if (!node) return;
    node._depth = depth;
    node._parent = parent;
    node._collapsed = depth > 0;
    
    if (node.IsDirectory) {
      node._stats = calculateDirectoryStats(node);
    }
    
    window.__FA_TREE_INDEX__.push(node);
    
    if (node.IsDirectory && node.Children && Array.isArray(node.Children)) {
      const sortedChildren = [...node.Children].sort(compareNodes);
      node._sortedChildren = sortedChildren;
      for (const c of sortedChildren) {
        walk(c, depth + 1, node);
      }
    }
  }
  
  walk(root, 0, null);
  console.log(`[Tree] Index built: ${window.__FA_TREE_INDEX__.length} nodes (${window.__FA_TREE_INDEX__.filter(n => !n.IsDirectory).length} files, ${window.__FA_TREE_INDEX__.filter(n => n.IsDirectory).length} directories)`);
}

/* ============================================================
  COMPUTE VISIBLE NODES
============================================================ */
function computeVisibleNodes() {
  const arr = [];
  const term = __searchTerm.toLowerCase().trim();
  
  for (const n of window.__FA_TREE_INDEX__) {
    if (term) {
      const name = (n.Name || "").toLowerCase();
      const path = (n.Path || "").toLowerCase();
      if (!name.includes(term) && !path.includes(term)) continue;
    }
    if (isVisible(n)) arr.push(n);
  }
  __visibleNodes = arr;
}

function isVisible(node) {
  let p = node._parent;
  while (p) {
    if (p._collapsed) return false;
    p = p._parent;
  }
  return true;
}

/* ============================================================
  RENDER ENGINE
============================================================ */
function startRender() {
  const container = window.__FA_TREE_CONTAINER__;
  if (!container) return;
  container.innerHTML = "";
  __renderPointer = 0;
  
  console.log(`[Tree] Starting render of ${__visibleNodes.length} visible nodes...`);
  scheduleRender();
}

function scheduleRender() {
  if (window.requestIdleCallback) {
    requestIdleCallback(renderBatch, { timeout: 1000 });
    } else {
    setTimeout(renderBatch, 0);
  }
}

function renderBatch() {
  const container = window.__FA_TREE_CONTAINER__;
  if (!container) return;
  
  const start = __renderPointer;
  const end = Math.min(__renderPointer + FA_TREE_BATCH_SIZE, __visibleNodes.length);
  
  for (let i = __renderPointer; i < end; i++) {
    const node = __visibleNodes[i];
    container.appendChild(renderNode(node));
  }
  
  __renderPointer = end;
  
  if (__renderPointer < __visibleNodes.length) {
    // Still nodes to render
    scheduleRender();
    } else {
    console.log(`[Tree] Render complete: ${__visibleNodes.length} nodes rendered`);
  }
}

/* ============================================================
  CUSTOM ICON FUNCTIONS - SIMPLIFIED VERSION
============================================================ */

/**
  * Get icon HTML for any node (directory or file)
*/
function getNodeIconHtml(node) {
  console.log("%c🟣 [Tree] getNodeIconHtml called for:", "color: #aa00aa", node?.Name);
  
  if (!node) {
    return '<i class="fa-solid fa-question" style="color: var(--gray-500);"></i>';
  }
  
  // Handle directories
  if (node.IsDirectory) {
    const isExpanded = !node._collapsed;
    const iconName = isExpanded ? 'fa-folder-open' : 'fa-folder';
    const itemCount = node._stats?.itemCount || 0;
    const tooltip = `Directory with ${itemCount} item${itemCount !== 1 ? 's' : ''}`;
    return `<i class="fa-solid ${iconName}" style="color: var(--primary);" title="${tooltip}"></i>`;
  }
  
  // Handle files
  if (!node.Name) {
    return '<i class="fa-solid fa-file" style="color: var(--gray-500);"></i>';
  }
  
  // Try catalog first
  try {
    if (window.FA_CATALOG?.fa_lookup) {
      const lookup = window.FA_CATALOG.fa_lookup(node.Name);
      console.log(`[Tree] Catalog lookup for ${node.Name}:`, lookup);
      
      if (lookup?.iconClass) {
        return `<i class="fa-solid ${lookup.iconClass}" style="color: ${lookup.color || 'var(--gray-500)'};" title="Category: ${lookup.cat || 'Unknown'}"></i>`;
      }
    }
  } catch (e) {
    console.warn("[Tree] Catalog lookup failed:", e);
  }
  
  // Fallback by extension
  const ext = node.Name.split('.').pop().toLowerCase();
  const extIcons = {
    'ps1': 'fa-terminal', 'psd1': 'fa-terminal', 'psm1': 'fa-terminal',
    'bat': 'fa-terminal', 'cmd': 'fa-terminal', 'sh': 'fa-terminal',
    'csv': 'fa-file-csv', 'txt': 'fa-file-lines', 'json': 'fa-file-code',
    'html': 'fa-file-code', 'htm': 'fa-file-code', 'css': 'fa-file-code',
    'js': 'fa-file-code', 'jpg': 'fa-file-image', 'jpeg': 'fa-file-image',
    'png': 'fa-file-image', 'gif': 'fa-file-image', 'svg': 'fa-file-image',
    'pdf': 'fa-file-pdf', 'doc': 'fa-file-word', 'docx': 'fa-file-word',
    'xls': 'fa-file-excel', 'xlsx': 'fa-file-excel', 'ppt': 'fa-file-powerpoint',
    'pptx': 'fa-file-powerpoint', 'zip': 'fa-file-archive', 'rar': 'fa-file-archive',
    '7z': 'fa-file-archive', 'mp4': 'fa-file-video', 'mp3': 'fa-file-audio',
    'wav': 'fa-file-audio'
  };
  
  const icon = extIcons[ext] || 'fa-file';
  return `<i class="fa-solid ${icon}" style="color: var(--gray-500);" title="File"></i>`;
}

/* ============================================================
  METADATA BADGES GENERATOR
============================================================ */
function getFileExtraBadges(node) {
  if (node.IsDirectory) return '';
  
  const badges = [];
  
  if (node.Hash && __metadataFilters[MetadataFilters.FILE_HASH]) {
    const shortHash = node.Hash.substring(0, 8);
    badges.push(`
      <span class="badge badge-hash" title="SHA256: ${node.Hash}">
      <i class="fa-solid fa-fingerprint"></i> ${shortHash}
      </span>
    `);
  }
  
  if (node.AclSddl && __metadataFilters[MetadataFilters.FILE_ACL]) {
    let aclIcon = 'fa-solid fa-shield';
    let aclText = 'ACL';
    let aclTitle = node.AclSddl;
    
    if (node.AclSddl.includes('WD') && node.AclSddl.includes('FA')) {
      aclIcon = 'fa-solid fa-shield-halved';
      aclText = '⚠️ Everyone:FC';
      aclTitle = 'Security risk: Everyone has Full Control';
    }
    
    badges.push(`
      <span class="badge badge-acl" title="${aclTitle}">
      <i class="${aclIcon}"></i> ${aclText}
      </span>
    `);
  }
  
  if (node.IsReadOnly && __metadataFilters[MetadataFilters.FILE_READONLY]) {
    badges.push(`
      <span class="badge badge-readonly" title="Read-only file">
      <i class="fa-solid fa-lock"></i> RO
      </span>
    `);
  }
  
  if (node.IsHidden && __metadataFilters[MetadataFilters.FILE_HIDDEN]) {
    badges.push(`
      <span class="badge badge-hidden" title="Hidden file">
      <i class="fa-solid fa-eye-slash"></i> H
      </span>
    `);
  }
  
  if ((node.IsOffline || node.IsSparse) && __metadataFilters[MetadataFilters.FILE_CLOUD]) {
    const cloudStatus = [];
    if (node.IsOffline) cloudStatus.push('Offline');
    if (node.IsSparse) cloudStatus.push('Sparse');
    badges.push(`
      <span class="badge badge-cloud" title="Cloud status: ${cloudStatus.join(', ')}">
      <i class="fa-solid fa-cloud"></i> ${cloudStatus.join('/')}
      </span>
    `);
  }
  
  if (node.CreationTime && __metadataFilters[MetadataFilters.FILE_CTIME]) {
    const dateStr = formatShortDate(node.CreationTime);
    badges.push(`
      <span class="badge badge-ctime" title="Creation time: ${node.CreationTime}">
      <i class="fa-regular fa-calendar-plus"></i> ${dateStr}
      </span>
    `);
  }
  
  return badges.join('');
}

function getDirectoryBadges(node) {
  if (!node.IsDirectory || !node._stats) return '';
  
  const stats = node._stats;
  const badges = [];
  
  if (__metadataFilters[MetadataFilters.DIR_MODIFIED]) {
    const modDate = stats.lastModified ? formatShortDate(stats.lastModified) : 
    (node.LastWriteTime ? formatShortDate(node.LastWriteTime) : '');
    const fullDate = stats.lastModified ? formatDate(stats.lastModified) : 
    (node.LastWriteTime ? formatDate(node.LastWriteTime) : '');
    
    if (modDate) {
      badges.push(`
        <span class="badge badge-modified" title="Last modified: ${fullDate}">
        <i class="fa-regular fa-calendar"></i> ${modDate}
        </span>
      `);
    }
  }
  
  if (stats.size > 0 && __metadataFilters[MetadataFilters.DIR_SIZE]) {
    badges.push(`
      <span class="badge badge-size" title="Total size including subfolders">
      <i class="fa-solid fa-weight-hanging"></i> ${formatSize(stats.size)}
      </span>
    `);
  }
  
  if (stats.itemCount > 0 && __metadataFilters[MetadataFilters.DIR_COUNT]) {
    badges.push(`
      <span class="badge badge-count" title="Total items (files + folders)">
      <i class="fa-solid fa-files"></i> ${stats.itemCount} items
      </span>
    `);
  }
  
  if (__totalScannedSize > 0 && stats.size > 0 && __metadataFilters[MetadataFilters.DIR_PERCENT]) {
    const percentage = (stats.size / __totalScannedSize * 100).toFixed(1);
    badges.push(`
      <span class="badge badge-percent" title="Percentage of total scanned size">
      <i class="fa-solid fa-chart-pie"></i> ${percentage}%
      </span>
    `);
  }
  
  return badges.join('');
}

/* ============================================================
  NODE RENDER
============================================================ */
function renderNode(node) {
  const row = document.createElement("div");
  row.className = "tree-node";
  
  const line = document.createElement("div");
  line.className = "node-row";
  line.style.paddingLeft = (node._depth * FA_TREE_INDENT) + "px";
  
  // Toggle button
  const toggle = document.createElement("span");
  toggle.className = "toggle";
  
  if (node.IsDirectory && node.Children && node.Children.length > 0) {
    toggle.textContent = node._collapsed ? "▶" : "▼";
    toggle.onclick = () => {
      node._collapsed = !node._collapsed;
      refreshTree();
    };
    } else {
    toggle.classList.add("hidden");
    toggle.textContent = "";
  }
  
  // Icon - USING CUSTOM ICONS FROM FA_CATALOG
  const icon = document.createElement("span");
  icon.className = "icon";
  
  // DEBUG: Verify that node exists and has Name
  if (!node) {
    console.error("❌ [Tree] renderNode called with null node!");
    } else {
    console.log("%c🔧 [Tree] Calling getNodeIconHtml for:", "color: #ff9900", node.Name || "(no name)");
    console.log("%c🔧 [Tree] Node type:", "color: #ff9900", node.IsDirectory ? "directory" : "file");
  }
  
  // Pass the entire node to the function
  icon.innerHTML = getNodeIconHtml(node);
  
  // DEBUG: Check what has been entered
  console.log("%c🔧 [Tree] Icon HTML set to:", "color: #ff9900", icon.innerHTML);
  
  // Name container
  const nameContainer = document.createElement("span");
  nameContainer.style.display = "flex";
  nameContainer.style.alignItems = "center";
  nameContainer.style.flexWrap = "wrap";
  nameContainer.style.gap = "4px 8px";
  nameContainer.style.flex = "1";
  
  // File/folder name
  const nameSpan = document.createElement("span");
  nameSpan.className = "file-name";
  nameSpan.textContent = node.Name || "";
  
  // Size for files
  if (!node.IsDirectory) {
    const bytes = Number(node.SizeBytes || node.sizeBytes || 0);
    if (bytes) {
      const sizeSpan = document.createElement("span");
      sizeSpan.className = "file-size";
      sizeSpan.textContent = `[${formatSize(bytes)}]`;
      nameSpan.appendChild(document.createTextNode(' '));
      nameSpan.appendChild(sizeSpan);
    }
  }
  
  nameContainer.appendChild(nameSpan);
  
  // Add badges
  const badgesContainer = document.createElement("span");
  badgesContainer.className = "meta-badges";
  
  if (node.IsDirectory) {
    badgesContainer.innerHTML = getDirectoryBadges(node);
    } else {
    badgesContainer.innerHTML = getFileExtraBadges(node);
  }
  
  if (badgesContainer.innerHTML) {
    nameContainer.appendChild(badgesContainer);
  }
  
  line.appendChild(toggle);
  line.appendChild(icon);
  line.appendChild(nameContainer);
  row.appendChild(line);
  
  return row;
}

/* ============================================================
  REFRESH
============================================================ */
function refreshTree() {
  console.log("[Tree] Refreshing tree view...");
  computeVisibleNodes();
  startRender();
}

function rebuildAndRefresh() {
  console.log("[Tree] Rebuilding index and refreshing...");
  buildIndex();
  computeVisibleNodes();
  startRender();
}

/* ============================================================
  SORTING
============================================================ */
window.fa_tree_changeSort = function(sortValue) {
  console.log("[Tree] Changing sort to:", sortValue);
  __currentSort = sortValue;
  rebuildAndRefresh();
};

/* ============================================================
  SEARCH
============================================================ */
window.fa_tree_search = function() {
  const input = document.getElementById("treeSearch");
  __searchTerm = (input?.value || "").toLowerCase().trim();
  console.log("[Tree] Search term:", __searchTerm);
  refreshTree();
};

/* ============================================================
  EXPAND/COLLAPSE
============================================================ */
window.fa_tree_expandAll = function() {
  console.log("[Tree] Expand all");
  for (const n of window.__FA_TREE_INDEX__) {
    if (n.IsDirectory) n._collapsed = false;
  }
  refreshTree();
};

window.fa_tree_collapseAll = function() {
  console.log("[Tree] Collapse all");
  for (const n of window.__FA_TREE_INDEX__) {
    if (n.IsDirectory) n._collapsed = n._depth > 0;
  }
  refreshTree();
};

/* ============================================================
  FILTERS OVERLAY FUNCTIONS
============================================================ */
window.fa_tree_toggleFilters = function() {
  const overlay = document.getElementById("filtersOverlay");
  const panel = document.getElementById("filtersPanel");
  
  if (!overlay || !panel) return;
  
  if (overlay.classList.contains('active')) {
    overlay.classList.remove('active');
    panel.classList.remove('active');
    document.body.style.overflow = '';
    } else {
    overlay.classList.add('active');
    panel.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.fa_tree_closeFilters = function() {
  const overlay = document.getElementById("filtersOverlay");
  const panel = document.getElementById("filtersPanel");
  
  if (overlay && panel) {
    overlay.classList.remove('active');
    panel.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.fa_tree_toggleMetadataFilter = function(filter, enabled) {
  console.log(`[Tree] Toggle filter ${filter}: ${enabled}`);
  __metadataFilters[filter] = enabled;
  refreshTree();
};

window.fa_tree_setAllFilters = function(enabled) {
  console.log(`[Tree] Set all filters: ${enabled}`);
  for (const key in __metadataFilters) {
    __metadataFilters[key] = enabled;
  }
  
  document.querySelectorAll('#filtersPanel input[type="checkbox"]').forEach(cb => {
    cb.checked = enabled;
  });
  
  refreshTree();
};

// Close filters on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    window.fa_tree_closeFilters();
  }
});