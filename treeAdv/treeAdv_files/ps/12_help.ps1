<#
.FILENAME
    12_help.ps1

.SYNOPSIS
    Help system for TreeAdv

.DESCRIPTION
    Displays formatted help information with usage examples and parameter descriptions.
    Called when the -Help switch is used.
#>

function Show-Help {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║                                 TREEADV - HELP / MANUAL                                              " -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║  PURPOSE:" -ForegroundColor Yellow
    Write-Host "║    Fast multi-threaded directory tree generator (BFS) with OneDrive support." -ForegroundColor White
    Write-Host "║    Analyzes directory structures and exports to console, text, JSON or HTML format." -ForegroundColor White
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║  USAGE:" -ForegroundColor Yellow
    Write-Host "║    .\treeAdv.ps1 -Path <folder> [-Output <file>] [-Format Auto|Console|Text|Json|Html]" -ForegroundColor White
    Write-Host "║                    [-MaxDepth <int>] [-MaxDegreeOfParallelism <int>]" -ForegroundColor White
    Write-Host "║                    [-Extra a,h,c,r,s] [-HashAlgorithm SHA256|SHA1|MD5]" -ForegroundColor White
    Write-Host "║                    [-Wizard] [-Help] [-DebugMode] [-SelfTest]" -ForegroundColor White
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║  PARAMETERS:" -ForegroundColor Yellow
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -Path" -ForegroundColor Green
    Write-Host "║        Root directory path to analyze (mandatory unless using -Wizard)" -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -Output" -ForegroundColor Green
    Write-Host "║        Output file path (optional). If omitted, output goes to Console." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -Format" -ForegroundColor Green
    Write-Host "║        Output format: Auto (default), Console, Text, Json, Html" -ForegroundColor Gray
    Write-Host "║        Auto infers format from -Output extension." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -MaxDepth" -ForegroundColor Green
    Write-Host "║        Maximum traversal depth (default 20). Depth 0=root, 1=children, ..." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -MaxDegreeOfParallelism" -ForegroundColor Green
    Write-Host "║        Number of parallel workers (default 8). Range: 1-128." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -Extra" -ForegroundColor Green
    Write-Host "║        Extra attributes to include (comma-separated flags):" -ForegroundColor Gray
    Write-Host "║          a = ACL (SDDL)" -ForegroundColor Gray
    Write-Host "║          h = Hash (files only)" -ForegroundColor Gray
    Write-Host "║          c = CreationTime" -ForegroundColor Gray
    Write-Host "║          r = ReadOnly flag" -ForegroundColor Gray
    Write-Host "║          s = Hidden flag" -ForegroundColor Gray
    Write-Host "║        Example: -Extra a,h,c" -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -HashAlgorithm" -ForegroundColor Green
    Write-Host "║        Hash algorithm for -Extra h. One of: SHA256 (default), SHA1, MD5." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -Wizard" -ForegroundColor Green
    Write-Host "║        Launches interactive configuration wizard." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -Help" -ForegroundColor Green
    Write-Host "║        Shows this help message." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -DebugMode" -ForegroundColor Green
    Write-Host "║        Enables verbose debug output." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    -SelfTest" -ForegroundColor Green
    Write-Host "║        Runs environment self-test to verify configuration." -ForegroundColor Gray
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║  EXAMPLES:" -ForegroundColor Yellow
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    # Basic scan to console" -ForegroundColor Gray
    Write-Host "║    .\treeAdv.ps1 -Path 'C:\Data'" -ForegroundColor White
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    # Scan with hash calculation, save to JSON" -ForegroundColor Gray
    Write-Host "║    .\treeAdv.ps1 -Path 'C:\Data' -Extra h -HashAlgorithm SHA256 -Output 'scan.json' -Format Json" -ForegroundColor White
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    # Generate HTML report with ACL and timestamps" -ForegroundColor Gray
    Write-Host "║    .\treeAdv.ps1 -Path 'C:\Data' -Extra a,c -Output 'report.html' -Format Html" -ForegroundColor White
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║    # Interactive mode" -ForegroundColor Gray
    Write-Host "║    .\treeAdv.ps1 -Wizard" -ForegroundColor White
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║  NOTES:" -ForegroundColor Yellow
    Write-Host "║    • Always prints a professional Summary before the tree/table/json." -ForegroundColor White
    Write-Host "║    • OneDrive Cloud Files reparse points are traversed; symlinks/junctions are skipped." -ForegroundColor White
    Write-Host "║    • Designed for PowerShell 7.x (Windows)." -ForegroundColor White
    Write-Host "║    • CSV output is not supported - focus on visual tree outputs." -ForegroundColor White
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}