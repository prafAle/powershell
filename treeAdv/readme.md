# TreeAdv - Advanced Filesystem Tree Analyzer

<!-- ===== BADGES ===== -->
![PowerShell 7.x](https://img.shields.io/badge/PowerShell-7.x-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
---

TreeAdv is a high-performance, multi-threaded directory tree analyzer for PowerShell 7.x.  
It uses a Breadth-First Search (BFS) algorithm to traverse directories, collect extensive metadata, and generate professional reports in multiple formats.  
Designed for both system administrators and developers, it offers deep insights into filesystem structures with a focus on speed and detail.

---

## ✨ Features

- **🚀 High-Performance BFS Traversal**  
  Uses a runspace pool for parallel directory enumeration, dramatically speeding up scans on multi-core systems.

- **📊 Multi-Format Output**
  - **Console:** Color-coded interactive tree view  
  - **Text:** Plain text tree  
  - **JSON:** Machine-readable structured output  
  - **HTML:** Full interactive SPA (dashboard, explorer, heatmap, compare)

- **📁 Comprehensive Metadata via `-Extra`**
  - `a` → ACL (SDDL)  
  - `h` → Hash (SHA256/SHA1/MD5)  
  - `c` → CreationTime  
  - `r` → ReadOnly  
  - `s` → Hidden  

- **☁️ Cloud File Awareness**  
  Detects Offline / Sparse attributes (OneDrive-style cloud files)

- **🖥️ Interactive HTML Report**
  - Dashboard with metrics  
  - Tree Explorer with icons and badges  
  - Heatmap of largest files  
  - JSON-to-JSON Compare tool  

- **⚙️ Highly Configurable**  
  Central configuration in `treeAdv_config.ps1`

- **🐞 Advanced Debugging**  
  Master debug switch + per-module flags

- **🧙 Wizard Mode**  
  Launch with `-Wizard` for assisted configuration

- **✅ Self-Test**  
  Run `-SelfTest` to validate environment and module integrity

---

## 📦 Installation

1. Install PowerShell **7.x+**  
   👉 https://github.com/PowerShell/PowerShell

2. Download or clone the repo (e.g., `C:\Tools\TreeAdv`)

3. (Optional) Add folder to **PATH**

4. Install dependency:
   ```powershell
   Install-Module -Name ThreadJob -Scope CurrentUser -Force
   ```

---

## 🚀 Usage

### Basic Syntax
```powershell
.\treeAdv.ps1 -Path <folder> [options]
```

### **1. Basic Scan**
```powershell
.\treeAdv.ps1 -Path "C:\MyProjects"
```

### **2. HTML Report with ACL + Timestamp**
```powershell
.\treeAdv.ps1 -Path "C:\Data" -Extra a,c -Output ".\reports\data_scan.html"
```

### **3. JSON with File Hashes**
```powershell
.\treeAdv.ps1 -Path "D:\Documents" -Extra h -HashAlgorithm SHA256 -Output "docs_scan.json"
```

### **4. Wizard Mode**
```powershell
.\treeAdv.ps1 -Wizard
```

### **5. Self-Test**
```powershell
.\treeAdv.ps1 -SelfTest
```

### **6. Deep Scan with BFS Debug**
```powershell
.\treeAdv.ps1 -Path "C:\LargeFolder" -MaxDepth 50 -DebugMode
```

---

## ⚙️ Configuration

File:

```
treeAdv_files/treeAdv_config.ps1
```

Controls:

- Parallelism & queue sizes  
- Max depth, exclusion rules  
- Debug modules  
- Profiling  
- JSON depth, hash algorithm  
- Console color/progress options  

---

## 🧩 Project Structure

```text
TreeAdv/
├── treeAdv.ps1
├── treeAdv_files/
│   ├── treeAdv_config.ps1
│   ├── css/
│   │   └── style.css
│   ├── mod/
│   │   ├── catalog.js
│   │   ├── compare.js
│   │   ├── core.js
│   │   ├── dashboard.js
│   │   ├── heatmap.js
│   │   ├── htmlbody-init.js
│   │   └── tree.js
│   └── ps/
│       ├── 00_bootstrap.ps1
│       ├── 01_logging.ps1
│       ├── 02_profiler.ps1
│       ├── 03_model.ps1
│       ├── 04_utils.ps1
│       ├── 05_reparse.ps1
│       ├── 06_worker.ps1
│       ├── 07_bfs_engine.ps1
│       ├── 08_output_json.ps1
│       ├── 09_output_html.ps1
│       ├── 10_output_console.ps1
│       ├── 11_wizard.ps1
│       ├── 12_help.ps1
│       ├── 13_summary.ps1
│       ├── 14_output_format.ps1
│       └── 90_selftest.ps1
```

---

## 🤝 Contributing

Issues, suggestions, and PRs are welcome!

---

## 📄 License

Licensed under the **MIT License**.  
See the `LICENSE` file for details.
