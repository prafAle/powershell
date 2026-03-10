/* ============================================================
   catalog.js — File Category Catalog with Extended Support
   
   FEATURES
   - Maps file extensions to categories, colors, and icons
   - Provides lookup functions for all UI components
   - Supports Font Awesome icons with emoji fallback
   - Renders color legend for dashboard
   
   CATEGORIES
   - Images: png, jpg, jpeg, bmp, gif, svg, webp, ico, tiff, psd, ai
   - Archives: zip, rar, 7z, gz, tar, bz2, xz, iso, dmg
   - Media: mp4, m4a, mp3, wav, avi, mkv, mov, wmv, flv, webm, ogg, flac
   - Office: doc, docx, xls, xlsx, ppt, pptx, pdf, csv, odt, ods, odp, rtf, pages, numbers, key
   - Code: sql, ddl, pl, bas, ipynb, py, js, ts, php, rb, go, rs, swift, kt, dart
   - Scripts: ps1, psd1, psm1, bat, cmd, vbs, vba, sh, bash, zsh, fish, awk, sed
   - Java: java, jar, class, classpath, project, prefs, mf, war, ear, jsp
   - XML: xml, xsd, rptdesign, bpmn, drawio, coll, tmpl, xsl, xslt, dtd
   - Executables: exe, msi, app, deb, rpm, apk, dll, so, dylib
   - Email: eml, msg, pst, ost, mbx
   - Data: dat, avro, b64, json, yaml, yml, toml, xml, hjson
   - Backup: bak, bkp, orig, swo, swp, old, tmp, temp, backup, save
   - Config: ini, cfg, conf, config, reg, env, rc, properties, plist
   - Logs: log, trace, out, err, debug, audit
   - Web: html, htm, css, scss, sass, less, asp, aspx, php, jsp
   - Fonts: ttf, otf, woff, woff2, eot
   - Certificates: cer, crt, key, pem, p12, pfx
   - Other: ldif, tl, joined, rcv, sr, pat, exc, gpg, inp, sig
   
   USAGE
   - FA_CATALOG.fa_lookup(filename) → { cat, color, iconClass, emoji }
   - FA_CATALOG.fa_iconHtml(filename) → HTML string with icon
   - FA_CATALOG.fa_renderLegend(containerId) → renders color legend
   ============================================================ */

"use strict";

/* -------------------------------------------
   Runtime configuration
   ------------------------------------------- */
// Force the use of Font Awesome if not already set, otherwise keep the value
window.__USE_FA__ = (window.__USE_FA__ !== undefined) ? window.__USE_FA__ : true;

/* -------------------------------------------
   Helper: extract normalized extension
   ------------------------------------------- */
function fa_ext(nameOrExt) {
    let s = String(nameOrExt || "").trim().toLowerCase();
    if (!s) return "";
    // if it's a filename, take from last dot
    if (s.lastIndexOf(".") > 0) s = s.slice(s.lastIndexOf("."));
    return fa_extCanonical(s);
}

/* -------------------------------------------
   Alias → canonical extension
   ------------------------------------------- */
const EXT_ALIAS = {
    ".htm": ".html",
    ".jpeg": ".jpg",
    ".tgz": ".gz",
    ".tiff": ".tif",
    ".eot": ".woff"
};

function fa_extCanonical(ext) {
    return EXT_ALIAS[ext] || ext;
}

/* -------------------------------------------
   CATEGORY definitions with professional colors
   ------------------------------------------- */
