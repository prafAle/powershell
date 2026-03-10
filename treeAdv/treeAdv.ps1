<#
.FILENAME
    treeAdv.ps1

.SYNOPSIS
    Advanced multi-threaded directory tree analyzer with BFS traversal
#>

param(
    [string]$Path,
    [string]$Output,
    [string]$Format = "Auto",
    [int]$MaxDepth = 20,
    [int]$MaxDegreeOfParallelism = 8,
    [string]$Extra,
    [string]$HashAlgorithm,
    [switch]$Wizard,
    [switch]$Help,
    [switch]$DebugMode,
    [switch]$SelfTest
)

# Imposta debug preference PRIMA di qualsiasi altra cosa
if ($DebugMode) {
    $DebugPreference = "Continue"
    Write-Host "Debug mode enabled" -ForegroundColor Yellow
} else {
    $DebugPreference = "SilentlyContinue"
}

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# ============================================
# GESTIONE HELP - Deve essere la prima cosa
# ============================================
if($Help){
    # Help è semplice, non richiede bootstrap
    Write-Host ""
    Write-Host "TreeAdv Help" -ForegroundColor Cyan
    Write-Host "=============" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: treeAdv2.ps1 -Path <folder> [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Path <path>           Root directory to scan"
    Write-Host "  -Output <file>         Output file path"
    Write-Host "  -Format <format>       Output format: Auto, Console, Json, Html"
    Write-Host "  -MaxDepth <n>          Maximum depth to traverse (default: 20)"
    Write-Host "  -MaxDegreeOfParallelism <n>  Number of parallel workers (default: 8)"
    Write-Host "  -Extra <flags>         Extra attributes: a=ACL, h=Hash, c=CreationTime, r=ReadOnly, s=Hidden"
    Write-Host "  -HashAlgorithm <algo>  Hash algorithm: SHA256, SHA1, MD5"
    Write-Host "  -Wizard                Interactive mode"
    Write-Host "  -Help                  Show this help"
    Write-Host "  -DebugMode             Enable debug output"
    Write-Host "  -SelfTest              Run diagnostics"
    Write-Host ""
    return
}

# ============================================
# GESTIONE SELFTEST
# ============================================
if($SelfTest){
    Write-Host "treeAdv starting..." -ForegroundColor Yellow
    
    # Salva il percorso originale PRIMA di qualsiasi modifica
    $OriginalScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    Write-Host "Original script root: $OriginalScriptRoot" -ForegroundColor Gray
    
    # Path per il bootstrap
    $bootstrapPath = Join-Path $OriginalScriptRoot "treeAdv_files\ps\00_bootstrap.ps1"
    Write-Host "Loading bootstrap from: $bootstrapPath" -ForegroundColor Gray
    
    if (Test-Path $bootstrapPath) {
        # Carica il bootstrap completo
        . $bootstrapPath
        
        # Path per il selftest - USA IL PERCORSO ORIGINALE, non quello modificato dal bootstrap
        $selftestPath = Join-Path $OriginalScriptRoot "treeAdv_files\ps\90_selftest.ps1"
        Write-Host "Loading selftest from: $selftestPath" -ForegroundColor Gray
        
        if (Test-Path $selftestPath) {
            . $selftestPath
            if (Get-Command Invoke-TreeAdvSelfTest -ErrorAction SilentlyContinue) {
                Invoke-TreeAdvSelfTest -RootPath $OriginalScriptRoot
            } else {
                Write-Host "ERROR: Invoke-TreeAdvSelfTest function not loaded!" -ForegroundColor Red
            }
        } else {
            Write-Host "ERROR: Self-test file not found at:" -ForegroundColor Red
            Write-Host $selftestPath -ForegroundColor Gray
            Write-Host ""
            Write-Host "Expected location: $OriginalScriptRoot\treeAdv_files\ps\90_selftest.ps1" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ERROR: Bootstrap not found at:" -ForegroundColor Red
        Write-Host $bootstrapPath -ForegroundColor Gray
    }
    return
}

# ============================================
# BOOTSTRAP - Per il funzionamento normale
# ============================================
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Bootstrap = Join-Path $ScriptRoot "treeAdv_files\ps\00_bootstrap.ps1"

# Solo un messaggio di avvio minimo
Write-Host "treeAdv starting..." -ForegroundColor Yellow

if (-not (Test-Path $Bootstrap)) {
    Write-Host ""
    Write-Host "FATAL: Bootstrap not found" -ForegroundColor Red
    Write-Host "Expected path:"
    Write-Host $Bootstrap
    exit 1
}

. $Bootstrap

# ============================================
# WIZARD
# ============================================
if($Wizard){
    $wiz = Run-Wizard
    if (-not $wiz) { return }
    $Path = $wiz.Path
    $Output = $wiz.Output
    $MaxDepth = $wiz.MaxDepth
    $MaxDegreeOfParallelism = $wiz.MaxDegreeOfParallelism
    $Extra = $wiz.Extra
    if ($wiz.HashAlgorithm) { $HashAlgorithm = $wiz.HashAlgorithm }
}

# ============================================
# VALIDAZIONE PATH
# ============================================
if ([string]::IsNullOrWhiteSpace($Path)) {
    Write-Host ""
    Write-Host "ERROR: Path is required. Use -Help for usage or -Wizard for interactive mode." -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ============================================
# ESECUZIONE PRINCIPALE
# ============================================
# Prepara i flags extra
$flags = @{
    acl = $Extra -like "*a*"
    hash = $Extra -like "*h*"
    ctime = $Extra -like "*c*"
    readonly = $Extra -like "*r*"
    hidden = $Extra -like "*s*"
}

$data = Start-BFSTraversal `
    -Root $Path `
    -MaxDepth $MaxDepth `
    -Parallelism $MaxDegreeOfParallelism `
    -ExtraFlags $flags `
    -HashAlgorithm $HashAlgorithm

# ============================================
# OUTPUT
# ============================================
# Determina il formato effettivo
$actualFormat = Resolve-OutputFormat -Format $Format -OutputPath $Output

Write-Debug "Formato richiesto: $Format, Formato effettivo: $actualFormat, Output: $Output"

switch($actualFormat){
    "Json" { 
        Write-Debug "Generating JSON output..."
        Write-JsonOutput -Data $data -OutputPath $Output
    }
    "Html" { 
        Write-Debug "Generating HTML output..."
        Write-HtmlOutput -Data $data -OutputPath $Output
    }
    "Text" { 
        Write-Debug "Generating Text output..."
        Write-ConsoleOutput -Tree $data.tree -OutputPath $Output
    }
    default { 
        Write-Debug "Generating Console output..."
        Write-ConsoleOutput -Tree $data.tree
    }
}

# Profiler
if ($TreeAdvConfig.Profiler.Enable) {
    Write-Host ""
    Write-Host "Profiler Results" -ForegroundColor Cyan
    Write-Host "----------------" -ForegroundColor Cyan
    
    $script:Profiler.GetEnumerator() |
    Sort-Object {$_.Value.Duration} -Descending |
    ForEach-Object {
        Write-Host "$($_.Key) $($_.Value.Duration)"
    }

}
