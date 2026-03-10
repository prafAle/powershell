/* ============================================================
   htmlbody-init.js — HTML Bootstrap
   
   FEATURES
   - Application bootstrap sequence
   - Inline JSON dataset loader
   - Initialization of all modules
   - Debug hooks and readiness flag
   - Automatic default view selection

   INITIALIZATION FLOW
   - Build base layout with top navigation
   - Parse inline dataset (#fs-data)
   - Initialize UI modules (dashboard, tree, heatmap, compare)
   - Show default dashboard view
   - Run optional extreme debug steps

   COMPATIBILITY
   - Requires: fa_buildBaseLayout, fa_dashboard_init,
               fa_tree_init, fa_heatmap_init, fa_compare_init
   ============================================================ */

(async function() {
  if (window.__DEBUG__) {
    console.log("%c🚀 Starting Tree Advanced...", "font-size: 14px; font-weight: bold; color: #2563eb;");
  }
  
  // Check if core functions are available
  if (typeof window.fa_buildBaseLayout !== 'function') {
    console.error("❌ fa_buildBaseLayout is not defined - core.js may not be loaded correctly");
    console.error("Available globals:", Object.keys(window).filter(k => k.startsWith('fa_')).join(', '));
    return;
  }
  
  // Build layout with top navigation
  if (window.__DEBUG__) console.log("🏗️ Building base layout...");
  if (!window.fa_buildBaseLayout()) {
    console.error("❌ Layout failed");
    return;
  }
  if (window.__DEBUG__) console.log("✅ Base layout built");

  // Load dataset
  let dataset = null;
  try {
    const inline = document.getElementById("fs-data");
    if (!inline) {
      console.error("❌ fs-data element not found");
      return;
    }
    if (window.__DEBUG__) console.log("📦 Parsing dataset...");
    dataset = JSON.parse(inline.textContent);
    window.__FA_DATASET__ = dataset;
    console.log("✅ Dataset loaded");
    console.log("   Tree root:", dataset.tree?.Name);
    console.log("   Summary:", dataset.summary);
    
    if (!dataset.tree) {
      if (window.__DEBUG__) console.error("❌ Dataset missing 'tree' property");
      return;
    }
  } catch (err) {
    if (window.__DEBUG__) console.error("❌ Error loading dataset:", err);
    return;
  }

  // Extreme debug after dataset load
  if (typeof window.fa_extremeDebug === 'function' && window.__DEBUG__) {
    window.fa_extremeDebug("AFTER DATASET LOAD");
  }

  // Initialize modules
  try {
    if (window.__DEBUG__) console.log("📊 Initializing dashboard...");
    if (typeof window.fa_dashboard_init === 'function') {
      await window.fa_dashboard_init(dataset);
      console.log("✅ Dashboard initialized");
    } else {
      if (window.__DEBUG__) console.warn("⚠ fa_dashboard_init not available");
    }
    
    if (window.__DEBUG__) console.log("🌳 Initializing tree...");
    if (typeof window.fa_tree_init === 'function') {
      await window.fa_tree_init(dataset);
      if (window.__DEBUG__) console.log("✅ Tree initialized");
    } else {
      if (window.__DEBUG__) console.warn("⚠ fa_tree_init not available");
    }
    
    if (window.__DEBUG__) console.log("🔥 Initializing heatmap...");
    if (typeof window.fa_heatmap_init === 'function') {
      await window.fa_heatmap_init(dataset);
      if (window.__DEBUG__) console.log("✅ Heatmap initialized");
    } else {
      if (window.__DEBUG__) console.warn("⚠ fa_heatmap_init not available");
    }
    
    console.log("🔄 Initializing compare...");
    if (typeof window.fa_compare_init === 'function') {
      await window.fa_compare_init(dataset);
      if (window.__DEBUG__) console.log("✅ Compare initialized");
    } else {
      if (window.__DEBUG__) console.warn("⚠ fa_compare_init not available");
    }
    
    // Extreme debug after all initializations
    if (typeof window.fa_extremeDebug === 'function' && window.__DEBUG__) {
      window.fa_extremeDebug("AFTER ALL INITIALIZATIONS");
    }
    
    // Show dashboard by default
    if (window.__DEBUG__) console.log("📌 Showing dashboard...");
    if (typeof window.fa_show === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        window.fa_show('dashboard');
        if (window.__DEBUG__) console.log("✅ Dashboard displayed");
      }, 100);
    } else {
      if (window.__DEBUG__) console.warn("⚠ fa_show not available");
    }
    
    window.__FA_READY__ = true;
    if (window.__DEBUG__) console.log("%c✅ Application ready", "background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px;");
    
  } catch (err) {
    if (window.__DEBUG__) console.error("❌ Error during initialization:", err);
    if (window.__DEBUG__) console.error("Stack:", err.stack);
  }
})();

// Fallback in case something goes wrong with the async init
window.addEventListener('load', function() {
  if (!window.__FA_READY__) {
    if (window.__DEBUG__) console.warn("⚠ Application not ready after load, checking state...");
    if (window.__DEBUG__) console.log("fa_show available:", typeof window.fa_show === 'function');
    if (window.__DEBUG__) console.log("Dataset available:", !!window.__FA_DATASET__);
    
    // Try to show dashboard anyway
    if (typeof window.fa_show === 'function' && window.__FA_DATASET__) {
      if (window.__DEBUG__) console.log("📌 Attempting to show dashboard...");
      window.fa_show('dashboard');
    }
  }
});