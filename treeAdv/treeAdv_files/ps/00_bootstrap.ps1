<#
.FILENAME
    00_bootstrap.ps1

.SYNOPSIS
    TreeAdv advanced bootstrap loader

.DESCRIPTION
    Loads configuration and script modules with diagnostics,
    dependency resolution and performance profiling.
    Shows minimal output in normal mode, verbose in debug mode.
    Debug output can be controlled globally or per-module via config.
#>

$script:BootstrapTimer = [System.Diagnostics.Stopwatch]::StartNew()

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:TreeAdvRoot = Split-Path $ScriptRoot -Parent

$configFile = Join-Path $script:TreeAdvRoot "\treeAdv_config.ps1"
$modulePath = $ScriptRoot

# Carica la configurazione PRIMA di qualsiasi altra cosa
if (!(Test-Path $configFile)) {
    throw "Configuration file not found: $configFile"
}

. $configFile

# ============================================================
# DEBUG CONFIGURATION
# ============================================================
# Il parametro -debugmode da riga di comando sovrascrive la configurazione
if ($DebugMode) {
    $TreeAdvConfig.Debug.Enable = $true
    Write-Host "Debug mode enabled via command line" -ForegroundColor Yellow
}

# Applica le impostazioni di debug
if ($TreeAdvConfig.Debug.Enable) {
    $DebugPreference = "Continue"
    
    # Solo in debug mostriamo l'header
    Write-Host ""
    Write-Host "treeAdv bootstrap starting..." -ForegroundColor Cyan
    Write-Host "Debug modules enabled:"
    $TreeAdvConfig.Debug.Modules.Keys | ForEach-Object {
        if ($TreeAdvConfig.Debug.Modules[$_]) {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    }
} else {
    $DebugPreference = "SilentlyContinue"
}

#------------------------------------------------
# MODULE DISCOVERY
#------------------------------------------------

$scriptFiles = Get-ChildItem $modulePath -Filter *.ps1 |
    Where-Object { $_.Name -ne "00_bootstrap.ps1" } |
    Sort-Object Name

#------------------------------------------------
# PARALLEL LOAD
#------------------------------------------------

$loadTimes = @()

foreach ($script in $scriptFiles) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        . $script.FullName
        $sw.Stop()
        $loadTimes += [pscustomobject]@{
            Module = $script.Name
            TimeMs = $sw.ElapsedMilliseconds
        }
    }
    catch {
        Write-Host "FAILED loading $($script.Name)" -ForegroundColor Red
        throw
    }
}

# Solo un messaggio di successo compatto
Write-Host "All modules loaded successfully" -ForegroundColor Green

# In debug mostriamo i dettagli
if ($TreeAdvConfig.Debug.Enable) {
    $functions = Get-Command -CommandType Function | Where-Object {$_.Source -eq ""}
    Write-Host ""
    Write-Host " - Loaded functions: $($functions.Count)"
    
    # Duplicate check solo in debug
    $duplicates = $functions | Group-Object Name | Where-Object {$_.Count -gt 1}
    if ($duplicates) {
        Write-Host ""
        Write-Host "Duplicate functions detected:" -ForegroundColor Yellow
        foreach ($d in $duplicates) {
            Write-Host " - $($d.Name)"
        }
    }
    
    # Dependency check solo in debug
    Write-Host ""
    Write-Host "Checking dependencies..."
    $requiredModules = @("ThreadJob")
    foreach ($m in $requiredModules) {
        if (Get-Module -ListAvailable $m) {
            Write-Host " - OK $m"
        }
        else {
            Write-Host " - MISSING $m" -ForegroundColor Red
        }
    }
    
    # Module load times solo in debug
    Write-Host ""
    Write-Host "Module load times:"
    $loadTimes | Sort TimeMs -Descending | Format-Table
}

$script:BootstrapTimer.Stop()

# Solo in debug mostriamo il tempo totale
if ($TreeAdvConfig.Debug.Enable) {
    Write-Host ""
    Write-Host "Bootstrap completed in $($script:BootstrapTimer.ElapsedMilliseconds) ms"
    Write-Host ""
}