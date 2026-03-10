/* ============================================================
   dashboard.js — Dashboard with Tooltips and Improved Grid
   
   FEATURES
   - Two-column layout with Summary + Metrics side by side
   - Summary grid with narrower first column
   - Tooltips explaining each metric
   - Professional color-coded metrics
   - Responsive design
   ============================================================ */

"use strict";

/* -------------------------------------------
   Metric definitions with tooltips
   ------------------------------------------- */
const METRIC_TOOLTIPS = {
    files: "Total number of files found during scan. This includes all files at any depth within the scanned directory.",
    directories: "Total number of directories (folders) found. Includes all subdirectories within the scanned path.",
    totalSize: "Total storage space used by all files combined. Calculated by summing the SizeBytes property of every file.",
    duplicates: "Number of files with identical content (same hash). These files could potentially be deduplicated to save space.",
    aclRisks: "Files with potentially insecure permissions. Currently detects 'Everyone:FullControl' which allows any user full access.",
    rootPath: "The root directory that was scanned. All paths in the report are relative to or within this location.",
    timestamp: "When the scan was performed. This helps track changes over time when comparing reports.",
    itemsProcessed: "Total number of items (files + directories) processed during the scan.",
    depthLimit: "Maximum directory depth that was scanned. Deeper folders were excluded to maintain performance.",
    parallelism: "Number of parallel threads used during scan. Higher values can speed up scanning on fast storage.",
    extras: "Additional metadata collected during scan. Includes ACLs, hashes, timestamps, and file attributes.",
    elapsed: "Total time taken to complete the scan. Measured from start to finish of the traversal."
};

/* -------------------------------------------
   Initialize dashboard
   ------------------------------------------- */
async function fa_dashboard_init(dataset) {
    if (window.__DEBUG__) console.log("%c📊 DASHBOARD INIT", "background: blue; color: white;");
    
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) {
        console.error("❌ Dashboard element not found!");
        return;
    }

    dashboard.innerHTML = `
        <!-- Two-column layout for Summary + Metrics -->
        <div class="dashboard-grid">
            <!-- Summary Card -->
            <div class="card">
                <div class="card-title">
                    <i class="fa-solid fa-circle-info"></i>
                    Summary
                </div>
                <div class="summary-grid" id="fa_summary_kv"></div>
            </div>

            <!-- Metrics Card -->
            <div class="card">
                <div class="card-title">
                    <i class="fa-solid fa-chart-simple"></i>
                    Metrics
                </div>
                <div class="metrics-grid" id="fa_metrics_grid"></div>
            </div>
        </div>

        <!-- Format Specification Card -->
        <div class="card dashboard-full">
            <details>
                <summary class="card-title" style="cursor: pointer;">
                    <i class="fa-solid fa-code"></i>
                    Filesystem Metadata Specification
                </summary>
                <div style="margin-top: 16px;">
                    <div class="text-muted">Format:</div>
                    <code class="format-code">
                        {filename} [ {size} | {modified} | {creation} | {readonly} | {hidden} | {hash} | {acl} | {cloud} ]
                    </code>
                    
                    <div class="text-muted" style="margin-top: 16px;">Example:</div>
                    <code class="format-code">
                        document.pdf [1.2 MB | 2024-01-15 14:30 | CT=2024-01-15 14:30 | RO=false | Hidden=false | Hash=7A3F... | ACL=O:AOG:D... | Cloud=Offline]
                    </code>
                    
                    <div class="text-muted" style="margin-top: 16px;">Legend:</div>
                    <div class="legend-mini-grid">
                        <div class="legend-mini-item"><i class="fa-solid fa-weight-hanging text-primary"></i> size — Human readable size</div>
                        <div class="legend-mini-item"><i class="fa-regular fa-calendar text-primary"></i> modified — Last write time</div>
                        <div class="legend-mini-item"><i class="fa-regular fa-clock text-primary"></i> creation — Creation time</div>
                        <div class="legend-mini-item"><i class="fa-solid fa-lock text-danger"></i> readonly — Read-only flag</div>
                        <div class="legend-mini-item"><i class="fa-solid fa-eye-slash text-muted"></i> hidden — Hidden flag</div>
                        <div class="legend-mini-item"><i class="fa-solid fa-fingerprint text-success"></i> hash — File hash (first 8 chars)</div>
                        <div class="legend-mini-item"><i class="fa-solid fa-shield text-warning"></i> acl — Security descriptor</div>
                        <div class="legend-mini-item"><i class="fa-solid fa-cloud text-info"></i> cloud — Cloud status</div>
                    </div>
                </div>
            </details>
        </div>

        <!-- Color Legend Card -->
        <div class="card dashboard-full">
            <details>
                <summary class="card-title" style="cursor: pointer;">
                    <i class="fa-solid fa-palette"></i>
                    Color Legend by File Type
                </summary>
                <div id="fa_color_legend" class="legend-grid" style="margin-top: 16px;"></div>
            </details>
        </div>
    `;

    // Render legend
    setTimeout(() => {
        if (window.FA_CATALOG?.fa_renderLegend) {
            try {
                window.FA_CATALOG.fa_renderLegend("fa_color_legend");
                if (window.__DEBUG__) console.log("✅ Legend rendered");
            } catch (e) {
                console.warn("⚠ Error rendering legend:", e);
            }
        }
        
        // Populate data
        fa_dashboard_setSummary(dataset);
        fa_dashboard_setMetrics(dataset);
    }, 100);
}