const CAT_DEF = {
    // Media & Documents
    IMAGE:   { color: "#3b82f6", icon: "fa-file-image",  emoji: "🖼️" },      // Blue
    ARCHIVE: { color: "#f59e0b", icon: "fa-file-archive",emoji: "🗜️" },      // Orange
    MEDIA:   { color: "#ec4899", icon: "fa-photo-film",  emoji: "🎞️" },      // Pink
    OFFICE:  { color: "#10b981", icon: "fa-file-word",   emoji: "📄" },       // Green
    PDF:     { color: "#ef4444", icon: "fa-file-pdf",    emoji: "📕" },       // Red
    
    // Development
    CODE:    { color: "#8b5cf6", icon: "fa-file-code",   emoji: "🧩" },       // Purple
    SCRIPT:  { color: "#06b6d4", icon: "fa-terminal",    emoji: "💻" },       // Cyan
    JAVA:    { color: "#f97316", icon: "fa-mug-saucer",  emoji: "☕" },       // Orange
    WEB:     { color: "#3b82f6", icon: "fa-globe",       emoji: "🌐" },       // Blue
    DATABASE:{ color: "#64748b", icon: "fa-database",    emoji: "🗄️" },       // Gray
    
    // System & Config
    EXEC:    { color: "#dc2626", icon: "fa-microchip",   emoji: "⚙️" },       // Red
    CONFIG:  { color: "#6b7280", icon: "fa-gear",        emoji: "⚙️" },       // Gray
    LOG:     { color: "#9ca3af", icon: "fa-scroll",      emoji: "📋" },       // Light Gray
    BACKUP:  { color: "#4b5563", icon: "fa-box-archive", emoji: "📦" },       // Dark Gray
    
    // Data & Communication
    EMAIL:   { color: "#a855f7", icon: "fa-envelope",    emoji: "✉️" },       // Purple
    DATA:    { color: "#14b8a6", icon: "fa-database",    emoji: "🗄️" },       // Teal
    XML:     { color: "#78716c", icon: "fa-code",        emoji: "🔧" },       // Warm Gray
    
    // Other
    FONT:    { color: "#a78bfa", icon: "fa-font",        emoji: "🔤" },       // Light Purple
    CERT:    { color: "#34d399", icon: "fa-lock",        emoji: "🔒" },       // Green
    OTHER:   { color: "#94a3b8", icon: "fa-file",        emoji: "📄" }        // Gray
};

/* -------------------------------------------
   Mapping: extension → CATEGORY (COMPREHENSIVE)
   ------------------------------------------- */
