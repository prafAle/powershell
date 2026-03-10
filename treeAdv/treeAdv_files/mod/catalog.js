/* ============================================================
   catalog.js — File Category Catalog with Extended Support
   
   FEATURES
   - Maps file extensions to categories, colors, and icons
   - Provides lookup functions for all UI components
   - Supports Font Awesome icons with emoji fallback
   - Renders color legend for dashboard
   - COMPREHENSIVE COVERAGE: 1000+ extensions mapped
   
   CATEGORIES (24 categorie)
   - Images: png, jpg, jpeg, bmp, gif, svg, webp, ico, tiff, psd, ai, eps, raw, cr2, nef, arw, dng, heic, heif, avif, jxl
   - Archives: zip, rar, 7z, gz, tar, bz2, xz, iso, dmg, pkg, deb, rpm, zst, lz, lzma, cab, msi, vhd, vhdx, vmdk
   - Audio: mp3, wav, flac, aac, ogg, m4a, wma, opus, aiff, ape, ac3, dts, mid, midi, kar, m3u, pls, cue
   - Video: mp4, m4v, avi, mkv, mov, wmv, flv, webm, mpg, mpeg, 3gp, m2ts, ts, mts, m2t, ogv, dv, mxf, rm, rmvb
   - Documents: pdf, doc, docx, docm, dot, dotx, rtf, txt, md, rst, tex, latex, ltx, sty, cls, bib
   - Spreadsheets: xls, xlsx, xlsm, xlsb, xltx, xltm, csv, tsv, numbers, ods, fods, dbf
   - Presentations: ppt, pptx, pptm, ppsx, ppsm, potx, potm, key, odp, fodp
   - Code: py, js, ts, jsx, tsx, vue, php, rb, go, rs, swift, kt, kts, dart, scala, groovy, lua, r, m, mm
   - C/C++: c, cpp, cc, cxx, h, hpp, hxx, h++, ino, pde
   - C#/.NET: cs, csproj, sln, vb, vbx, fs, fsx, fsscript, ps1xml, cshtml, vbhtml, asax, ascx, master
   - Java: java, jar, class, war, ear, jsp, jspx, tag, tld, jad, jnilib, jnlp
   - Scripts: ps1, psd1, psm1, ps1xml, bat, cmd, vbs, vba, vbe, sh, bash, zsh, fish, awk, sed, pl, pm, tcl, expect, nut, php3, php4, php5, phps, phar
   - Web: html, htm, xhtml, shtml, dhtml, css, scss, sass, less, styl, asp, aspx, php, phtml, jsp, jsf, cfm, cfc, wasm
   - Data: json, yaml, yml, toml, hjson, ndjson, xml, xsd, xsl, xslt, dtd, rng, sch, avro, parquet, orc, feather, arrow, protobuf, proto
   - Database: sql, ddl, dml, plsql, pks, pkb, trg, idx, tab, db, sqlite, sqlite3, db3, mdb, accdb, mdf, ldf, ndf, dbf, frm, myd, myi
   - Config: ini, cfg, conf, config, reg, env, rc, properties, plist, desktop, service, timer, socket, target, mount, automount, gitignore, dockerignore, editorconfig, htaccess, htpasswd
   - Logs: log, trace, out, err, debug, audit, journal, syslog, log4j, log4net, log4php, lcf, lck
   - Backup: bak, bkp, orig, swo, swp, old, tmp, temp, backup, save, dmp, dump, qbb, qbw, qbm
   - Email: eml, msg, pst, ost, mbox, mbx, emlx, oft, emlxpart, dwl
   - Fonts: ttf, otf, woff, woff2, eot, fon, fnt, pfa, pfb, gsf, ttc, dfont
   - Certificates: cer, crt, key, pem, p12, pfx, der, csr, crl, jks, keystore, truststore, p7b, p7c, p7s, p7m
   - Executables: exe, msi, app, deb, rpm, apk, dll, so, dylib, bin, out, elf, com, scr, cpl, sys, drv, vxd, ocx, ax
   - GIS: shp, shx, dbf, prj, sbn, sbx, fbn, fbx, ain, aih, atx, mxd, qgs, qgz, gpx, kml, kmz, geojson, topojson
   - CAD: dwg, dxf, dwf, dwfx, dgn, dwt, dxb, plt, hpgl, plc, plf, shx, shp
   - 3D: obj, stl, fbx, blend, mb, ma, max, 3ds, dae, collada, gltf, glb, ply, x3d, x3dv, vrml, wrl
   - Virtualization: vhd, vhdx, vmdk, vdi, qcow, qcow2, vmem, vmsn, vmsd, nvram, ovf, ova
   - Package Managers: npm, node_modules, package-lock.json, yarn.lock, Gemfile, Gemfile.lock, Pipfile, Pipfile.lock, poetry.lock, Cargo.toml, Cargo.lock, go.mod, go.sum, composer.json, composer.lock
   - Other: ldif, tl, joined, rcv, sr, pat, exc, gpg, inp, sig, asc, md5, sha1, sha256, torrent, part, crdownload, download, lnk, url, webloc, desktop, bookmark, m3u, m3u8, pls, xspf, cue, m3u, nfo, torrent, magnet
   ============================================================ */

"use strict";

/* -------------------------------------------
   DEBUG CONFIGURATION - Controlled by PowerShell
   ------------------------------------------- */
const FA_CATALOG_DEBUG = window.__TREEADV_CONFIG__?.debug?.catalog === true;

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
    ".tiff": ".tif",
    ".eot": ".woff",
    ".tgz": ".gz",
    ".tar.gz": ".gz",
    ".tar.bz2": ".bz2",
    ".tar.xz": ".xz",
    ".tar.zst": ".zst",
    ".3g2": ".3gp",
    ".m4p": ".m4a",
    ".qt": ".mov",
    ".midi": ".mid",
    ".latex": ".tex",
    ".jfif": ".jpg",
    ".pjpeg": ".jpg",
    ".pjpg": ".jpg",
    ".svgz": ".svg",
    ".jfif": ".jpg"
};

function fa_extCanonical(ext) {
    return EXT_ALIAS[ext] || ext;
}

/* -------------------------------------------
   CATEGORY definitions with professional colors
   ------------------------------------------- */
const CAT_DEF = {
    // Media & Documents (10 categorie)
    IMAGE:      { color: "#3b82f6", icon: "fa-file-image",     emoji: "🖼️" },      // Blue
    AUDIO:      { color: "#ec4899", icon: "fa-file-audio",     emoji: "🎵" },      // Pink
    VIDEO:      { color: "#a855f7", icon: "fa-file-video",     emoji: "🎬" },      // Purple
    ARCHIVE:    { color: "#f59e0b", icon: "fa-file-archive",   emoji: "🗜️" },      // Orange
    DOCUMENT:   { color: "#10b981", icon: "fa-file-lines",     emoji: "📄" },      // Green
    SPREADSHEET:{ color: "#22c55e", icon: "fa-file-excel",     emoji: "📊" },      // Light Green
    PRESENTATION:{color: "#ef4444", icon: "fa-file-powerpoint",emoji: "📽️" },      // Red
    PDF:        { color: "#dc2626", icon: "fa-file-pdf",       emoji: "📕" },      // Dark Red
    
    // Development (7 categorie)
    CODE:       { color: "#8b5cf6", icon: "fa-file-code",      emoji: "🧩" },      // Purple
    SCRIPT:     { color: "#06b6d4", icon: "fa-terminal",       emoji: "💻" },      // Cyan
    JAVA:       { color: "#f97316", icon: "fa-mug-saucer",     emoji: "☕" },      // Orange
    WEB:        { color: "#3b82f6", icon: "fa-globe",          emoji: "🌐" },      // Blue
    DATABASE:   { color: "#64748b", icon: "fa-database",       emoji: "🗄️" },      // Gray
    C_CPP:      { color: "#6d28d9", icon: "fa-code-branch",    emoji: "⚙️" },      // Dark Purple
    DOTNET:     { color: "#512bd4", icon: "fa-windows",        emoji: "🔷" },      // .NET Purple
    
    // System & Config (5 categorie)
    EXEC:       { color: "#dc2626", icon: "fa-microchip",      emoji: "⚙️" },      // Red
    CONFIG:     { color: "#6b7280", icon: "fa-gear",           emoji: "⚙️" },      // Gray
    LOG:        { color: "#9ca3af", icon: "fa-scroll",         emoji: "📋" },      // Light Gray
    BACKUP:     { color: "#4b5563", icon: "fa-box-archive",    emoji: "📦" },      // Dark Gray
    
    // Data & Communication (4 categorie)
    EMAIL:      { color: "#a855f7", icon: "fa-envelope",       emoji: "✉️" },      // Purple
    DATA:       { color: "#14b8a6", icon: "fa-database",       emoji: "🗄️" },      // Teal
    XML:        { color: "#78716c", icon: "fa-code",           emoji: "🔧" },      // Warm Gray
    JSON_YAML:  { color: "#eab308", icon: "fa-brackets-curly", emoji: "⬢" },      // Yellow
    
    // Specialized (5 categorie)
    FONT:       { color: "#a78bfa", icon: "fa-font",           emoji: "🔤" },      // Light Purple
    CERT:       { color: "#34d399", icon: "fa-lock",           emoji: "🔒" },      // Green
    GIS:        { color: "#059669", icon: "fa-map-location-dot", emoji: "🗺️" },    // Dark Green
    CAD:        { color: "#b45309", icon: "fa-cubes",          emoji: "📐" },      // Brown
    THREED:     { color: "#7c3aed", icon: "fa-cube",           emoji: "🧊" },      // Violet
    
    // Virtualization & Packages (2 categorie)
    VIRTUAL:    { color: "#0891b2", icon: "fa-cloud",          emoji: "☁️" },      // Cyan
    PACKAGE:    { color: "#b91c1c", icon: "fa-box",            emoji: "📦" },      // Dark Red
    
    // Other
    OTHER:      { color: "#94a3b8", icon: "fa-file",           emoji: "📄" }       // Gray
};

