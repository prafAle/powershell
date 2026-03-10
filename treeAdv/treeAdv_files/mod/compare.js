/* ============================================================
   compare.js — Delta Compare between two JSON scans
   
   FEATURES
   - Compare two JSON datasets
   - Detect new/deleted/modified files
   - Hash analysis to identify replaced files
   - Safety limits for large datasets
   - Clean, professional output
   ============================================================ */

"use strict";

const FA_COMPARE_MAX = 3000;

async function fa_compare_init(datasetA) {
  if (window.__DEBUG__) console.log("🔄 Initializing compare...");
  
  const sec = document.getElementById("compare");
  if (!sec) {
    console.error("Compare section not found");
    return;
  }

  sec.innerHTML = `
    <div class="card">
      <div class="card-title">
        <i class="fa-solid fa-code-compare"></i>
        Delta Compare
      </div>

      <div class="compare-container">
        <!-- File Selection Panel -->
        <div class="compare-files">
          <h4 style="margin-bottom: 16px;">Select Files to Compare</h4>
          
          <div style="margin-bottom: 16px;">
            <div class="text-muted" style="margin-bottom: 4px;">File A (baseline)</div>
            <input type="file" id="fa_cmp_A" accept=".json" style="width: 100%;">
          </div>
          
          <div style="margin-bottom: 16px;">
            <div class="text-muted" style="margin-bottom: 4px;">File B (newer)</div>
            <input type="file" id="fa_cmp_B" accept=".json" style="width: 100%;">
          </div>

          <button class="btn btn-primary" onclick="fa_compare_run()" style="width: 100%;">
            <i class="fa-solid fa-play"></i> Compare
          </button>
        </div>

        <!-- Results Panel -->
        <div class="compare-results">
          <div id="fa_cmp_summary" class="compare-summary">Load two files and click Compare</div>

          <div class="compare-section">
            <h4><i class="fa-solid fa-plus-circle text-success"></i> New Files</h4>
            <div id="fa_cmp_new"></div>
          </div>

          <div class="compare-section">
            <h4><i class="fa-solid fa-pencil text-warning"></i> Modified Files</h4>
            <div id="fa_cmp_mod"></div>
          </div>

          <div class="compare-section">
            <h4><i class="fa-solid fa-minus-circle text-danger"></i> Removed Files</h4>
            <div id="fa_cmp_del"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  if (window.__DEBUG__) console.log("✅ Compare initialized");
}

/* ============================================================
   FILE LOADER
   ============================================================ */
function fa_compare_loadFile(inputEl, callback) {
  const f = inputEl.files[0];
  if (!f) {
    callback(null);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);
      callback(json);
    } catch (err) {
      alert("Invalid JSON: " + err);
      callback(null);
    }
  };
  reader.readAsText(f);
}

/* ============================================================
   INDEX BUILDER (path → fileNode)
   ============================================================ */
function fa_compare_indexByPath(dataset) {
  const idx = {};

  function walk(n) {
    if (!n) return;
    if (n.IsDirectory === true) {
      for (const c of (n.Children || [])) walk(c);
    } else if (n.IsDirectory === false) {
      const p = String(n.Path || n.FullPath || n.Name || "");
      idx[p] = n;
    }
  }

  if (dataset && dataset.tree) walk(dataset.tree);
  return idx;
}

/* ============================================================
   DIFF ENGINE
   ============================================================ */
function fa_compare_diff(A, B) {
  const idxA = fa_compare_indexByPath(A);
  const idxB = fa_compare_indexByPath(B);

  let created = [];
  let deleted = [];
  let modified = [];

  // Find created and modified files
  for (const path in idxB) {
    if (!idxA[path]) {
      created.push(idxB[path]);
      continue;
    }

    const a = idxA[path], b = idxB[path];
    const sizeA = Number(a.SizeBytes) || 0;
    const sizeB = Number(b.SizeBytes) || 0;
    const hashA = a.Hash || "";
    const hashB = b.Hash || "";

    const sizeChanged = sizeA !== sizeB;
    const hashChanged = hashA && hashB && hashA !== hashB;

    if (sizeChanged || hashChanged) {
      modified.push({
        path,
        from: sizeA,
        to: sizeB,
        hashA,
        hashB
      });
    }
  }

  // Find deleted files
  for (const path in idxA) {
    if (!idxB[path]) deleted.push(idxA[path]);
  }

  return { created, deleted, modified };
}

/* ============================================================
   RENDER RESULTS
   ============================================================ */
function fa_compare_render(diff) {
  if (window.__DEBUG__) console.log("Rendering compare results...");
  
  const sum = document.getElementById("fa_cmp_summary");
  const divN = document.getElementById("fa_cmp_new");
  const divM = document.getElementById("fa_cmp_mod");
  const divD = document.getElementById("fa_cmp_del");

  if (!sum || !divN || !divM || !divD) {
    console.error("Compare elements not found");
    return;
  }

  divN.innerHTML = "";
  divM.innerHTML = "";
  divD.innerHTML = "";

  // Summary
  sum.innerHTML = `
    <i class="fa-solid fa-plus-circle text-success"></i> ${diff.created.length} new · 
    <i class="fa-solid fa-pencil text-warning"></i> ${diff.modified.length} modified · 
    <i class="fa-solid fa-minus-circle text-danger"></i> ${diff.deleted.length} removed
  `;

  const max = FA_COMPARE_MAX;

  // New files
  diff.created.slice(0, max).forEach(f => {
    const d = document.createElement("div");
    d.className = "compare-item add";
    d.innerHTML = `<i class="fa-solid fa-plus-circle" style="width: 1.5rem;"></i> ${f.Path || f.FullPath || f.Name}`;
    divN.appendChild(d);
  });

  // Modified files
  diff.modified.slice(0, max).forEach(m => {
    const d = document.createElement("div");
    d.className = "compare-item mod";
    
    const sizeA = (m.from / 1024 / 1024).toFixed(1) + "MB";
    const sizeB = (m.to / 1024 / 1024).toFixed(1) + "MB";
    
    let msg = `<i class="fa-solid fa-pencil" style="width: 1.5rem;"></i> ${m.path} [${sizeA} → ${sizeB}]`;
    if (m.hashA && m.hashB && m.hashA !== m.hashB) msg += " (hash changed)";
    
    d.innerHTML = msg;
    divM.appendChild(d);
  });

  // Deleted files
  diff.deleted.slice(0, max).forEach(f => {
    const d = document.createElement("div");
    d.className = "compare-item del";
    d.innerHTML = `<i class="fa-solid fa-minus-circle" style="width: 1.5rem;"></i> ${f.Path || f.FullPath || f.Name}`;
    divD.appendChild(d);
  });
  
  if (window.__DEBUG__) {
    console.log(`✅ Compare rendered: ${diff.created.length} new, ${diff.deleted.length} deleted, ${diff.modified.length} modified`);
  }
}

/* ============================================================
   MAIN ENTRYPOINT
   ============================================================ */
window.fa_compare_run = function() {
  if (window.__DEBUG__) console.log("Running compare...");
  
  const fileA = document.getElementById("fa_cmp_A");
  const fileB = document.getElementById("fa_cmp_B");

  let A = null, B = null;
  let loaded = 0;

  function checkComplete() {
    loaded++;
    if (loaded === 2) {
      if (!A || !B) {
        alert("Please select both files to compare");
        return;
      }
      const diff = fa_compare_diff(A, B);
      fa_compare_render(diff);
    }
  }

  fa_compare_loadFile(fileA, jsonA => {
    A = jsonA;
    checkComplete();
  });

  fa_compare_loadFile(fileB, jsonB => {
    B = jsonB;
    checkComplete();
  });
};

// Export functions
window.fa_compare_init = fa_compare_init;
window.fa_compare_run = fa_compare_run;