const EXT_TO_CAT = {
    // ===== IMAGES =====
    ".png":"IMAGE", ".jpg":"IMAGE", ".jpeg":"IMAGE", ".bmp":"IMAGE",
    ".gif":"IMAGE", ".svg":"IMAGE", ".webp":"IMAGE", ".ico":"IMAGE",
    ".tif":"IMAGE", ".tiff":"IMAGE", ".psd":"IMAGE", ".ai":"IMAGE",
    ".eps":"IMAGE", ".raw":"IMAGE", ".cr2":"IMAGE", ".nef":"IMAGE",
    
    // ===== ARCHIVES =====
    ".zip":"ARCHIVE", ".rar":"ARCHIVE", ".7z":"ARCHIVE", ".gz":"ARCHIVE",
    ".tar":"ARCHIVE", ".bz2":"ARCHIVE", ".xz":"ARCHIVE", ".iso":"ARCHIVE",
    ".dmg":"ARCHIVE", ".pkg":"ARCHIVE", ".deb":"ARCHIVE", ".rpm":"ARCHIVE",
    ".zst":"ARCHIVE", ".lz":"ARCHIVE", ".lzma":"ARCHIVE",
    
    // ===== MEDIA =====
    ".mp4":"MEDIA", ".m4a":"MEDIA", ".mp3":"MEDIA", ".wav":"MEDIA",
    ".avi":"MEDIA", ".mkv":"MEDIA", ".mov":"MEDIA", ".wmv":"MEDIA",
    ".flv":"MEDIA", ".webm":"MEDIA", ".ogg":"MEDIA", ".flac":"MEDIA",
    ".aac":"MEDIA", ".m4v":"MEDIA", ".mpg":"MEDIA", ".mpeg":"MEDIA",
    ".3gp":"MEDIA", ".m2ts":"MEDIA", ".ts":"MEDIA", ".m3u8":"MEDIA",
    
    // ===== OFFICE & DOCUMENTS =====
    ".doc":"OFFICE", ".docx":"OFFICE", ".docm":"OFFICE",
    ".xls":"OFFICE", ".xlsx":"OFFICE", ".xlsm":"OFFICE", ".xlsb":"OFFICE",
    ".ppt":"OFFICE", ".pptx":"OFFICE", ".pptm":"OFFICE",
    ".odt":"OFFICE", ".ods":"OFFICE", ".odp":"OFFICE", ".odg":"OFFICE",
    ".rtf":"OFFICE", ".txt":"OFFICE", ".md":"OFFICE", ".rst":"OFFICE",
    ".pages":"OFFICE", ".numbers":"OFFICE", ".key":"OFFICE",
    ".csv":"DATA",  // CSV as Data
    ".pdf":"PDF",   // Separate PDF category
    
    // ===== CODE =====
    ".sql":"CODE", ".ddl":"CODE", ".dml":"CODE", ".pl":"CODE",
    ".bas":"CODE", ".ipynb":"CODE", ".py":"CODE", ".js":"CODE",
    ".ts":"CODE", ".jsx":"CODE", ".tsx":"CODE", ".vue":"CODE",
    ".php":"CODE", ".rb":"CODE", ".go":"CODE", ".rs":"CODE",
    ".swift":"CODE", ".kt":"CODE", ".kts":"CODE", ".dart":"CODE",
    ".c":"CODE", ".cpp":"CODE", ".h":"CODE", ".hpp":"CODE",
    ".cs":"CODE", ".fs":"CODE", ".java":"JAVA",  // Java separate
    ".scala":"CODE", ".groovy":"CODE", ".lua":"CODE",
    ".r":"CODE", ".m":"CODE", ".mm":"CODE",
    
    // ===== SCRIPTS (Extended) =====
    ".ps1":"SCRIPT", ".psd1":"SCRIPT", ".psm1":"SCRIPT", ".ps1xml":"SCRIPT",
    ".bat":"SCRIPT", ".cmd":"SCRIPT", ".vbs":"SCRIPT", ".vba":"SCRIPT",
    ".sh":"SCRIPT", ".bash":"SCRIPT", ".zsh":"SCRIPT", ".fish":"SCRIPT",
    ".awk":"SCRIPT", ".sed":"SCRIPT", ".pl":"SCRIPT", ".pm":"SCRIPT",
    ".tcl":"SCRIPT", ".expect":"SCRIPT", ".nut":"SCRIPT",
    
    // ===== JAVA ECOSYSTEM =====
    ".java":"JAVA", ".jar":"JAVA", ".class":"JAVA", ".war":"JAVA",
    ".ear":"JAVA", ".jsp":"JAVA", ".jspx":"JAVA", ".tag":"JAVA",
    ".tld":"XML", ".properties":"CONFIG", ".classpath":"CONFIG",
    ".project":"CONFIG", ".prefs":"CONFIG", ".mf":"CONFIG",
    
    // ===== XML FAMILY =====
    ".xml":"XML", ".xsd":"XML", ".xsl":"XML", ".xslt":"XML",
    ".dtd":"XML", ".rng":"XML", ".sch":"XML", ".rptdesign":"XML",
    ".bpmn":"XML", ".drawio":"XML", ".coll":"XML", ".tmpl":"XML",
    ".svg":"XML",  // SVG is XML-based but we keep as IMAGE
    
    // ===== WEB TECHNOLOGIES =====
    ".html":"WEB", ".htm":"WEB", ".xhtml":"WEB", ".jsp":"WEB",
    ".asp":"WEB", ".aspx":"WEB", ".php":"WEB", ".phtml":"WEB",
    ".css":"WEB", ".scss":"WEB", ".sass":"WEB", ".less":"WEB",
    ".styl":"WEB", ".vue":"WEB", ".jsx":"WEB", ".tsx":"WEB",
    ".wasm":"WEB",
    
    // ===== EXECUTABLES =====
    ".exe":"EXEC", ".msi":"EXEC", ".app":"EXEC", ".deb":"EXEC",
    ".rpm":"EXEC", ".apk":"EXEC", ".dll":"EXEC", ".so":"EXEC",
    ".dylib":"EXEC", ".bin":"EXEC", ".out":"EXEC", ".elf":"EXEC",
    ".com":"EXEC", ".scr":"EXEC", ".cpl":"EXEC",
    
    // ===== EMAIL =====
    ".eml":"EMAIL", ".msg":"EMAIL", ".pst":"EMAIL", ".ost":"EMAIL",
    ".mbox":"EMAIL", ".mbx":"EMAIL", ".emlx":"EMAIL",
    
    // ===== DATA FILES =====
    ".dat":"DATA", ".avro":"DATA", ".b64":"DATA", ".json":"DATA",
    ".yaml":"DATA", ".yml":"DATA", ".toml":"DATA", ".hjson":"DATA",
    ".ndjson":"DATA", ".parquet":"DATA", ".orc":"DATA",
    ".feather":"DATA", ".arrow":"DATA", ".proto":"CODE",
    
    // ===== CONFIGURATION =====
    ".ini":"CONFIG", ".cfg":"CONFIG", ".conf":"CONFIG",
    ".config":"CONFIG", ".reg":"CONFIG", ".env":"CONFIG",
    ".rc":"CONFIG", ".plist":"CONFIG", ".desktop":"CONFIG",
    ".service":"CONFIG", ".timer":"CONFIG", ".socket":"CONFIG",
    ".target":"CONFIG", ".mount":"CONFIG", ".automount":"CONFIG",
    
    // ===== LOGS =====
    ".log":"LOG", ".trace":"LOG", ".out":"LOG", ".err":"LOG",
    ".debug":"LOG", ".audit":"LOG", ".journal":"LOG",
    
    // ===== BACKUP / TEMP =====
    ".bak":"BACKUP", ".bkp":"BACKUP", ".orig":"BACKUP",
    ".swo":"BACKUP", ".swp":"BACKUP", ".old":"BACKUP",
    ".tmp":"BACKUP", ".temp":"BACKUP", ".backup":"BACKUP",
    ".save":"BACKUP", ".dmp":"BACKUP", ".dump":"BACKUP",
    
    // ===== FONTS =====
    ".ttf":"FONT", ".otf":"FONT", ".woff":"FONT", ".woff2":"FONT",
    ".eot":"FONT", ".fon":"FONT", ".fnt":"FONT",
    
    // ===== CERTIFICATES & SECURITY =====
    ".cer":"CERT", ".crt":"CERT", ".key":"CERT", ".pem":"CERT",
    ".p12":"CERT", ".pfx":"CERT", ".der":"CERT", ".csr":"CERT",
    ".crl":"CERT", ".jks":"CERT",
    
    // ===== OTHER =====
    ".ldif":"OTHER", ".tl":"OTHER", ".joined":"OTHER",
    ".rcv":"OTHER", ".sr":"OTHER", ".pat":"OTHER",
    ".exc":"OTHER", ".gpg":"OTHER", ".inp":"OTHER",
    ".sig":"OTHER", ".asc":"OTHER", ".md5":"OTHER",
    ".sha1":"OTHER", ".sha256":"OTHER", ".torrent":"OTHER",
    ".part":"OTHER", ".crdownload":"OTHER"
};

