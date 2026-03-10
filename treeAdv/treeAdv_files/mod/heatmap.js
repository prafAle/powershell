/* ============================================================
   heatmap.js — Simplified Storage Analysis
   
   FEATURES
   - Top 50 Largest Files: Simple list of biggest files
   - Storage Distribution: Size breakdown by file category
   - Clean, professional layout
   - No complex visualizations, just useful data
   
   VIEWS
   1. Largest Files - Table of top files with path, size, type
   2. Category Distribution - Storage by file category
   3. Extension Breakdown - Most common file extensions by size
   
   COMPATIBILITY
   - Requires catalog.js for file categories
   - Works with any dataset size (automatically limits to 5000 files)
   ============================================================ */

"use strict";

// Performance limits
const MAX_FILES_ANALYZED = 5000; // Analyze up to 5000 files for stats
const TOP_FILES_DISPLAY = 50;     // Show top 50 files

/* -------------------------------------------
   Format bytes to human readable
   ------------------------------------------- */
function formatSize(bytes) {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

/* -------------------------------------------
   Truncate path for display
   ------------------------------------------- */
function truncatePath(path, maxLength = 60) {
  if (!path || path.length <= maxLength) return path || '';
  const start = path.substring(0, 30);
  const end = path.substring(path.length - 27);
  return start + '...' + end;
}

/* -------------------------------------------
   Check if Font Awesome is available
   ------------------------------------------- */
function isFontAwesomeAvailable() {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') return false;
  
  // Check if any Font Awesome stylesheet is loaded
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  return links.some(link => {
    const href = link.href || '';
    return href.includes('font-awesome') || 
           href.includes('fontawesome') || 
           href.includes('fa-solid') ||
           href.includes('cdnjs') || 
           href.includes('jsdelivr');
  });
}

/* -------------------------------------------
   Get icon HTML for a file
   ------------------------------------------- */
function getFileIconHtml(fileName, useFA = true) {
  if (!fileName) return useFA ? '<i class="fa-solid fa-file"></i>' : '📄';
  
  if (window.FA_CATALOG) {
    try {
      // Try to use catalog if available
      if (useFA && isFontAwesomeAvailable()) {
        const iconClass = window.FA_CATALOG.fa_iconClass ? 
          window.FA_CATALOG.fa_iconClass(fileName) : 'fa-file';
        return `<i class="fa-solid ${iconClass}"></i>`;
      } else {
        // Fallback to emoji
        const lookup = window.FA_CATALOG.fa_lookup ? 
          window.FA_CATALOG.fa_lookup(fileName) : null;
        return lookup?.emoji || '📄';
      }
    } catch (e) {
      if (window.__DEBUG__) console.warn("[Heatmap] Error getting icon:", e);
    }
  }
  
  return useFA ? '<i class="fa-solid fa-file"></i>' : '📄';
}

/* -------------------------------------------
   Initialize heatmap section
   ------------------------------------------- */
async function fa_heatmap_init(dataset) {
  if (window.__DEBUG__) console.log("📊 [Heatmap] Initializing storage analysis...");
  
  const sec = document.getElementById("heatmap");
  if (!sec) {
    console.error("[Heatmap] Section not found");
    return;
  }

  sec.innerHTML = `
    <div class="card">
      <div class="card-title">
        <i class="fa-solid fa-chart-simple"></i>
        Storage Analysis
      </div>
      
      <!-- View selector -->
      <div class="heatmap-tabs">
        <button id="view-largest-btn" class="btn btn-primary" onclick="fa_heatmap_switchView('largest')">
          <i class="fa-solid fa-ranking-star"></i> Top 50 Largest Files
        </button>
        <button id="view-categories-btn" class="btn" onclick="fa_heatmap_switchView('categories')">
          <i class="fa-solid fa-chart-pie"></i> Storage by Category
        </button>
        <button id="view-extensions-btn" class="btn" onclick="fa_heatmap_switchView('extensions')">
          <i class="fa-solid fa-file"></i> Top Extensions
        </button>
      </div>
      
      <!-- View containers -->
      <div id="largest-files-view" class="heatmap-view active"></div>
      <div id="categories-view" class="heatmap-view"></div>
      <div id="extensions-view" class="heatmap-view"></div>
      
      <div class="heatmap-footer text-muted">
        <i class="fa-solid fa-info-circle"></i>
        Analysis based on up to ${MAX_FILES_ANALYZED.toLocaleString()} files.
        Total storage: <span id="total-storage">calculating...</span>
      </div>
    </div>
  `;

  // Store dataset for view switching
  window.__FA_HEATMAP_DATASET__ = dataset;
  
  // Collect and analyze files
  const files = collectFiles(dataset.tree);
  if (window.__DEBUG__) console.log(`[Heatmap] Collected ${files.length} files`);
  
  // Store for views
  window.__FA_HEATMAP_FILES__ = files;
  
  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + (Number(f.SizeBytes) || 0), 0);
  document.getElementById('total-storage').textContent = formatSize(totalSize);
  
  // Render initial view
  renderLargestFiles(files);
}