/* -------------------------------------------
   Mapping: extension → CATEGORY (COMPREHENSIVE - 1000+ EXTENSIONS)
   ------------------------------------------- */
const EXT_TO_CAT = {
    // ===== IMAGES ===== (50+ estensioni)
    ".png":"IMAGE", ".jpg":"IMAGE", ".jpeg":"IMAGE", ".bmp":"IMAGE",
    ".gif":"IMAGE", ".svg":"IMAGE", ".webp":"IMAGE", ".ico":"IMAGE",
    ".tif":"IMAGE", ".tiff":"IMAGE", ".psd":"IMAGE", ".ai":"IMAGE",
    ".eps":"IMAGE", ".raw":"IMAGE", ".cr2":"IMAGE", ".nef":"IMAGE",
    ".arw":"IMAGE", ".dng":"IMAGE", ".heic":"IMAGE", ".heif":"IMAGE",
    ".avif":"IMAGE", ".jxl":"IMAGE", ".jfif":"IMAGE", ".pjpeg":"IMAGE",
    ".pjpg":"IMAGE", ".svgz":"IMAGE", ".cgm":"IMAGE", ".drw":"IMAGE",
    ".dwg":"CAD",  // CAD specific
    ".dxf":"CAD",
    ".wmf":"IMAGE", ".emf":"IMAGE", ".pict":"IMAGE", ".pct":"IMAGE",
    ".pic":"IMAGE", ".pxr":"IMAGE", ".ras":"IMAGE", ".sgi":"IMAGE",
    ".tga":"IMAGE", ".xbm":"IMAGE", ".xpm":"IMAGE", ".xwd":"IMAGE",
    ".crw":"IMAGE", ".cr3":"IMAGE", ".raf":"IMAGE", ".rw2":"IMAGE",
    ".rwl":"IMAGE", ".sr2":"IMAGE", ".srf":"IMAGE", ".orf":"IMAGE",
    ".pef":"IMAGE", ".ptx":"IMAGE", ".dsc":"IMAGE", ".mrw":"IMAGE",
    ".3fr":"IMAGE", ".fff":"IMAGE", ".iiq":"IMAGE", ".eip":"IMAGE",
    ".bay":"IMAGE", ".bmq":"IMAGE", ".cap":"IMAGE", ".cxi":"IMAGE",
    ".data":"IMAGE", ".dcr":"IMAGE", ".dcs":"IMAGE", ".dc2":"IMAGE",
    ".dcr":"IMAGE", ".k25":"IMAGE", ".kdc":"IMAGE", ".mef":"IMAGE",
    ".mos":"IMAGE", ".mfw":"IMAGE", ".mdc":"IMAGE", ".mef":"IMAGE",
    ".nrw":"IMAGE", ".ori":"IMAGE", ".oi":"IMAGE", ".odg":"DOCUMENT", // OpenDocument Graphics
    
    // ===== AUDIO ===== (40+ estensioni)
    ".mp3":"AUDIO", ".wav":"AUDIO", ".flac":"AUDIO", ".aac":"AUDIO",
    ".ogg":"AUDIO", ".m4a":"AUDIO", ".wma":"AUDIO", ".opus":"AUDIO",
    ".aiff":"AUDIO", ".ape":"AUDIO", ".ac3":"AUDIO", ".dts":"AUDIO",
    ".mid":"AUDIO", ".midi":"AUDIO", ".kar":"AUDIO", ".m3u":"AUDIO",
    ".pls":"AUDIO", ".cue":"AUDIO", ".m4p":"AUDIO", ".m4b":"AUDIO",
    ".m4r":"AUDIO", ".aa":"AUDIO", ".aax":"AUDIO", ".act":"AUDIO",
    ".amr":"AUDIO", ".awb":"AUDIO", ".dct":"AUDIO", ".dss":"AUDIO",
    ".dvf":"AUDIO", ".gsm":"AUDIO", ".iklax":"AUDIO", ".ivs":"AUDIO",
    ".m4r":"AUDIO", ".mmf":"AUDIO", ".mpc":"AUDIO", ".msv":"AUDIO",
    ".oga":"AUDIO", ".mogg":"AUDIO", ".opus":"AUDIO", ".ra":"AUDIO",
    ".rm":"AUDIO", ".raw":"AUDIO", ".sln":"AUDIO", ".tta":"AUDIO",
    ".vox":"AUDIO", ".wv":"AUDIO", ".webm":"VIDEO",  // Video mapping
    
    // ===== VIDEO ===== (40+ estensioni)
    ".mp4":"VIDEO", ".m4v":"VIDEO", ".avi":"VIDEO", ".mkv":"VIDEO",
    ".mov":"VIDEO", ".wmv":"VIDEO", ".flv":"VIDEO", ".webm":"VIDEO",
    ".mpg":"VIDEO", ".mpeg":"VIDEO", ".3gp":"VIDEO", ".m2ts":"VIDEO",
    ".ts":"VIDEO", ".mts":"VIDEO", ".m2t":"VIDEO", ".ogv":"VIDEO",
    ".dv":"VIDEO", ".mxf":"VIDEO", ".rm":"VIDEO", ".rmvb":"VIDEO",
    ".asf":"VIDEO", ".swf":"VIDEO", ".f4v":"VIDEO", ".f4p":"VIDEO",
    ".f4a":"VIDEO", ".f4b":"VIDEO", ".divx":"VIDEO", ".xvid":"VIDEO",
    ".vob":"VIDEO", ".ifo":"VIDEO", ".bup":"VIDEO", ".mod":"VIDEO",
    ".tod":"VIDEO", ".m2v":"VIDEO", ".m1v":"VIDEO", ".m2p":"VIDEO",
    ".m2ts":"VIDEO", ".mts":"VIDEO", ".m2t":"VIDEO", ".m4v":"VIDEO",
    ".3g2":"VIDEO", ".3gpp":"VIDEO", ".amv":"VIDEO", ".mtv":"VIDEO",
    ".mxf":"VIDEO", ".nsv":"VIDEO", ".roq":"VIDEO", ".svi":"VIDEO",
    
    // ===== ARCHIVES ===== (40+ estensioni)
    ".zip":"ARCHIVE", ".rar":"ARCHIVE", ".7z":"ARCHIVE", ".gz":"ARCHIVE",
    ".tar":"ARCHIVE", ".bz2":"ARCHIVE", ".xz":"ARCHIVE", ".iso":"ARCHIVE",
    ".dmg":"ARCHIVE", ".pkg":"ARCHIVE", ".deb":"ARCHIVE", ".rpm":"ARCHIVE",
    ".zst":"ARCHIVE", ".lz":"ARCHIVE", ".lzma":"ARCHIVE", ".cab":"ARCHIVE",
    ".msi":"EXEC",  // MSI è eseguibile
    ".vhd":"VIRTUAL", ".vhdx":"VIRTUAL", ".vmdk":"VIRTUAL",
    ".ar":"ARCHIVE", ".a":"ARCHIVE", ".cpio":"ARCHIVE", ".shar":"ARCHIVE",
    ".lzh":"ARCHIVE", ".lha":"ARCHIVE", ".rar5":"ARCHIVE", ".rz":"ARCHIVE",
    ".ace":"ARCHIVE", ".afa":"ARCHIVE", ".alz":"ARCHIVE", ".arc":"ARCHIVE",
    ".arj":"ARCHIVE", ".ba":"ARCHIVE", ".bh":"ARCHIVE", ".cfs":"ARCHIVE",
    ".cpt":"ARCHIVE", ".dar":"ARCHIVE", ".dd":"ARCHIVE", ".dgc":"ARCHIVE",
    ".dmg":"ARCHIVE", ".ear":"JAVA",  // Java EAR
    ".gca":"ARCHIVE", ".ha":"ARCHIVE", ".hki":"ARCHIVE", ".ice":"ARCHIVE",
    ".jar":"JAVA",  // Java JAR
    ".kgb":"ARCHIVE", ".lrz":"ARCHIVE", ".lz4":"ARCHIVE", ".lzop":"ARCHIVE",
    ".pak":"ARCHIVE", ".partimg":"ARCHIVE", ".pa":"ARCHIVE", ".pax":"ARCHIVE",
    ".pbi":"ARCHIVE", ".pcv":"ARCHIVE", ".pea":"ARCHIVE", ".phar":"ARCHIVE",
    ".pit":"ARCHIVE", ".qda":"ARCHIVE", ".rar":"ARCHIVE", ".rk":"ARCHIVE",
    ".s7z":"ARCHIVE", ".sar":"ARCHIVE", ".sbx":"ARCHIVE", ".sda":"ARCHIVE",
    ".sea":"ARCHIVE", ".sen":"ARCHIVE", ".sfark":"ARCHIVE", ".sfx":"ARCHIVE",
    ".shk":"ARCHIVE", ".sit":"ARCHIVE", ".sitx":"ARCHIVE", ".sqx":"ARCHIVE",
    ".sda":"ARCHIVE", ".tar.gz":"ARCHIVE", ".tar.bz2":"ARCHIVE", ".tar.xz":"ARCHIVE",
    ".tgz":"ARCHIVE", ".tbz2":"ARCHIVE", ".txz":"ARCHIVE", ".tlz":"ARCHIVE",
    ".uc":"ARCHIVE", ".uc0":"ARCHIVE", ".uc2":"ARCHIVE", ".ucn":"ARCHIVE",
    ".ur2":"ARCHIVE", ".war":"JAVA",  // Java WAR
    ".wim":"ARCHIVE", ".xar":"ARCHIVE", ".xp3":"ARCHIVE", ".yzl":"ARCHIVE",
    ".z":"ARCHIVE", ".zipx":"ARCHIVE", ".zoo":"ARCHIVE", ".zpaq":"ARCHIVE",
    
    // ===== DOCUMENTS ===== (50+ estensioni)
    ".doc":"DOCUMENT", ".docx":"DOCUMENT", ".docm":"DOCUMENT",
    ".dot":"DOCUMENT", ".dotx":"DOCUMENT", ".dotm":"DOCUMENT",
    ".rtf":"DOCUMENT", ".txt":"DOCUMENT", ".md":"DOCUMENT", ".rst":"DOCUMENT",
    ".tex":"DOCUMENT", ".latex":"DOCUMENT", ".ltx":"DOCUMENT", ".sty":"DOCUMENT",
    ".cls":"DOCUMENT", ".bib":"DOCUMENT", ".log":"LOG",  // Log mapping
    ".wpd":"DOCUMENT", ".wps":"DOCUMENT", ".wri":"DOCUMENT",
    ".abw":"DOCUMENT", ".aww":"DOCUMENT", ".chm":"DOCUMENT",
    ".docz":"DOCUMENT", ".dox":"DOCUMENT", ".dvi":"DOCUMENT",
    ".emf":"IMAGE",  // Image mapping
    ".epub":"DOCUMENT", ".fb2":"DOCUMENT", ".fdx":"DOCUMENT",
    ".gdoc":"DOCUMENT", ".hwp":"DOCUMENT", ".indd":"DOCUMENT",
    ".kwd":"DOCUMENT", ".kwt":"DOCUMENT", ".lwp":"DOCUMENT",
    ".mobi":"DOCUMENT", ".mw":"DOCUMENT", ".nb":"DOCUMENT",
    ".nbp":"DOCUMENT", ".odm":"DOCUMENT", ".odt":"DOCUMENT",
    ".oft":"EMAIL",  // Email mapping
    ".ott":"DOCUMENT", ".pages":"DOCUMENT", ".pap":"DOCUMENT",
    ".pdax":"DOCUMENT", ".pdp":"DOCUMENT", ".prc":"DOCUMENT",
    ".ps":"DOCUMENT", ".psw":"DOCUMENT", ".pwi":"DOCUMENT",
    ".rtfd":"DOCUMENT", ".sdw":"DOCUMENT", ".stw":"DOCUMENT",
    ".sxw":"DOCUMENT", ".texinfo":"DOCUMENT", ".tmd":"DOCUMENT",
    ".uot":"DOCUMENT", ".utf8":"DOCUMENT", ".wsc":"DOCUMENT",
    ".wtt":"DOCUMENT", ".xdl":"DOCUMENT", ".xml":"XML",  // XML mapping
    
    // ===== SPREADSHEETS ===== (30+ estensioni)
    ".xls":"SPREADSHEET", ".xlsx":"SPREADSHEET", ".xlsm":"SPREADSHEET",
    ".xlsb":"SPREADSHEET", ".xltx":"SPREADSHEET", ".xltm":"SPREADSHEET",
    ".csv":"DATA",  // CSV come Data
    ".tsv":"DATA",  // TSV come Data
    ".numbers":"SPREADSHEET", ".ods":"SPREADSHEET", ".fods":"SPREADSHEET",
    ".dbf":"DATABASE",  // DBF come Database
    ".abacus":"SPREADSHEET", ".cell":"SPREADSHEET", ".dif":"SPREADSHEET",
    ".fm":"SPREADSHEET", ".fods":"SPREADSHEET", ".gnm":"SPREADSHEET",
    ".gnumeric":"SPREADSHEET", ".gsheet":"SPREADSHEET", ".impress":"PRESENTATION",
    ".kc":"SPREADSHEET", ".kexi":"SPREADSHEET", ".ksp":"SPREADSHEET",
    ".ods":"SPREADSHEET", ".ots":"SPREADSHEET", ".pmv":"SPREADSHEET",
    ".pmvx":"SPREADSHEET", ".pmvz":"SPREADSHEET", ".pwij":"SPREADSHEET",
    ".qpw":"SPREADSHEET", ".sdc":"SPREADSHEET", ".stc":"SPREADSHEET",
    ".sxc":"SPREADSHEET", ".tab":"DATA",  // TAB come Data
    ".vc":"SPREADSHEET", ".wk1":"SPREADSHEET", ".wk3":"SPREADSHEET",
    ".wk4":"SPREADSHEET", ".wks":"SPREADSHEET", ".wq1":"SPREADSHEET",
    ".xlk":"SPREADSHEET", ".xll":"SPREADSHEET", ".xlm":"SPREADSHEET",
    ".xlr":"SPREADSHEET", ".xlw":"SPREADSHEET", ".xlt":"SPREADSHEET",
    
    // ===== PRESENTATIONS ===== (20+ estensioni)
    ".ppt":"PRESENTATION", ".pptx":"PRESENTATION", ".pptm":"PRESENTATION",
    ".ppsx":"PRESENTATION", ".ppsm":"PRESENTATION", ".potx":"PRESENTATION",
    ".potm":"PRESENTATION", ".key":"PRESENTATION", ".odp":"PRESENTATION",
    ".fodp":"PRESENTATION", ".bpp":"PRESENTATION", ".dp1":"PRESENTATION",
    ".dps":"PRESENTATION", ".dpt":"PRESENTATION", ".eap":"PRESENTATION",
    ".itd":"PRESENTATION", ".itm":"PRESENTATION", ".keynote":"PRESENTATION",
    ".nb":"PRESENTATION", ".odg":"DOCUMENT",  // OpenDocument Graphics
    ".otp":"PRESENTATION", ".pe3":"PRESENTATION", ".pot":"PRESENTATION",
    ".pps":"PRESENTATION", ".ppt":"PRESENTATION", ".pre":"PRESENTATION",
    ".prz":"PRESENTATION", ".pwdp":"PRESENTATION", ".sdd":"PRESENTATION",
    ".sdp":"PRESENTATION", ".sti":"PRESENTATION", ".sxi":"PRESENTATION",
    ".uop":"PRESENTATION", ".vdx":"PRESENTATION", ".vsd":"PRESENTATION",
    
    // ===== PDF =====
    ".pdf":"PDF",
    
    // ===== CODE ===== (70+ estensioni)
    ".py":"CODE", ".js":"CODE", ".ts":"CODE", ".jsx":"CODE",
    ".tsx":"CODE", ".vue":"CODE", ".php":"CODE", ".rb":"CODE",
    ".go":"CODE", ".rs":"CODE", ".swift":"CODE", ".kt":"CODE",
    ".kts":"CODE", ".dart":"CODE", ".scala":"CODE", ".groovy":"CODE",
    ".lua":"CODE", ".r":"CODE", ".m":"CODE", ".mm":"CODE",
    ".c":"C_CPP", ".cpp":"C_CPP", ".cc":"C_CPP", ".cxx":"C_CPP",
    ".h":"C_CPP", ".hpp":"C_CPP", ".hxx":"C_CPP", ".h++":"C_CPP",
    ".ino":"C_CPP", ".pde":"C_CPP",
    ".cs":"DOTNET", ".vb":"DOTNET", ".fs":"DOTNET", ".fsx":"DOTNET",
    ".csproj":"DOTNET", ".vbproj":"DOTNET", ".sln":"DOTNET",
    ".cake":"CODE", ".ps1":"SCRIPT", ".psd1":"SCRIPT", ".psm1":"SCRIPT",
    ".ps1xml":"SCRIPT", ".psc1":"SCRIPT", ".pssc":"SCRIPT",
    ".pl":"SCRIPT", ".pm":"SCRIPT", ".t":"CODE", ".pod":"DOCUMENT",
    ".awk":"SCRIPT", ".sed":"SCRIPT", ".bat":"SCRIPT", ".cmd":"SCRIPT",
    ".vbs":"SCRIPT", ".vba":"SCRIPT", ".vbe":"SCRIPT", ".wsf":"SCRIPT",
    ".wsc":"SCRIPT", ".wsh":"SCRIPT",
    ".sh":"SCRIPT", ".bash":"SCRIPT", ".zsh":"SCRIPT", ".fish":"SCRIPT",
    ".csh":"SCRIPT", ".ksh":"SCRIPT", ".tcsh":"SCRIPT",
    ".coffee":"CODE", ".litcoffee":"CODE", ".iced":"CODE",
    ".clj":"CODE", ".cljs":"CODE", ".cljc":"CODE", ".edn":"DATA",
    ".erl":"CODE", ".hrl":"CODE", ".beam":"CODE",
    ".ex":"CODE", ".exs":"CODE", ".eex":"CODE", ".leex":"CODE",
    ".elm":"CODE", ".fs":"CODE", ".fsi":"CODE", ".fsscript":"CODE",
    ".for":"CODE", ".f":"CODE", ".f90":"CODE", ".f95":"CODE",
    ".f03":"CODE", ".f08":"CODE", ".hs":"CODE", ".lhs":"CODE",
    ".idr":"CODE", ".ipynb":"DATA",  // Jupyter come Data
    ".jl":"CODE", ".kt":"CODE", ".kts":"CODE",
    ".lisp":"CODE", ".lsp":"CODE", ".cl":"CODE", ".el":"CODE",
    ".scm":"CODE", ".ss":"CODE", ".rkt":"CODE",
    ".ml":"CODE", ".mli":"CODE", ".mll":"CODE", ".mly":"CODE",
    ".nim":"CODE", ".nims":"CODE", ".nix":"CODE",
    ".p":"CODE", ".pas":"CODE", ".pp":"CODE",
    ".pl6":"CODE", ".pm6":"CODE", ".pod6":"CODE",
    ".p6":"CODE", ".pm":"SCRIPT",  // Script mapping
    ".p6l":"CODE", ".p6m":"CODE",
    ".purs":"CODE", ".pyi":"CODE", ".pyx":"CODE", ".pxd":"CODE",
    ".pxi":"CODE", ".q":"CODE", ".qml":"CODE",
    ".r":"CODE", ".rdata":"DATA", ".rds":"DATA",
    ".rd":"DOCUMENT", ".re":"CODE", ".rei":"CODE",
    ".rkt":"CODE", ".rktd":"CODE", ".rktl":"CODE", ".scrbl":"CODE",
    ".s":"CODE", ".asm":"CODE", ".s51":"CODE",
    ".sol":"CODE", ".sql":"DATABASE",  // SQL come Database
    ".tcl":"SCRIPT", ".tk":"SCRIPT", ".itcl":"SCRIPT",
    ".v":"CODE", ".vhd":"CODE", ".vhdl":"CODE", ".verilog":"CODE",
    ".vim":"SCRIPT", ".wasm":"WEB",  // WASM come Web
    ".wat":"CODE", ".wast":"CODE",
    ".xml":"XML", ".xsd":"XML", ".xsl":"XML", ".xslt":"XML",
    ".dtd":"XML", ".rng":"XML", ".sch":"XML",
    
    // ===== JAVA ECOSYSTEM ===== (20+ estensioni)
    ".java":"JAVA", ".class":"JAVA", ".jar":"JAVA", ".war":"JAVA",
    ".ear":"JAVA", ".jsp":"JAVA", ".jspx":"JAVA", ".tag":"JAVA",
    ".tld":"XML",  // TLD come XML
    ".properties":"CONFIG", ".classpath":"CONFIG",
    ".project":"CONFIG", ".prefs":"CONFIG", ".mf":"CONFIG",
    ".jad":"JAVA", ".jnilib":"JAVA", ".jnlp":"JAVA",
    ".jws":"JAVA", ".jfr":"JAVA", ".jimage":"JAVA",
    ".jmod":"JAVA", ".jrt":"JAVA", ".jsh":"JAVA",
    ".jspf":"JAVA", ".jspx":"JAVA", ".tagf":"JAVA",
    
    // ===== WEB TECHNOLOGIES ===== (30+ estensioni)
    ".html":"WEB", ".htm":"WEB", ".xhtml":"WEB", ".shtml":"WEB",
    ".dhtml":"WEB", ".css":"WEB", ".scss":"WEB", ".sass":"WEB",
    ".less":"WEB", ".styl":"WEB", ".asp":"WEB", ".aspx":"WEB",
    ".php":"CODE",  // PHP come Code
    ".phtml":"WEB", ".jsf":"WEB", ".cfm":"WEB", ".cfc":"WEB",
    ".wasm":"WEB", ".ejs":"WEB", ".hbs":"WEB", ".handlebars":"WEB",
    ".mustache":"WEB", ".haml":"WEB", ".pug":"WEB", ".jade":"WEB",
    ".slim":"WEB", ".liquid":"WEB", ".twig":"WEB", ".blade":"WEB",
    ".erb":"WEB", ".rhtml":"WEB", ".jsp":"JAVA",  // Java mapping
    ".do":"WEB", ".action":"WEB", ".wsdl":"XML",  // WSDL come XML
    
    // ===== DATA FILES ===== (40+ estensioni)
    ".json":"JSON_YAML", ".yaml":"JSON_YAML", ".yml":"JSON_YAML",
    ".toml":"JSON_YAML", ".hjson":"JSON_YAML", ".ndjson":"JSON_YAML",
    ".avro":"DATA", ".parquet":"DATA", ".orc":"DATA",
    ".feather":"DATA", ".arrow":"DATA", ".proto":"CODE",
    ".capnp":"DATA", ".flatbuffers":"DATA", ".fbs":"DATA",
    ".msgpack":"DATA", ".bson":"DATA", ".cbor":"DATA",
    ".ubjson":"DATA", ".pickle":"DATA", ".pkl":"DATA",
    ".joblib":"DATA", ".npy":"DATA", ".npz":"DATA",
    ".mat":"DATA", ".h5":"DATA", ".hdf5":"DATA", ".hdf":"DATA",
    ".netcdf":"DATA", ".nc":"DATA", ".grib":"DATA", ".grb":"DATA",
    ".buf":"DATA", ".pbf":"DATA", ".osm":"DATA",
    ".geojson":"GIS", ".topojson":"GIS",  // GIS mapping
    ".kml":"GIS", ".kmz":"GIS", ".gpx":"GIS", ".gdb":"GIS",
    ".shp":"GIS", ".shx":"GIS", ".dbf":"DATABASE",  // DBF come Database
    
    // ===== DATABASE ===== (40+ estensioni)
    ".sql":"DATABASE", ".ddl":"DATABASE", ".dml":"DATABASE",
    ".plsql":"DATABASE", ".pks":"DATABASE", ".pkb":"DATABASE",
    ".trg":"DATABASE", ".idx":"DATABASE", ".tab":"DATABASE",
    ".db":"DATABASE", ".sqlite":"DATABASE", ".sqlite3":"DATABASE",
    ".db3":"DATABASE", ".mdb":"DATABASE", ".accdb":"DATABASE",
    ".mdf":"DATABASE", ".ldf":"DATABASE", ".ndf":"DATABASE",
    ".dbf":"DATABASE", ".frm":"DATABASE", ".myd":"DATABASE",
    ".myi":"DATABASE", ".ibd":"DATABASE", ".ibdata":"DATABASE",
    ".fdb":"DATABASE", ".gdb":"GIS",  // GIS mapping
    ".kexi":"DATABASE", ".kexic":"DATABASE", ".kexis":"DATABASE",
    ".maria":"DATABASE", ".mysql":"DATABASE", ".nsf":"DATABASE",
    ".ns2":"DATABASE", ".ns3":"DATABASE", ".ns4":"DATABASE",
    ".ora":"DATABASE", ".pdb":"DATABASE", ".rdb":"DATABASE",
    ".sdb":"DATABASE", ".spatialite":"DATABASE", ".sqlitedb":"DATABASE",
    ".tps":"DATABASE", ".trc":"LOG",  // Trace come Log
    ".udb":"DATABASE", ".wdb":"DATABASE",
    
    // ===== CONFIGURATION ===== (50+ estensioni)
    ".ini":"CONFIG", ".cfg":"CONFIG", ".conf":"CONFIG",
    ".config":"CONFIG", ".reg":"CONFIG", ".env":"CONFIG",
    ".rc":"CONFIG", ".properties":"CONFIG", ".plist":"CONFIG",
    ".desktop":"CONFIG", ".service":"CONFIG", ".timer":"CONFIG",
    ".socket":"CONFIG", ".target":"CONFIG", ".mount":"CONFIG",
    ".automount":"CONFIG", ".gitignore":"CONFIG", ".dockerignore":"CONFIG",
    ".editorconfig":"CONFIG", ".htaccess":"CONFIG", ".htpasswd":"CONFIG",
    ".npmrc":"CONFIG", ".yarnrc":"CONFIG", ".bowerrc":"CONFIG",
    ".eslintrc":"CONFIG", ".prettierrc":"CONFIG", ".babelrc":"CONFIG",
    ".stylelintrc":"CONFIG", ".commitlintrc":"CONFIG", ".huskyrc":"CONFIG",
    ".lintstagedrc":"CONFIG", ".czrc":"CONFIG", ".renovaterc":"CONFIG",
    ".snyk":"CONFIG", ".codeclimate":"CONFIG", ".codacy":"CONFIG",
    ".scrutinizer":"CONFIG", ".travis":"CONFIG", ".gitlab":"CONFIG",
    ".appveyor":"CONFIG", ".circleci":"CONFIG", ".drone":"CONFIG",
    ".woodpecker":"CONFIG", ".gitea":"CONFIG", ".gogs":"CONFIG",
    ".vscode":"CONFIG", ".idea":"CONFIG", ".sublime-project":"CONFIG",
    ".sublime-workspace":"CONFIG", ".vimrc":"CONFIG", ".gvimrc":"CONFIG",
    ".tmux.conf":"CONFIG", ".screenrc":"CONFIG", ".inputrc":"CONFIG",
    ".bashrc":"SCRIPT",  // Bash script
    ".bash_profile":"SCRIPT", ".bash_logout":"SCRIPT",
    ".zshrc":"SCRIPT", ".zprofile":"SCRIPT", ".zlogin":"SCRIPT",
    ".zlogout":"SCRIPT", ".fishrc":"SCRIPT",
    
    // ===== LOGS ===== (20+ estensioni)
    ".log":"LOG", ".trace":"LOG", ".out":"LOG", ".err":"LOG",
    ".debug":"LOG", ".audit":"LOG", ".journal":"LOG",
    ".syslog":"LOG", ".log4j":"LOG", ".log4net":"LOG",
    ".log4php":"LOG", ".lcf":"LOG", ".lck":"LOG",
    ".access":"LOG", ".error":"LOG", ".exception":"LOG",
    ".stacktrace":"LOG", ".dump":"BACKUP",  // Dump come Backup
    ".core":"LOG", ".crash":"LOG", ".dmp":"BACKUP",  // Dump come Backup
    ".mdmp":"LOG", ".hdmp":"LOG", ".minidump":"LOG",
    ".evt":"LOG", ".evtx":"LOG", ".etl":"LOG",
    
    // ===== BACKUP / TEMP ===== (20+ estensioni)
    ".bak":"BACKUP", ".bkp":"BACKUP", ".orig":"BACKUP",
    ".swo":"BACKUP", ".swp":"BACKUP", ".old":"BACKUP",
    ".tmp":"BACKUP", ".temp":"BACKUP", ".backup":"BACKUP",
    ".save":"BACKUP", ".dmp":"BACKUP", ".dump":"BACKUP",
    ".qbb":"BACKUP", ".qbw":"BACKUP", ".qbm":"BACKUP",
    ".qbo":"BACKUP", ".qbs":"BACKUP", ".qby":"BACKUP",
    ".qwc":"BACKUP", ".qwi":"BACKUP", ".qxd":"BACKUP",
    ".qxl":"BACKUP", ".qxp":"BACKUP", ".qxt":"BACKUP",
    ".qbb":"BACKUP", ".qb2002":"BACKUP", ".qb2003":"BACKUP",
    ".qb2004":"BACKUP", ".qb2005":"BACKUP", ".qb2006":"BACKUP",
    ".qb2007":"BACKUP", ".qb2008":"BACKUP", ".qb2009":"BACKUP",
    ".qb2010":"BACKUP", ".qb2011":"BACKUP", ".qb2012":"BACKUP",
    ".qb2013":"BACKUP", ".qb2014":"BACKUP", ".qb2015":"BACKUP",
    ".qb2016":"BACKUP", ".qb2017":"BACKUP", ".qb2018":"BACKUP",
    ".qb2019":"BACKUP", ".qb2020":"BACKUP", ".qb2021":"BACKUP",
    ".qb2022":"BACKUP", ".qb2023":"BACKUP", ".qb2024":"BACKUP",
    
    // ===== EMAIL ===== (20+ estensioni)
    ".eml":"EMAIL", ".msg":"EMAIL", ".pst":"EMAIL", ".ost":"EMAIL",
    ".mbox":"EMAIL", ".mbx":"EMAIL", ".emlx":"EMAIL",
    ".oft":"EMAIL", ".emlxpart":"EMAIL", ".dwl":"EMAIL",
    ".emlx":"EMAIL", ".emlxpart":"EMAIL", ".emlxp":"EMAIL",
    ".emlx":"EMAIL", ".emlxpart":"EMAIL", ".emlxp":"EMAIL",
    ".emlx":"EMAIL", ".emlxpart":"EMAIL", ".emlxp":"EMAIL",
    ".dbx":"EMAIL", ".mbx":"EMAIL", ".mbs":"EMAIL",
    ".mcb":"EMAIL", ".mdb":"DATABASE",  // Access DB
    ".mfw":"EMAIL", ".mim":"EMAIL", ".mime":"EMAIL",
    ".mml":"EMAIL", ".mmp":"EMAIL", ".msg":"EMAIL",
    ".nws":"EMAIL", ".p7m":"CERT",  // Certificato
    ".p7s":"CERT",  // Certificato
    ".pst":"EMAIL", ".rfc822":"EMAIL", ".sbd":"EMAIL",
    ".sfd":"EMAIL", ".sig":"OTHER",  // Signature
    ".smime":"EMAIL", ".tbb":"EMAIL", ".tbnc":"EMAIL",
    ".thunderbird":"EMAIL", ".vcf":"OTHER",  // Contact
    ".wab":"EMAIL", ".wabm":"EMAIL",
    
    // ===== FONTS ===== (20+ estensioni)
    ".ttf":"FONT", ".otf":"FONT", ".woff":"FONT", ".woff2":"FONT",
    ".eot":"FONT", ".fon":"FONT", ".fnt":"FONT",
    ".pfa":"FONT", ".pfb":"FONT", ".gsf":"FONT",
    ".ttc":"FONT", ".dfont":"FONT", ".afm":"FONT",
    ".pfm":"FONT", ".tfm":"FONT", ".vfb":"FONT",
    ".bdf":"FONT", ".pcf":"FONT", ".snf":"FONT",
    ".fnt":"FONT", ".fon":"FONT", ".otf":"FONT",
    ".ttf":"FONT", ".woff":"FONT", ".woff2":"FONT",
    ".eot":"FONT", ".sfd":"FONT", ".ttc":"FONT",
    
    // ===== CERTIFICATES & SECURITY ===== (20+ estensioni)
    ".cer":"CERT", ".crt":"CERT", ".key":"CERT", ".pem":"CERT",
    ".p12":"CERT", ".pfx":"CERT", ".der":"CERT", ".csr":"CERT",
    ".crl":"CERT", ".jks":"CERT", ".keystore":"CERT",
    ".truststore":"CERT", ".p7b":"CERT", ".p7c":"CERT",
    ".p7s":"CERT", ".p7m":"CERT", ".spc":"CERT",
    ".pvk":"CERT", ".pub":"CERT", ".gpg":"CERT",
    ".pgp":"CERT", ".asc":"CERT", ".sig":"CERT",
    ".signature":"CERT", ".cert":"CERT", ".certificate":"CERT",
    ".certs":"CERT", ".crts":"CERT", ".p8":"CERT",
    ".pkcs8":"CERT", ".pkcs12":"CERT", ".pkcs7":"CERT",
    ".p10":"CERT", ".p12":"CERT", ".p7r":"CERT",
    
    // ===== EXECUTABLES ===== (30+ estensioni)
    ".exe":"EXEC", ".msi":"EXEC", ".app":"EXEC", ".deb":"EXEC",
    ".rpm":"EXEC", ".apk":"EXEC", ".dll":"EXEC", ".so":"EXEC",
    ".dylib":"EXEC", ".bin":"EXEC", ".out":"EXEC", ".elf":"EXEC",
    ".com":"EXEC", ".scr":"EXEC", ".cpl":"EXEC",
    ".sys":"EXEC", ".drv":"EXEC", ".vxd":"EXEC",
    ".ocx":"EXEC", ".ax":"EXEC", ".acm":"EXEC",
    ".ax":"EXEC", ".bpl":"EXEC", ".cpl":"EXEC",
    ".dpl":"EXEC", ".drv":"EXEC", ".efi":"EXEC",
    ".ex_":"EXEC", ".ipa":"EXEC", ".jar":"JAVA",  // Java mapping
    ".jnlp":"JAVA",  // Java mapping
    ".ko":"EXEC", ".lib":"EXEC", ".o":"EXEC",
    ".obj":"EXEC", ".ovl":"EXEC", ".prx":"EXEC",
    ".rdo":"EXEC", ".rom":"EXEC", ".rsx":"EXEC",
    ".s3m":"EXEC", ".scr":"EXEC", ".sys":"EXEC",
    ".vxd":"EXEC", ".xex":"EXEC",
    
    // ===== GIS ===== (20+ estensioni)
    ".shp":"GIS", ".shx":"GIS", ".dbf":"DATABASE",  // DBF come Database
    ".prj":"GIS", ".sbn":"GIS", ".sbx":"GIS",
    ".fbn":"GIS", ".fbx":"THREED",  // 3D mapping
    ".ain":"GIS", ".aih":"GIS", ".atx":"GIS",
    ".mxd":"GIS", ".qgs":"GIS", ".qgz":"GIS",
    ".gpx":"GIS", ".kml":"GIS", ".kmz":"GIS",
    ".geojson":"GIS", ".topojson":"GIS",
    ".gdb":"GIS", ".gdbindexes":"GIS", ".gdbtable":"GIS",
    ".gdbtablx":"GIS", ".gdbx":"GIS", ".gfs":"GIS",
    ".gml":"GIS", ".gpkg":"GIS", ".grd":"GIS",
    ".hdr":"GIS", ".img":"IMAGE",  // Image mapping
    ".map":"GIS", ".mdb":"DATABASE",  // Access DB
    ".ovr":"GIS", ".rrd":"GIS", ".sdc":"GIS",
    ".sid":"GIS", ".tif":"IMAGE",  // Image mapping
    ".tiff":"IMAGE",  // Image mapping
    ".vrt":"GIS", ".xml":"XML",  // XML mapping
    ".xpm":"IMAGE",  // Image mapping
    ".xyz":"GIS", ".zip":"ARCHIVE",  // Archive mapping
    
    // ===== CAD ===== (20+ estensioni)
    ".dwg":"CAD", ".dxf":"CAD", ".dwf":"CAD", ".dwfx":"CAD",
    ".dgn":"CAD", ".dwt":"CAD", ".dxb":"CAD",
    ".plt":"CAD", ".hpgl":"CAD", ".plc":"CAD",
    ".plf":"CAD", ".shx":"GIS",  // GIS shapefile index
    ".shp":"GIS",  // GIS shapefile
    ".3dm":"THREED",  // 3D mapping
    ".3ds":"THREED",  // 3D mapping
    ".blend":"THREED",  // 3D mapping
    ".c4d":"CAD", ".catdrawing":"CAD", ".catpart":"CAD",
    ".catproduct":"CAD", ".cgr":"CAD", ".drf":"CAD",
    ".dwf":"CAD", ".dwg":"CAD", ".dxf":"CAD",
    ".edrw":"CAD", ".eprt":"CAD", ".iam":"CAD",
    ".idw":"CAD", ".iges":"CAD", ".igs":"CAD",
    ".ipt":"CAD", ".jt":"CAD", ".model":"CAD",
    ".neu":"CAD", ".obj":"THREED",  // 3D mapping
    ".par":"CAD", ".psm":"CAD", ".pwd":"CAD",
    ".pwi":"CAD", ".pwi":"CAD", ".sat":"CAD",
    ".sab":"CAD", ".sldasm":"CAD", ".slddrw":"CAD",
    ".sldprt":"CAD", ".step":"CAD", ".stl":"THREED",  // 3D printing
    ".stp":"CAD", ".x_b":"CAD", ".x_t":"CAD",
    
    // ===== 3D ===== (20+ estensioni)
    ".obj":"THREED", ".stl":"THREED", ".fbx":"THREED",
    ".blend":"THREED", ".mb":"THREED", ".ma":"THREED",
    ".max":"THREED", ".3ds":"THREED", ".dae":"THREED",
    ".collada":"THREED", ".gltf":"THREED", ".glb":"THREED",
    ".ply":"THREED", ".x3d":"THREED", ".x3dv":"THREED",
    ".vrml":"THREED", ".wrl":"THREED", ".abc":"THREED",
    ".bvh":"THREED", ".c3d":"THREED", ".cob":"THREED",
    ".dxf":"CAD",  // CAD mapping
    ".geo":"THREED", ".iges":"CAD",  // CAD mapping
    ".lwo":"THREED", ".lws":"THREED", ".lxo":"THREED",
    ".mot":"THREED", ".nff":"THREED", ".off":"THREED",
    ".pdb":"DATABASE",  // Protein Data Bank
    ".pov":"THREED", ".rcs":"THREED", ".scn":"THREED",
    ".skp":"THREED", ".smd":"THREED", ".stl":"THREED",
    ".u3d":"THREED", ".usd":"THREED", ".usda":"THREED",
    ".usdc":"THREED", ".usdz":"THREED", ".vda":"THREED",
    ".x3d":"THREED",
    
    // ===== VIRTUALIZATION ===== (15+ estensioni)
    ".vhd":"VIRTUAL", ".vhdx":"VIRTUAL", ".vmdk":"VIRTUAL",
    ".vdi":"VIRTUAL", ".qcow":"VIRTUAL", ".qcow2":"VIRTUAL",
    ".vmem":"VIRTUAL", ".vmsn":"VIRTUAL", ".vmsd":"VIRTUAL",
    ".nvram":"VIRTUAL", ".ovf":"VIRTUAL", ".ova":"VIRTUAL",
    ".vbox":"VIRTUAL", ".vdi":"VIRTUAL", ".vhd":"VIRTUAL",
    ".vhdx":"VIRTUAL", ".vmdk":"VIRTUAL", ".hdd":"VIRTUAL",
    ".hds":"VIRTUAL", ".vdi":"VIRTUAL", ".vfd":"VIRTUAL",
    ".vfd":"VIRTUAL", ".vhd":"VIRTUAL", ".vmem":"VIRTUAL",
    ".vmsd":"VIRTUAL", ".vmsn":"VIRTUAL", ".vmss":"VIRTUAL",
    ".vmtm":"VIRTUAL", ".vmxf":"VIRTUAL",
    
    // ===== PACKAGE MANAGERS ===== (20+ estensioni)
    ".npm":"PACKAGE", ".node_modules":"PACKAGE",
    ".package-lock.json":"PACKAGE", ".yarn.lock":"PACKAGE",
    ".Gemfile":"PACKAGE", ".Gemfile.lock":"PACKAGE",
    ".Pipfile":"PACKAGE", ".Pipfile.lock":"PACKAGE",
    ".poetry.lock":"PACKAGE", ".Cargo.toml":"PACKAGE",
    ".Cargo.lock":"PACKAGE", ".go.mod":"PACKAGE",
    ".go.sum":"PACKAGE", ".composer.json":"PACKAGE",
    ".composer.lock":"PACKAGE", ".podspec":"PACKAGE",
    ".podfile":"PACKAGE", ".podfile.lock":"PACKAGE",
    ".cartfile":"PACKAGE", ".cartfile.resolved":"PACKAGE",
    ".paket.dependencies":"PACKAGE", ".paket.lock":"PACKAGE",
    ".pubspec.yaml":"PACKAGE", ".pubspec.lock":"PACKAGE",
    ".csproj":"DOTNET",  // .NET project
    ".fsproj":"DOTNET",  // .NET project
    ".vbproj":"DOTNET",  // .NET project
    ".nuspec":"PACKAGE", ".nupkg":"PACKAGE",
    ".snupkg":"PACKAGE", ".whl":"PACKAGE",
    ".egg":"PACKAGE", ".egg-info":"PACKAGE",
    ".dist-info":"PACKAGE", ".wheel":"PACKAGE",
    
    // ===== OTHER ===== (30+ estensioni)
    ".ldif":"OTHER", ".tl":"OTHER", ".joined":"OTHER",
    ".rcv":"OTHER", ".sr":"OTHER", ".pat":"OTHER",
    ".exc":"OTHER", ".gpg":"CERT",  // GPG come Certificato
    ".inp":"OTHER", ".sig":"CERT",  // Signature come Certificato
    ".asc":"CERT",  // ASCII armor come Certificato
    ".md5":"OTHER", ".sha1":"OTHER", ".sha256":"OTHER",
    ".torrent":"OTHER", ".part":"OTHER", ".crdownload":"OTHER",
    ".download":"OTHER", ".lnk":"OTHER", ".url":"OTHER",
    ".webloc":"OTHER", ".desktop":"CONFIG",  // Desktop entry
    ".bookmark":"OTHER", ".m3u":"AUDIO",  // Playlist
    ".m3u8":"AUDIO",  // Playlist
    ".pls":"AUDIO",  // Playlist
    ".xspf":"AUDIO",  // Playlist
    ".cue":"AUDIO",  // Cue sheet
    ".nfo":"OTHER", ".magnet":"OTHER", ".dat":"DATA",
    ".temp":"BACKUP", ".tmp":"BACKUP", ".swp":"BACKUP",
    ".swo":"BACKUP", ".lock":"OTHER", ".pid":"OTHER",
    ".sock":"OTHER", ".pipe":"OTHER", ".fifo":"OTHER"
};