/* -------------------------------------------
   Override for more specific file icons
   ------------------------------------------- */
const EXT_ICON_OVERRIDE = {
    // Office
    ".doc":  "fa-file-word",  ".docx":"fa-file-word",  ".docm":"fa-file-word",
    ".xls":  "fa-file-excel", ".xlsx":"fa-file-excel", ".xlsm":"fa-file-excel", ".xlsb":"fa-file-excel",
    ".ppt":  "fa-file-powerpoint", ".pptx":"fa-file-powerpoint", ".pptm":"fa-file-powerpoint",
    ".pdf":  "fa-file-pdf",
    ".csv":  "fa-file-csv",
    
    // Code
    ".json": "fa-file-code",
    ".xml":  "fa-file-code",  ".xsd":"fa-file-code",
    ".yaml": "fa-file-code",  ".yml":"fa-file-code",
    ".toml": "fa-file-code",
    ".html": "fa-file-code",  ".htm":"fa-file-code",
    ".css":  "fa-file-code",  ".scss":"fa-file-code",
    ".js":   "fa-file-code",  ".ts":"fa-file-code",
    ".py":   "fa-file-code",  ".rb":"fa-file-code",
    ".php":  "fa-file-code",  ".java":"fa-file-code",
    
    // Media
    ".mp4":  "fa-file-video", ".m4a":"fa-file-audio", ".mp3":"fa-file-audio",
    ".wav":  "fa-file-audio", ".flac":"fa-file-audio",
    ".png":  "fa-file-image", ".jpg":"fa-file-image", ".jpeg":"fa-file-image",
    ".bmp":  "fa-file-image", ".gif":"fa-file-image", ".svg":"fa-file-image",
    ".webp": "fa-file-image",
    
    // Archives
    ".zip":  "fa-file-archive", ".rar":"fa-file-archive", ".7z":"fa-file-archive",
    ".gz":   "fa-file-archive", ".tar":"fa-file-archive", ".bz2":"fa-file-archive",
    
    // Scripts
    ".ps1":  "fa-terminal",    ".bat":"fa-terminal",    ".cmd":"fa-terminal",
    ".sh":   "fa-terminal",    ".bash":"fa-terminal",   ".vbs":"fa-terminal",
    
    // Config
    ".ini":  "fa-gear",        ".cfg":"fa-gear",        ".conf":"fa-gear",
    ".env":  "fa-gear",        ".properties":"fa-gear",
    
    // Logs
    ".log":  "fa-scroll",      ".trace":"fa-scroll",    ".debug":"fa-scroll",
    
    // Database
    ".sql":  "fa-database",    ".db":"fa-database",     ".sqlite":"fa-database"
};

