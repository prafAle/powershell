<#
===============================================================================
 GSCT.ps1  -  Generate Script Content Tree
===============================================================================

 DESCRIPTION
   Produces a content-tree report for a given directory, supporting:
     1) Default: writes report into the analyzed directory
     2) Custom log file: /log:{file}
     3) Console-only:   /consoleonly (no file created)

 FIXES / IMPROVEMENTS
   - Excludes the output report file from the scan (no self-appending).
   - Captures the directory tree BEFORE creating the report (so it won't appear).
   - Trims localized header lines from `tree` and drops one extra line at start.
   - Enumerates files INCLUDING OneDrive placeholders (removed ReparsePoint filter).
   - Clear messages when file content can't be read (placeholder, access, binary).
   - Header includes "Files found".
   - Progress bar shows writing progress {written}/{total}.
   - File markers show relative path + progressive counter (000).
===============================================================================
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [Alias('Path')]
    [string]$PathInput,

    [string]$Log,

    [switch]$ConsoleOnly,

    # support extra raw args like /consoleonly and /log: passed with '/'
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Remaining
)

# Normalize slash-style options in $Remaining
if ($Remaining) {
    foreach ($arg in $Remaining) {
        if ($arg -match '^/consoleonly$') { $ConsoleOnly = $true }
        elseif ($arg -match '^/log:(.+)') { $Log = $Matches[1] }
    }
}
if ($Log -match '^/log:(.+)') { $Log = $Matches[1] }