/* -------------------------------------------
   Collect all files from tree (with limit)
   ------------------------------------------- */
function collectFiles(node) {
  const files = [];
  let count = 0;
  
  function walk(n) {
    if (!n || count >= MAX_FILES_ANALYZED) return;
    
    if (n.IsDirectory === true) {
      if (n.Children && Array.isArray(n.Children)) {
        for (const child of n.Children) {
          walk(child);
          if (count >= MAX_FILES_ANALYZED) break;
        }
      }
    } else if (n.IsDirectory === false) {
      files.push(n);
      count++;
    }
  }
  
  walk(node);
  return files;
}

/* -------------------------------------------
   Switch between views
   ------------------------------------------- */
window.fa_heatmap_switchView = function(view) {
  if (window.__DEBUG__) console.log(`[Heatmap] Switching to view: ${view}`);
  
  // Update buttons
  document.getElementById('view-largest-btn').classList.remove('btn-primary');
  document.getElementById('view-categories-btn').classList.remove('btn-primary');
  document.getElementById('view-extensions-btn').classList.remove('btn-primary');
  
  // Hide all views
  document.getElementById('largest-files-view').classList.remove('active');
  document.getElementById('categories-view').classList.remove('active');
  document.getElementById('extensions-view').classList.remove('active');
  
  // Show selected view
  switch(view) {
    case 'largest':
      document.getElementById('view-largest-btn').classList.add('btn-primary');
      document.getElementById('largest-files-view').classList.add('active');
      renderLargestFiles(window.__FA_HEATMAP_FILES__);
      break;
    case 'categories':
      document.getElementById('view-categories-btn').classList.add('btn-primary');
      document.getElementById('categories-view').classList.add('active');
      renderCategories(window.__FA_HEATMAP_FILES__);
      break;
    case 'extensions':
      document.getElementById('view-extensions-btn').classList.add('btn-primary');
      document.getElementById('extensions-view').classList.add('active');
      renderExtensions(window.__FA_HEATMAP_FILES__);
      break;
  }
};

/* ============================================================
   VIEW 1: Top 50 Largest Files
   ============================================================ */