/* -------------------------------------------
   Fallback emoji if FA is not available
   ------------------------------------------- */
const EXT_EMOJI = {
    // Common files
    ".txt":"📄", ".md":"📄", ".rst":"📄",
    ".pdf":"📕", ".doc":"📄", ".docx":"📄",
    ".xls":"📊", ".xlsx":"📊", ".ppt":"📊", ".pptx":"📊",
    ".csv":"📊", ".json":"⬢", ".xml":"🔧", ".yaml":"⚙️",
    
    // Code
    ".js":"📜", ".ts":"📜", ".py":"📜", ".rb":"📜",
    ".php":"📜", ".java":"☕", ".c":"📜", ".cpp":"📜",
    ".html":"🌐", ".css":"🎨",
    
    // Scripts
    ".ps1":"💻", ".bat":"💻", ".cmd":"💻", ".sh":"💻",
    ".vbs":"💻", ".vba":"💻",
    
    // Media
    ".mp4":"🎞️", ".avi":"🎞️", ".mkv":"🎞️", ".mov":"🎞️",
    ".mp3":"🎵", ".wav":"🎵", ".flac":"🎵",
    ".png":"🖼️", ".jpg":"🖼️", ".jpeg":"🖼️", ".gif":"🖼️",
    ".svg":"🖼️", ".bmp":"🖼️",
    
    // Archives
    ".zip":"🗜️", ".rar":"🗜️", ".7z":"🗜️", ".gz":"🗜️",
    ".tar":"🗜️", ".iso":"💿", ".dmg":"💿",
    
    // Config
    ".ini":"⚙️", ".cfg":"⚙️", ".conf":"⚙️", ".env":"⚙️",
    ".log":"📋", ".debug":"📋",
    
    // Database
    ".sql":"🗄️", ".db":"🗄️", ".sqlite":"🗄️",
    
    // Email
    ".eml":"✉️", ".msg":"✉️", ".pst":"📫",
    
    // System
    ".exe":"⚙️", ".msi":"📦", ".dll":"🧩", ".so":"🧩"
};

/* -------------------------------------------
   Check if Font Awesome is available
   ------------------------------------------- */
function fa_useFA() {
    if (window.__USE_FA__ === false) return false;
    
    // Check if we're in a browser environment
    if (typeof document === 'undefined') return false;
    
    try {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => (l.href || '').toLowerCase());
        return links.some(h => 
            h.includes('font-awesome') || 
            h.includes('fontawesome') || 
            h.includes('cdnjs') || 
            h.includes('jsdelivr') ||
            h.includes('fontawesome.com')
        );
    } catch (e) {
        return false;
    }
}