/* -------------------------------------------
   Set summary with tooltips
   ------------------------------------------- */
function fa_dashboard_setSummary(dataset) {
    const container = document.getElementById("fa_summary_kv");
    if (!container) return;

    container.innerHTML = "";
    const summary = dataset.summary || {};

    function add(label, value, tooltipKey) {
        const row = document.createElement("div");
        row.className = "summary-row";
        
        const labelCell = document.createElement("div");
        labelCell.className = "summary-label";
        labelCell.textContent = label;
        if (METRIC_TOOLTIPS[tooltipKey || label.toLowerCase().replace(/\s+/g, '')]) {
            labelCell.title = METRIC_TOOLTIPS[tooltipKey || label.toLowerCase().replace(/\s+/g, '')];
            labelCell.classList.add('has-tooltip');
        }
        
        const valueCell = document.createElement("div");
        valueCell.className = "summary-value";
        valueCell.textContent = value || "—";
        
        row.appendChild(labelCell);
        row.appendChild(valueCell);
        container.appendChild(row);
    }

    add("Root Path", summary.RootPath, 'rootPath');
    add("Timestamp", summary.Timestamp, 'timestamp');
    add("Items", summary.ItemsProcessed, 'itemsProcessed');
    add("Directories", summary.Directories, 'directories');
    add("Files", summary.Files, 'files');
    add("Depth Limit", summary.DepthLimit, 'depthLimit');
    add("Parallelism", summary.Parallelism, 'parallelism');
    
    let extras = summary.Extras;
    if (Array.isArray(extras)) {
        extras = extras.join(", ");
    } else if (extras && typeof extras === 'string') {
        // Already a string
    } else {
        extras = "none";
    }
    add("Extras", extras, 'extras');
    
    add("Elapsed", summary.Elapsed, 'elapsed');
}

/* -------------------------------------------
   Set metrics with tooltips
   ------------------------------------------- */
function fa_dashboard_setMetrics(dataset) {
    const tree = dataset.tree;
    let files = [];
    let dirsCount = 0;
    let totalSize = 0;

    function walk(node) {
        if (!node) return;
        
        if (node.IsDirectory === true) {
            dirsCount++;
            if (node.Children && Array.isArray(node.Children)) {
                node.Children.forEach(walk);
            }
        } else if (node.IsDirectory === false) {
            node.sizeBytes = Number(node.SizeBytes) || 0;
            files.push(node);
            totalSize += node.sizeBytes;
        }
    }
    walk(tree);

    // Calculate duplicates by hash
    let dup = 0;
    const hashMap = {};
    for (const f of files) {
        if (!f.Hash) continue;
        hashMap[f.Hash] = hashMap[f.Hash] || [];
        hashMap[f.Hash].push(f);
    }
    for (const h in hashMap) {
        if (hashMap[h].length > 1) dup += hashMap[h].length;
    }

    // Calculate ACL risks
    let risk = 0;
    for (const f of files) {
        if (f.AclSddl && f.AclSddl.includes("WD") && f.AclSddl.includes("FA")) risk++;
    }

    // Create metrics grid
    const grid = document.getElementById("fa_metrics_grid");
    if (!grid) return;

    grid.innerHTML = `
        <div class="metric-card" title="${METRIC_TOOLTIPS.files}">
            <div class="metric-label">Files</div>
            <div class="metric-value">${files.length.toLocaleString()}</div>
        </div>
        <div class="metric-card" title="${METRIC_TOOLTIPS.directories}">
            <div class="metric-label">Directories</div>
            <div class="metric-value">${dirsCount.toLocaleString()}</div>
        </div>
        <div class="metric-card" title="${METRIC_TOOLTIPS.totalSize}">
            <div class="metric-label">Total Size</div>
            <div class="metric-value">${(totalSize / 1024 / 1024).toFixed(1)} MB</div>
        </div>
        <div class="metric-card" title="${METRIC_TOOLTIPS.duplicates}">
            <div class="metric-label">Duplicates</div>
            <div class="metric-value ${dup > 0 ? 'text-warning' : ''}">${dup.toLocaleString()}</div>
        </div>
        <div class="metric-card" title="${METRIC_TOOLTIPS.aclRisks}">
            <div class="metric-label">ACL Risks</div>
            <div class="metric-value ${risk > 0 ? 'text-danger' : ''}">${risk.toLocaleString()}</div>
        </div>
    `;

    // Store files for CSV export
    window.__FA_FILES__ = files;
}

// Export functions
window.fa_dashboard_init = fa_dashboard_init;