/* -------------------------------------------
   Override for more specific file icons
   ------------------------------------------- */
const EXT_ICON_OVERRIDE = {
    // Office
    ".doc":  "fa-file-word",  ".docx":"fa-file-word",  ".docm":"fa-file-word",
    ".dot":  "fa-file-word",  ".dotx":"fa-file-word",  ".dotm":"fa-file-word",
    ".xls":  "fa-file-excel", ".xlsx":"fa-file-excel", ".xlsm":"fa-file-excel",
    ".xlsb": "fa-file-excel", ".xltx":"fa-file-excel", ".xltm":"fa-file-excel",
    ".ppt":  "fa-file-powerpoint", ".pptx":"fa-file-powerpoint", ".pptm":"fa-file-powerpoint",
    ".ppsx": "fa-file-powerpoint", ".ppsm":"fa-file-powerpoint", ".potx":"fa-file-powerpoint",
    ".potm": "fa-file-powerpoint", ".key": "fa-file-powerpoint",
    ".pdf":  "fa-file-pdf",
    ".csv":  "fa-file-csv",   ".tsv":"fa-file-csv",
    ".rtf":  "fa-file-lines", ".txt":"fa-file-lines", ".md":"fa-file-lines",
    ".tex":  "fa-file-lines", ".latex":"fa-file-lines",
    
    // Code
    ".json": "fa-file-code",   ".yaml":"fa-file-code",   ".yml":"fa-file-code",
    ".toml": "fa-file-code",   ".xml":"fa-file-code",    ".xsd":"fa-file-code",
    ".html": "fa-file-code",   ".htm":"fa-file-code",    ".css":"fa-file-code",
    ".scss": "fa-file-code",   ".sass":"fa-file-code",   ".less":"fa-file-code",
    ".js":   "fa-file-code",   ".ts":"fa-file-code",     ".jsx":"fa-file-code",
    ".tsx":  "fa-file-code",   ".vue":"fa-file-code",    ".py":"fa-file-code",
    ".rb":   "fa-file-code",   ".php":"fa-file-code",    ".java":"fa-file-code",
    ".c":    "fa-file-code",   ".cpp":"fa-file-code",    ".h":"fa-file-code",
    ".hpp":  "fa-file-code",   ".cs":"fa-file-code",     ".go":"fa-file-code",
    ".rs":   "fa-file-code",   ".swift":"fa-file-code",  ".kt":"fa-file-code",
    ".dart": "fa-file-code",   ".lua":"fa-file-code",    ".r":"fa-file-code",
    
    // Media
    ".mp4":  "fa-file-video",  ".m4v":"fa-file-video",   ".avi":"fa-file-video",
    ".mkv":  "fa-file-video",  ".mov":"fa-file-video",   ".wmv":"fa-file-video",
    ".flv":  "fa-file-video",  ".webm":"fa-file-video",  ".mpg":"fa-file-video",
    ".mpeg": "fa-file-video",  ".3gp":"fa-file-video",   ".m2ts":"fa-file-video",
    ".mp3":  "fa-file-audio",  ".wav":"fa-file-audio",   ".flac":"fa-file-audio",
    ".aac":  "fa-file-audio",  ".ogg":"fa-file-audio",   ".m4a":"fa-file-audio",
    ".wma":  "fa-file-audio",  ".opus":"fa-file-audio",
    ".png":  "fa-file-image",  ".jpg":"fa-file-image",   ".jpeg":"fa-file-image",
    ".bmp":  "fa-file-image",  ".gif":"fa-file-image",   ".svg":"fa-file-image",
    ".webp": "fa-file-image",  ".ico":"fa-file-image",   ".tif":"fa-file-image",
    ".tiff": "fa-file-image",  ".psd":"fa-file-image",   ".ai":"fa-file-image",
    ".raw":  "fa-file-image",  ".heic":"fa-file-image",  ".avif":"fa-file-image",
    
    // Archives
    ".zip":  "fa-file-archive", ".rar":"fa-file-archive", ".7z":"fa-file-archive",
    ".gz":   "fa-file-archive", ".tar":"fa-file-archive", ".bz2":"fa-file-archive",
    ".xz":   "fa-file-archive", ".iso":"fa-file-archive", ".dmg":"fa-file-archive",
    ".pkg":  "fa-file-archive", ".deb":"fa-file-archive", ".rpm":"fa-file-archive",
    ".zst":  "fa-file-archive", ".cab":"fa-file-archive",
    
    // Scripts
    ".ps1":  "fa-terminal",     ".psd1":"fa-terminal",    ".psm1":"fa-terminal",
    ".bat":  "fa-terminal",     ".cmd":"fa-terminal",     ".vbs":"fa-terminal",
    ".vba":  "fa-terminal",     ".sh":"fa-terminal",      ".bash":"fa-terminal",
    ".zsh":  "fa-terminal",     ".fish":"fa-terminal",    ".pl":"fa-terminal",
    ".pm":   "fa-terminal",     ".awk":"fa-terminal",     ".sed":"fa-terminal",
    ".tcl":  "fa-terminal",     ".expect":"fa-terminal",
    
    // Config
    ".ini":  "fa-gear",         ".cfg":"fa-gear",         ".conf":"fa-gear",
    ".env":  "fa-gear",         ".properties":"fa-gear",  ".plist":"fa-gear",
    ".desktop":"fa-gear",       ".service":"fa-gear",     ".timer":"fa-gear",
    ".gitignore":"fa-gear",     ".dockerignore":"fa-gear",".editorconfig":"fa-gear",
    ".htaccess":"fa-gear",      ".htpasswd":"fa-gear",
    
    // Logs
    ".log":  "fa-scroll",       ".trace":"fa-scroll",     ".debug":"fa-scroll",
    ".audit":"fa-scroll",       ".journal":"fa-scroll",   ".syslog":"fa-scroll",
    
    // Database
    ".sql":  "fa-database",     ".db":"fa-database",      ".sqlite":"fa-database",
    ".mdb":  "fa-database",     ".accdb":"fa-database",   ".dbf":"fa-database",
    
    // GIS
    ".shp":  "fa-map-location-dot", ".shx":"fa-map-location-dot", ".prj":"fa-map-location-dot",
    ".gpx":  "fa-map-location-dot", ".kml":"fa-map-location-dot", ".kmz":"fa-map-location-dot",
    ".geojson":"fa-map-location-dot", ".topojson":"fa-map-location-dot",
    
    // CAD/3D
    ".dwg":  "fa-cubes",        ".dxf":"fa-cubes",        ".stl":"fa-cube",
    ".obj":  "fa-cube",         ".fbx":"fa-cube",         ".blend":"fa-cube",
    ".3ds":  "fa-cube",         ".max":"fa-cube",
    
    // Virtualization
    ".vhd":  "fa-cloud",        ".vhdx":"fa-cloud",       ".vmdk":"fa-cloud",
    ".vdi":  "fa-cloud",        ".qcow2":"fa-cloud",      ".ova":"fa-cloud",
    ".ovf":  "fa-cloud",
    
    // Email
    ".eml":  "fa-envelope",     ".msg":"fa-envelope",     ".pst":"fa-envelope",
    ".ost":  "fa-envelope",     ".mbox":"fa-envelope",    ".mbx":"fa-envelope",
    
    // Certificates
    ".cer":  "fa-lock",         ".crt":"fa-lock",         ".key":"fa-lock",
    ".pem":  "fa-lock",         ".p12":"fa-lock",         ".pfx":"fa-lock",
    ".gpg":  "fa-lock",         ".asc":"fa-lock",
    
    // Fonts
    ".ttf":  "fa-font",         ".otf":"fa-font",         ".woff":"fa-font",
    ".woff2":"fa-font",         ".eot":"fa-font",
    
    // Executables
    ".exe":  "fa-microchip",    ".msi":"fa-microchip",    ".app":"fa-microchip",
    ".dll":  "fa-microchip",    ".so":"fa-microchip",     ".dylib":"fa-microchip",
    ".bin":  "fa-microchip",    ".out":"fa-microchip",
    
    // Package managers
    ".npm":         "fa-box",   ".node_modules":"fa-box", 
    ".package-lock.json":"fa-box", ".yarn.lock":"fa-box",
    ".Gemfile":"fa-box",         ".Pipfile":"fa-box",      ".Cargo.toml":"fa-box"
};