/* -------------------------------------------
   Main lookup functions
   ------------------------------------------- */
function fa_category(extOrName) {
    const e = fa_ext(extOrName);
    return EXT_TO_CAT[e] || "OTHER";
}

function fa_color(extOrName) {
    const cat = fa_category(extOrName);
    return (CAT_DEF[cat] || CAT_DEF.OTHER).color;
}

function fa_iconClass(extOrName) {
    const e = fa_ext(extOrName);
    if (EXT_ICON_OVERRIDE[e]) return EXT_ICON_OVERRIDE[e];
    const cat = fa_category(e);
    return (CAT_DEF[cat] || CAT_DEF.OTHER).icon;
}

/* Returns HTML icon (FA or emoji fallback) */
function fa_iconHtml(extOrName, extraClass = "fa-fw") {
    const e = fa_ext(extOrName);
    if (fa_useFA()) {
        const cls = fa_iconClass(e);
        return `<i class="fa-solid ${cls} ${extraClass}"></i>`;
    } else {
        const em = EXT_EMOJI[e] || (CAT_DEF[fa_category(e)] || CAT_DEF.OTHER).emoji;
        return `<span class="emoji-icon">${em}</span>`;
    }
}

/**
 * Returns the icon HTML for a specific category
 */
function fa_categoryIconHtml(category) {
    const def = CAT_DEF[category] || CAT_DEF.OTHER;
    if (fa_useFA()) {
        return `<i class="fa-solid ${def.icon} fa-fw"></i>`;
    } else {
        return def.emoji;
    }
}

/* Complete lookup object */
function fa_lookup(extOrName) {
    const cat = fa_category(extOrName);
    const color = fa_color(extOrName);
    const iconClass = fa_iconClass(extOrName);
    return { 
        cat, 
        color, 
        iconClass, 
        emoji: (CAT_DEF[cat] || CAT_DEF.OTHER).emoji 
    };
}

/* -------------------------------------------
   Legend renderer (for Dashboard)
   ------------------------------------------- */
function fa_renderLegend(containerId) {
    if (window.__DEBUG__) console.log("Rendering color legend in:", containerId);
    
    const box = document.getElementById(containerId);
    if (!box) {
        if (window.__DEBUG__) console.warn("Legend container not found:", containerId);
        return;
    }
    box.innerHTML = "";

    // Build cat → [ext] mapping
    const catMap = {};
    for (const k in EXT_TO_CAT) {
        const cat = EXT_TO_CAT[k] || "OTHER";
        (catMap[cat] || (catMap[cat] = [])).push(k);
    }

    // Sort categories by name
    const cats = Object.keys(catMap).sort();
    
    const useFA = fa_useFA();
    
    for (const cat of cats) {
        const def = CAT_DEF[cat] || CAT_DEF.OTHER;
        const color = def.color;
        
        // Get category icon
        let iconHtml;
        if (useFA) {
            iconHtml = `<i class="fa-solid ${def.icon}" style="color: ${color};"></i>`;
        } else {
            iconHtml = def.emoji;
        }
        
        // Sort extensions
        catMap[cat].sort();

        const wrap = document.createElement("div");
        wrap.className = "legend-item";
        wrap.innerHTML = `
            <span class="legend-color" style="background: ${color};"></span>
            <span class="legend-icon">${iconHtml}</span>
            <span class="legend-cat">${cat}</span>
            <span class="legend-exts" title="${catMap[cat].join(', ')}">
                ${catMap[cat].slice(0, 5).join(', ')}${catMap[cat].length > 5 ? '...' : ''}
            </span>
        `;
        box.appendChild(wrap);
    }
    
    if (window.__DEBUG__) console.log(`Legend rendered with ${cats.length} categories`);
}

// Export to global namespace
window.FA_CATALOG = {
    fa_ext, 
    fa_lookup, 
    fa_color, 
    fa_iconClass, 
    fa_iconHtml, 
    fa_category, 
    fa_categoryIconHtml,
    fa_renderLegend,
    fa_useFA
};