function renderLargestFiles(files) {
  const container = document.getElementById('largest-files-view');
  if (!container) return;
  
  // Sort by size descending and take top 50
  const sorted = [...files]
    .filter(f => (Number(f.SizeBytes) || 0) > 0)
    .sort((a, b) => (Number(b.SizeBytes) || 0) - (Number(a.SizeBytes) || 0))
    .slice(0, TOP_FILES_DISPLAY);
  
  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state">No files found</div>';
    return;
  }
  
  const useFA = isFontAwesomeAvailable();
  const totalSize = files.reduce((sum, f) => sum + (Number(f.SizeBytes) || 0), 0);
  
  let html = '<div class="largest-files-list">';
  
  sorted.forEach((file, index) => {
    const size = Number(file.SizeBytes) || 0;
    const sizeFormatted = formatSize(size);
    const path = file.Path || file.FullPath || file.Name || '';
    const shortPath = truncatePath(path, 70);
    
    // Get category and icon
    let category = 'other';
    let categoryColor = '#94a3b8';
    let iconHtml = useFA ? '<i class="fa-solid fa-file"></i>' : '📄';
    
    if (window.FA_CATALOG) {
      try {
        const lookup = window.FA_CATALOG.fa_lookup ? 
          window.FA_CATALOG.fa_lookup(file.Name) : null;
        if (lookup) {
          category = (lookup.cat || 'other').toLowerCase();
          categoryColor = lookup.color || '#94a3b8';
          if (useFA && lookup.iconClass) {
            iconHtml = `<i class="fa-solid ${lookup.iconClass}"></i>`;
          } else if (lookup.emoji) {
            iconHtml = lookup.emoji;
          }
        }
      } catch (e) {
        if (window.__DEBUG__) console.warn("[Heatmap] Error getting lookup:", e);
      }
    }
    
    // Calculate percentage of total
    const percent = totalSize > 0 ? ((size / totalSize) * 100).toFixed(1) : '0';
    
    html += `
      <div class="largest-file-item">
        <div class="file-rank">#${index + 1}</div>
        <div class="file-icon">${iconHtml}</div>
        <div class="file-info">
          <div class="file-path" title="${path}">${shortPath}</div>
          <div class="file-meta">
            <span class="file-category" style="background: ${categoryColor}20; color: ${categoryColor}">
              ${category}
            </span>
            <span class="file-size">${sizeFormatted}</span>
            <span class="file-percent">${percent}%</span>
          </div>
        </div>
        <div class="file-bar">
          <div class="file-bar-fill" style="width: ${percent}%; background: ${categoryColor}"></div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/* ============================================================
   VIEW 2: Storage by Category
   ============================================================ */
function renderCategories(files) {
  const container = document.getElementById('categories-view');
  if (!container) return;
  
  const categories = calculateCategoryStats(files);
  const totalSize = files.reduce((sum, f) => sum + (Number(f.SizeBytes) || 0), 0);
  
  if (categories.length === 0) {
    container.innerHTML = '<div class="empty-state">No category data available</div>';
    return;
  }
  
  const useFA = isFontAwesomeAvailable();
  
  let html = '<div class="categories-grid">';
  
  categories.forEach(cat => {
    const percent = totalSize > 0 ? ((cat.size / totalSize) * 100).toFixed(1) : '0';
    const color = cat.color;
    
    // Generate icon HTML
    let iconHtml = useFA ? '<i class="fa-solid fa-folder"></i>' : '📁';
    if (cat.iconClass && useFA) {
      iconHtml = `<i class="fa-solid ${cat.iconClass}"></i>`;
    } else if (cat.emoji) {
      iconHtml = cat.emoji;
    }
    
    html += `
      <div class="category-card">
        <div class="category-header">
          <span class="category-icon" style="color: ${color}">${iconHtml}</span>
          <span class="category-name">${cat.name}</span>
          <span class="category-size">${formatSize(cat.size)}</span>
        </div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width: ${percent}%; background: ${color}"></div>
        </div>
        <div class="category-stats">
          <span><i class="fa-regular fa-file"></i> ${cat.count.toLocaleString()} files</span>
          <span>${percent}% of total</span>
        </div>
        <div class="category-extensions">
          ${cat.extensions.slice(0, 5).map(ext => `<span class="ext-badge">.${ext}</span>`).join('')}
          ${cat.extensions.length > 5 ? `<span class="ext-badge">+${cat.extensions.length - 5}</span>` : ''}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function calculateCategoryStats(files) {
  const catMap = new Map();
  
  files.forEach(file => {
    if (!file.Name) return;
    
    let category = 'OTHER';
    let color = '#94a3b8';
    let iconClass = 'fa-file';
    let emoji = '📄';
    
    // Try to get category from catalog
    if (window.FA_CATALOG && window.FA_CATALOG.fa_lookup) {
      try {
        const lookup = window.FA_CATALOG.fa_lookup(file.Name);
        if (lookup) {
          category = lookup.cat || 'OTHER';
          color = lookup.color || '#94a3b8';
          iconClass = lookup.iconClass || 'fa-file';
          emoji = lookup.emoji || '📄';
        }
      } catch (e) {
        if (window.__DEBUG__) console.warn("[Heatmap] Error in category lookup:", e);
      }
    }
    
    const ext = (file.Name.split('.').pop() || '').toLowerCase();
    const size = Number(file.SizeBytes) || 0;
    
    if (!catMap.has(category)) {
      catMap.set(category, {
        name: category,
        size: 0,
        count: 0,
        color: color,
        iconClass: iconClass,
        emoji: emoji,
        extensions: new Set()
      });
    }
    
    const stats = catMap.get(category);
    stats.size += size;
    stats.count++;
    if (ext) stats.extensions.add(ext);
  });
  
  // Convert to array and sort by size
  return Array.from(catMap.values())
    .sort((a, b) => b.size - a.size)
    .map(cat => ({
      ...cat,
      extensions: Array.from(cat.extensions).sort()
    }));
}

/* ============================================================
   VIEW 3: Top Extensions
   ============================================================ */
function renderExtensions(files) {
  const container = document.getElementById('extensions-view');
  if (!container) return;
  
  const extensions = calculateExtensionStats(files);
  const totalSize = files.reduce((sum, f) => sum + (Number(f.SizeBytes) || 0), 0);
  
  if (extensions.length === 0) {
    container.innerHTML = '<div class="empty-state">No extension data available</div>';
    return;
  }
  
  let html = '<div class="extensions-list">';
  
  extensions.forEach((ext, index) => {
    const percent = totalSize > 0 ? ((ext.size / totalSize) * 100).toFixed(1) : '0';
    
    html += `
      <div class="extension-item">
        <div class="extension-rank">#${index + 1}</div>
        <div class="extension-info">
          <div class="extension-name">
            <span class="extension-dot" style="background: ${ext.color}"></span>
            <strong>.${ext.extension || '(no extension)'}</strong>
          </div>
          <div class="extension-stats">
            <span>${formatSize(ext.size)}</span>
            <span>${ext.count.toLocaleString()} files</span>
            <span>${percent}%</span>
          </div>
        </div>
        <div class="extension-bar">
          <div class="extension-bar-fill" style="width: ${percent}%; background: ${ext.color}"></div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function calculateExtensionStats(files) {
  const extMap = new Map();
  
  files.forEach(file => {
    if (!file.Name) return;
    
    const ext = (file.Name.split('.').pop() || '').toLowerCase() || '(no extension)';
    const size = Number(file.SizeBytes) || 0;
    
    let color = '#94a3b8';
    if (window.FA_CATALOG && window.FA_CATALOG.fa_lookup) {
      try {
        const lookup = window.FA_CATALOG.fa_lookup(file.Name);
        color = lookup?.color || '#94a3b8';
      } catch (e) {
        // Ignore
      }
    }
    
    if (!extMap.has(ext)) {
      extMap.set(ext, {
        extension: ext,
        size: 0,
        count: 0,
        color: color
      });
    }
    
    const stats = extMap.get(ext);
    stats.size += size;
    stats.count++;
  });
  
  // Convert to array, sort by size, take top 20
  return Array.from(extMap.values())
    .sort((a, b) => b.size - a.size)
    .slice(0, 20);
}

// Export functions
window.fa_heatmap_init = fa_heatmap_init;
window.fa_heatmap_switchView = fa_heatmap_switchView;