# Validate input path
try {
    $FullPath = (Resolve-Path $PathInput).Path
    # Normalize base path for relative path computation
    $BasePath = $FullPath.TrimEnd('\')
}
catch {
    Write-Host "ERROR: Path does not exist:" -ForegroundColor Red
    Write-Host $PathInput
    exit 1
}

# Determine output mode + destination
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
if ($ConsoleOnly) {
    $OutputMode = "Console"; $OutputFile = $null
}
elseif ($Log) {
    $OutputMode = "File"; $OutputFile = $Log
}
else {
    $OutputMode = "File"; $OutputFile = Join-Path $FullPath "GSCT_output_$Timestamp.txt"
}

# Capture TREE BEFORE creating the output file
$TreeRaw = cmd /c "tree `"$FullPath`" /f /a"

# Trim tree headers and drop one extra line after the first body line
$treeLines = $TreeRaw -split '`r?`n'
$firstBodyIdx = $null
for ($i = 0; $i -lt $treeLines.Count; $i++) {
    $ln = $treeLines[$i]
    if ($ln -match '^[\|\\]' -or $ln -match '^[A-Za-z]:\\') {
        $firstBodyIdx = $i; break
    }
}
if ($null -eq $firstBodyIdx) { 
    $startIdx = 0 
} else { 
    $startIdx = [Math]::Min($firstBodyIdx + 1, $treeLines.Count - 1) 
}
$treeBody = if ($startIdx -lt $treeLines.Count) { $treeLines[$startIdx..($treeLines.Count-1)] } else { @() }

# Helper: write to console or file
function Write-Out {
    param([string]$Text)
    if ($ConsoleOnly) { Write-Host $Text }
    else { Add-Content -Path $OutputFile -Value $Text -Encoding UTF8 }
}

# Robust text extraction: read bytes, try UTF-8 → Windows-1252 → ASCII
function Get-TextContent {
    param([string]$FilePath)

    try {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)

        try { return [System.Text.Encoding]::UTF8.GetString($bytes) } catch {}
        try {
            $enc1252 = [System.Text.Encoding]::GetEncoding(1252)
            return $enc1252.GetString($bytes)
        } catch {}
        try { return [System.Text.Encoding]::ASCII.GetString($bytes) } catch {}

        return $null
    }
    catch {
        return $null
    }
}

# FILE ENUMERATION (before header so we can print "Files found")
#  - Include OneDrive placeholders (no ReparsePoint exclusion)
#  - Exclude the current report file (if in file mode; though not yet created)
$filesQuery = Get-ChildItem -Path $FullPath -Recurse -File -ErrorAction SilentlyContinue
if ($OutputMode -eq "File" -and $OutputFile) {
    $Files = $filesQuery | Where-Object { $_.FullName -ne $OutputFile }
} else {
    $Files = $filesQuery
}
$TotalFiles = ($Files | Measure-Object | Select-Object -ExpandProperty Count)

# Prepare output file AFTER building tree (if file mode)
if ($OutputMode -eq "File") {
    New-Item -Path $OutputFile -ItemType File -Force | Out-Null
    try { $OutputFile = (Resolve-Path $OutputFile).Path } catch {}
}

# HEADER
Write-Out "GSCT - Generated Script Content Tree"
Write-Out "Analyzed path : $FullPath"
Write-Out "Start time    : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Out "Files found   : $TotalFiles"
if ($ConsoleOnly) { Write-Out "Mode          : Console only" } else { Write-Out "Output file   : $OutputFile" }
Write-Out "-------------------------------------------------------------------"
Write-Out ""

# DIRECTORY TREE (trimmed)
Write-Out "----- DIRECTORY TREE /f /a -----"
$treeBody | ForEach-Object { Write-Out $_ }
Write-Out ""
Write-Out "----- FILE CONTENTS -----"
Write-Out ""

# Progressive counter for file blocks (000, 001, 002, ...)
$Counter = 0

# Initialize progress bar
$Processed = 0
if ($TotalFiles -gt 0) {
    Write-Progress -Id 1 -Activity "Writing file contents" -Status "0/$TotalFiles" -PercentComplete 0
}

# FILE CONTENTS
foreach ($File in $Files) {
    $FullFilePath = $File.FullName

    # --- compute relative path (subtracting the base path) ---
    $RelPath = $FullFilePath
    if ($RelPath.StartsWith($BasePath, [System.StringComparison]::OrdinalIgnoreCase)) {
        $RelPath = $RelPath.Substring($BasePath.Length)
    }
    if (-not $RelPath.StartsWith("\")) {
        $RelPath = "\" + $RelPath
    }

    # --- progressive tag like 001, 002, ... ---
    $Counter++
    $Tag = '{0:000}' -f $Counter

    # --- OPEN marker ---
    Write-Out "$Tag----------start content $RelPath ---------------------"

    # Read content with robust decoding
    $text = Get-TextContent -FilePath $FullFilePath

    if ($null -ne $text -and $text.Length -gt 0) {
        ($text -split '`r?`n', -1) | ForEach-Object { Write-Out $_ }
    } else {
        # OneDrive placeholder / offline hints
        $isReparse  = ($File.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
        $isOffline  = ($File.Attributes -band [IO.FileAttributes]::Offline) -ne 0
        if ($isReparse -or $isOffline) {
            Write-Out "[WARNING] File appears to be a OneDrive placeholder. Mark as 'Always keep on this device' or run: attrib +P `"$FullFilePath`""
        } else {
            Write-Out "[ERROR] Unable to read file as text (possibly binary or access denied)."
        }
    }

    # --- CLOSE marker ---
    Write-Out "$Tag----------end content $RelPath ---------------------"
    Write-Out ""

    # Update progress bar
    $Processed++
    if ($TotalFiles -gt 0) {
        $percent = [Math]::Floor(($Processed / [double]$TotalFiles) * 100)
        Write-Progress -Id 1 -Activity "Writing file contents" -Status "$Processed/$TotalFiles" -PercentComplete $percent
    }
}

# Complete progress bar
Write-Progress -Id 1 -Activity "Writing file contents" -Completed

# END
if ($ConsoleOnly) {
    Write-Host "Processing completed. (console output only)" -ForegroundColor Green
} else {
    Write-Host "Processing completed." -ForegroundColor Green
    Write-Host "Generated file: $OutputFile"
}