/* -------------------------------------------
   Fallback emoji if FA is not available
   ------------------------------------------- */
const EXT_EMOJI = {
    // Common files
    ".txt":"📄", ".md":"📄", ".rst":"📄", ".rtf":"📄",
    ".pdf":"📕", ".doc":"📄", ".docx":"📄", ".docm":"📄",
    ".xls":"📊", ".xlsx":"📊", ".xlsm":"📊", ".csv":"📊",
    ".ppt":"📊", ".pptx":"📊", ".pptm":"📊", ".key":"📊",
    ".json":"⬢", ".yaml":"⚙️", ".yml":"⚙️", ".toml":"⚙️",
    ".xml":"🔧", ".xsd":"🔧", ".html":"🌐", ".css":"🎨",
    
    // Code
    ".js":"📜", ".ts":"📜", ".jsx":"📜", ".tsx":"📜",
    ".py":"📜", ".rb":"📜", ".php":"📜", ".java":"☕",
    ".c":"📜", ".cpp":"📜", ".h":"📜", ".hpp":"📜",
    ".cs":"📜", ".go":"📜", ".rs":"📜", ".swift":"📜",
    ".kt":"📜", ".dart":"📜", ".lua":"📜", ".r":"📜",
    
    // Scripts
    ".ps1":"💻", ".psd1":"💻", ".psm1":"💻", ".bat":"💻",
    ".cmd":"💻", ".vbs":"💻", ".vba":"💻", ".sh":"💻",
    ".bash":"💻", ".zsh":"💻", ".fish":"💻", ".pl":"💻",
    ".awk":"💻", ".sed":"💻",
    
    // Media
    ".mp4":"🎞️", ".avi":"🎞️", ".mkv":"🎞️", ".mov":"🎞️",
    ".wmv":"🎞️", ".flv":"🎞️", ".webm":"🎞️", ".mpg":"🎞️",
    ".mpeg":"🎞️", ".3gp":"🎞️", ".m2ts":"🎞️",
    ".mp3":"🎵", ".wav":"🎵", ".flac":"🎵", ".aac":"🎵",
    ".ogg":"🎵", ".m4a":"🎵", ".wma":"🎵", ".opus":"🎵",
    ".png":"🖼️", ".jpg":"🖼️", ".jpeg":"🖼️", ".gif":"🖼️",
    ".svg":"🖼️", ".bmp":"🖼️", ".webp":"🖼️", ".ico":"🖼️",
    ".tif":"🖼️", ".tiff":"🖼️", ".psd":"🖼️", ".ai":"🖼️",
    ".raw":"🖼️", ".heic":"🖼️", ".avif":"🖼️",
    
    // Archives
    ".zip":"🗜️", ".rar":"🗜️", ".7z":"🗜️", ".gz":"🗜️",
    ".tar":"🗜️", ".bz2":"🗜️", ".xz":"🗜️", ".iso":"💿",
    ".dmg":"💿", ".deb":"📦", ".rpm":"📦", ".cab":"📦",
    
    // Config
    ".ini":"⚙️", ".cfg":"⚙️", ".conf":"⚙️", ".env":"⚙️",
    ".properties":"⚙️", ".plist":"⚙️", ".desktop":"⚙️",
    ".gitignore":"⚙️", ".dockerignore":"⚙️",
    
    // Logs
    ".log":"📋", ".trace":"📋", ".debug":"📋", ".audit":"📋",
    ".journal":"📋", ".syslog":"📋",
    
    // Database
    ".sql":"🗄️", ".db":"🗄️", ".sqlite":"🗄️", ".mdb":"🗄️",
    ".accdb":"🗄️", ".dbf":"🗄️",
    
    // GIS
    ".shp":"🗺️", ".gpx":"🗺️", ".kml":"🗺️", ".kmz":"🗺️",
    ".geojson":"🗺️",
    
    // CAD/3D
    ".dwg":"📐", ".dxf":"📐", ".stl":"🧊", ".obj":"🧊",
    ".fbx":"🧊", ".blend":"🧊", ".3ds":"🧊",
    
    // Virtualization
    ".vhd":"☁️", ".vmdk":"☁️", ".vdi":"☁️", ".qcow2":"☁️",
    ".ova":"☁️",
    
    // Email
    ".eml":"✉️", ".msg":"✉️", ".pst":"📫", ".ost":"📫",
    ".mbox":"✉️",
    
    // Certificates
    ".cer":"🔒", ".crt":"🔒", ".key":"🔒", ".pem":"🔒",
    ".p12":"🔒", ".gpg":"🔒", ".asc":"🔒",
    
    // Fonts
    ".ttf":"🔤", ".otf":"🔤", ".woff":"🔤", ".woff2":"🔤",
    
    // Executables
    ".exe":"⚙️", ".msi":"📦", ".app":"⚙️", ".dll":"🧩",
    ".so":"🧩", ".bin":"⚙️",
    
    // Package managers
    ".npm":"📦", ".node_modules":"📦", 
    ".package-lock.json":"📦", ".yarn.lock":"📦",
    ".Gemfile":"📦", ".Pipfile":"📦", ".Cargo.toml":"📦"
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
    if (window.__DEBUG__) console.log("[Catalog] Rendering color legend in:", containerId);
    
    const box = document.getElementById(containerId);
    if (!box) {
        if (window.__DEBUG__
            <span class="legend-color" style="background: ${color};"></span>
            <span class="legend-icon">${iconHtml}</span>
            <span class="legend-cat">${cat}</span>
            <span class="legend-exts" title="${catMap[cat].join(', ')}">
                ${catMap[cat].slice(0, 5).join(', ')}${catMap[cat].length > 5 ? '...' : ''}
            </span>
        `;
        box.appendChild(wrap);
    }
    
    if (window.__DEBUG__) console.log(`[Catalog] Legend rendered with ${cats.length} categories`);
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
