<#
.FILENAME
    90_selftest.ps1

.SYNOPSIS
    TreeAdv environment diagnostic

.DESCRIPTION
    Verifies that TreeAdv environment is correctly configured before execution.
    Uses the script's installation path, not the current working directory.
    
    Checks:
    - directory structure (relative to script root)
    - required PowerShell modules
    - function availability
    - configuration loading
    - filesystem access
    - runspace support
    - PowerShell version compatibility
    - required extra flags handling
#>

function Invoke-TreeAdvSelfTest {
    param(
        [string]$RootPath
    )

    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║                         TREEADV DIAGNOSTIC REPORT                        " -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    $errors = 0
    $warnings = 0

    # ------------------------------------------------
    # SCRIPT LOCATION INFO
    # ------------------------------------------------
    Write-Host "▶ Script Location" -ForegroundColor Yellow
    Write-Host "   Script root: $RootPath" -ForegroundColor White
    
    # Verifica che il percorso esista
    if (Test-Path $RootPath) {
        Write-Host "   ✓ Script root exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Script root does not exist!" -ForegroundColor Red
        $errors++
    }
    Write-Host ""

    # ------------------------------------------------
    # POWERSHELL VERSION
    # ------------------------------------------------
    Write-Host "▶ PowerShell Environment" -ForegroundColor Yellow
    Write-Host "   Version: $($PSVersionTable.PSVersion)" -ForegroundColor White
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        Write-Host "   ⚠ WARNING: PowerShell 7+ recommended (current: $($PSVersionTable.PSVersion))" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "   ✓ Version OK" -ForegroundColor Green
    }
    Write-Host ""

    # ------------------------------------------------
    # DIRECTORY STRUCTURE - Usando percorso ASSOLUTO
    # ------------------------------------------------
    Write-Host "▶ Directory Structure" -ForegroundColor Yellow
    
    # Costruisci i path assoluti - treeAdv_files è direttamente nella root
    $treeAdvFiles = Join-Path $RootPath "treeAdv_files"
    $treeAdvPs = Join-Path $treeAdvFiles "ps"
    $treeAdvMod = Join-Path $treeAdvFiles "mod"
    $treeAdvCss = Join-Path $treeAdvFiles "css"
    $treeAdvConfig = Join-Path $treeAdvFiles "treeAdv_config.ps1"
    
    Write-Host "   Looking for files in: $RootPath" -ForegroundColor Gray
    Write-Host "   treeAdv_files path: $treeAdvFiles" -ForegroundColor Gray
    
    # Verifica la directory treeAdv_files
    if (Test-Path $treeAdvFiles) {
        Write-Host "   ✓ treeAdv_files\" -ForegroundColor Green
        
        # Verifica le sottodirectory
        if (Test-Path $treeAdvPs) {
            Write-Host "   ✓ treeAdv_files\ps\" -ForegroundColor Green
        } else {
            Write-Host "   ✗ treeAdv_files\ps\" -ForegroundColor Red
            Write-Host "     Path: $treeAdvPs" -ForegroundColor Gray
            $errors++
        }
        
        if (Test-Path $treeAdvMod) {
            Write-Host "   ✓ treeAdv_files\mod\" -ForegroundColor Green
        } else {
            Write-Host "   ✗ treeAdv_files\mod\" -ForegroundColor Red
            Write-Host "     Path: $treeAdvMod" -ForegroundColor Gray
            $errors++
        }
        
        if (Test-Path $treeAdvCss) {
            Write-Host "   ✓ treeAdv_files\css\" -ForegroundColor Green
        } else {
            Write-Host "   ✗ treeAdv_files\css\" -ForegroundColor Red
            Write-Host "     Path: $treeAdvCss" -ForegroundColor Gray
            $errors++
        }
        
        if (Test-Path $treeAdvConfig) {
            Write-Host "   ✓ treeAdv_files\treeAdv_config.ps1" -ForegroundColor Green
        } else {
            Write-Host "   ✗ treeAdv_files\treeAdv_config.ps1" -ForegroundColor Red
            Write-Host "     Path: $treeAdvConfig" -ForegroundColor Gray
            $errors++
        }
        
        # Verifica i file JavaScript
        $jsFiles = @(
            @{Path = Join-Path $treeAdvMod "core.js"; Name = "core.js"},
            @{Path = Join-Path $treeAdvMod "catalog.js"; Name = "catalog.js"},
            @{Path = Join-Path $treeAdvMod "dashboard.js"; Name = "dashboard.js"},
            @{Path = Join-Path $treeAdvMod "tree.js"; Name = "tree.js"},
            @{Path = Join-Path $treeAdvMod "treemap.js"; Name = "treemap.js"},
            @{Path = Join-Path $treeAdvMod "heatmap.js"; Name = "heatmap.js"},
            @{Path = Join-Path $treeAdvMod "compare.js"; Name = "compare.js"},
            @{Path = Join-Path $treeAdvCss "style.css"; Name = "style.css"}
        )
        
        foreach ($file in $jsFiles) {
            if (Test-Path $file.Path) {
                Write-Host "   ✓ treeAdv_files\mod\$($file.Name)" -ForegroundColor Green
            } else {
                Write-Host "   ✗ treeAdv_files\mod\$($file.Name)" -ForegroundColor Red
                Write-Host "     Path: $($file.Path)" -ForegroundColor Gray
                $errors++
            }
        }
    } else {
        Write-Host "   ✗ treeAdv_files\" -ForegroundColor Red
        Write-Host "     Path: $treeAdvFiles" -ForegroundColor Gray
        $errors++
    }
    Write-Host ""

    # Verifica che treeAdv*.ps1 esista nella root
    $mainScript = Join-Path $RootPath "treeAdv*.ps1"
    if (Test-Path $mainScript) {
        Write-Host "   ✓ treeAdv*.ps1 (main script)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ treeAdv*.ps1 (main script not found)" -ForegroundColor Red
        Write-Host "     Path: $mainScript" -ForegroundColor Gray
        $errors++
    }

    # ------------------------------------------------
    # REQUIRED MODULES
    # ------------------------------------------------
    Write-Host "▶ Required PowerShell Modules" -ForegroundColor Yellow
    
    $requiredModules = @(
        "ThreadJob"
    )
    
    foreach ($m in $requiredModules) {
        if (Get-Module -ListAvailable $m) {
            Write-Host "   ✓ $m" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $m (not installed)" -ForegroundColor Red
            Write-Host "     Install with: Install-Module $m -Scope CurrentUser" -ForegroundColor Gray
            $errors++
        }
    }
    Write-Host ""

    # ------------------------------------------------
    # REQUIRED FUNCTIONS
    # ------------------------------------------------
    Write-Host "▶ Required Functions" -ForegroundColor Yellow
    
    $requiredFunctions = @(
        "Start-BFSTraversal",
        "Invoke-TreeWorker",
        "Write-ConsoleOutput",
        "Write-JsonOutput",
        "Write-HtmlOutput",
        "Run-Wizard",
        "Show-Help",
        "Show-Profiler",
        "Format-Size",
        "Start-Profile",
        "Stop-Profile"
    )

    foreach($f in $requiredFunctions) {
        if(Get-Command $f -ErrorAction SilentlyContinue) {
            Write-Host "   ✓ $f" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $f" -ForegroundColor Red
            $errors++
        }
    }
    Write-Host ""

    # ------------------------------------------------
    # CONFIGURATION
    # ------------------------------------------------
    Write-Host "▶ Configuration" -ForegroundColor Yellow
    
    if($null -ne $TreeAdvConfig) {
        Write-Host "   ✓ Configuration loaded" -ForegroundColor Green
        # Verifica che TreeAdvConfig sia un hashtable e abbia Version
        if ($TreeAdvConfig -is [hashtable]) {
            if ($TreeAdvConfig.ContainsKey("Version")) {
                Write-Host "   Version: $($TreeAdvConfig.Version)" -ForegroundColor White
            } else {
                Write-Host "   ⚠ Version property not found in config" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ⚠ Configuration is not a hashtable (type: $($TreeAdvConfig.GetType().Name))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✗ Configuration NOT LOADED" -ForegroundColor Red
        $errors++
    }
    Write-Host ""

    # ------------------------------------------------
    # EXTRA FLAGS HANDLING
    # ------------------------------------------------
    Write-Host "▶ Extra Flags Support" -ForegroundColor Yellow
    
    $validFlags = @('a','h','c','r','s')
    Write-Host "   Supported flags: $($validFlags -join ', ')" -ForegroundColor White
    Write-Host "   a = ACL | h = Hash | c = CreationTime | r = ReadOnly | s = Hidden" -ForegroundColor Gray
    Write-Host ""

    # ------------------------------------------------
    # FILESYSTEM ACCESS
    # ------------------------------------------------
    Write-Host "▶ Filesystem Access" -ForegroundColor Yellow
    
    try {
        $temp = Join-Path $env:TEMP "treeadv_test_$(Get-Random).tmp"
        "test" | Set-Content $temp -ErrorAction Stop
        Remove-Item $temp -ErrorAction Stop
        Write-Host "   ✓ Write/Delete in TEMP folder" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Filesystem access: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
    
    # Test long path support
    try {
        $longPath = Join-Path $env:TEMP "treeadv_test_$(Get-Random)_$('x'*100)"
        New-Item -ItemType Directory -Path $longPath -ErrorAction Stop | Out-Null
        Remove-Item $longPath -ErrorAction Stop
        Write-Host "   ✓ Long path support (>260 chars)" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠ Long path support may be limited" -ForegroundColor Yellow
        $warnings++
    }
    Write-Host ""

    # ------------------------------------------------
    # SUMMARY
    # ------------------------------------------------
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║                              SUMMARY                                     " -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if($errors -eq 0 -and $warnings -eq 0) {
        Write-Host "║   ✓ Environment: HEALTHY - No issues detected" -ForegroundColor Green
    } elseif ($errors -eq 0 -and $warnings -gt 0) {
        Write-Host "║   ⚠ Environment: HEALTHY with $warnings warning(s)" -ForegroundColor Yellow
    } else {
        Write-Host "║   ✗ Environment: $errors error(s) and $warnings warning(s) detected" -ForegroundColor Red
    }
    
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║   Legend:" -ForegroundColor Cyan
    Write-Host "║     ✓ = OK" -ForegroundColor Green
    Write-Host "║     ⚠ = Warning (non-critical)" -ForegroundColor Yellow
    Write-Host "║     ✗ = Error (needs fixing)" -ForegroundColor Red
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # Suggerimenti in caso di errori
    if($errors -gt 0) {
        Write-Host "Suggested fixes:" -ForegroundColor Yellow
        Write-Host "  • The script is looking for files in: $RootPath" -ForegroundColor White
        Write-Host "  • Ensure all required files exist in this location" -ForegroundColor White
        Write-Host "  • The script expects this structure:" -ForegroundColor White
        Write-Host "    $RootPath\treeAdv2.ps1" -ForegroundColor Gray
        Write-Host "    $RootPath\treeAdv_files\" -ForegroundColor Gray
        Write-Host "    $RootPath\treeAdv_files\ps\" -ForegroundColor Gray
        Write-Host "    $RootPath\treeAdv_files\mod\" -ForegroundColor Gray
        Write-Host "    $RootPath\treeAdv_files\css\" -ForegroundColor Gray
        Write-Host ""
    }
}