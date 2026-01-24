# Convert-MSGtoEML.ps1
# Optimization Tool by prafAle

# --- ADMIN PRIVILEGES CHECK ---
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Restarting as Administrator..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# --- DEPENDENCY CHECK: Microsoft Outlook ---
$outlookReg = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\outlook.exe" -ErrorAction SilentlyContinue
if ($null -eq $outlookReg) {
    Write-Host "Error: Microsoft Outlook is not installed. This tool requires Outlook to handle COM objects." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# --- CONVERSION FUNCTION ---
function Convert-MSGtoEML {
    param(
        [string]$MsgFilePath,
        [string]$EmlFilePath
    )
    
    try {
        # Load Outlook Interop Assembly
        Add-Type -AssemblyName "Microsoft.Office.Interop.Outlook" -ErrorAction Stop
        
        $outlook = New-Object -ComObject Outlook.Application
        $namespace = $outlook.GetNameSpace("MAPI")
        
        # Open .msg file
        $msg = $outlook.CreateItemFromTemplate($MsgFilePath)
        
        # Save as .eml (olEML format = 5)
        $msg.SaveAs($EmlFilePath, 5)
        
        # Release COM Objects to prevent memory leaks
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($msg) | Out-Null
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($namespace) | Out-Null
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($outlook) | Out-Null
        
        return $true
    }
    catch {
        Write-Error "Conversion failed for $MsgFilePath : $($_.Exception.Message)"
        return $false
    }
    finally {
        # Force garbage collection to free up system resources
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
    }
}

# --- MAIN SCRIPT ---
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$monkeyJobPath = Join-Path $scriptPath "monkeyjob"

# Create monkeyjob directory if missing
if (!(Test-Path $monkeyJobPath)) {
    New-Item -ItemType Directory -Path $monkeyJobPath -Force | Out-Null
    Write-Host "[v] Monkeyjob folder created: $monkeyJobPath" -ForegroundColor Green
}

# Setup output folders for this session
$emlFolder = Join-Path $monkeyJobPath "$timestamp-eml"
$msgFolder = Join-Path $monkeyJobPath "$timestamp-msg"

New-Item -ItemType Directory -Path $emlFolder -Force | Out-Null
New-Item -ItemType Directory -Path $msgFolder -Force | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       MSG TO EML CONVERTER             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Timestamp:  $timestamp" -ForegroundColor Yellow
Write-Host "EML Output: $emlFolder" -ForegroundColor Yellow
Write-Host "MSG Backup: $msgFolder" -ForegroundColor Yellow
Write-Host ""

# Find all .msg files in the script directory
$msgFiles = Get-ChildItem -Path $scriptPath -Filter "*.msg"

if ($msgFiles.Count -eq 0) {
    Write-Host "(i) No .msg files found in: $scriptPath" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "Found $($msgFiles.Count) .msg files to convert" -ForegroundColor Green
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($msgFile in $msgFiles) {
    $emlFileName = [System.IO.Path]::ChangeExtension($msgFile.Name, "eml")
    $emlFilePath = Join-Path $emlFolder $emlFileName
    $msgDestPath = Join-Path $msgFolder $msgFile.Name
    
    Write-Host "Processing: $($msgFile.Name) -> $emlFileName" -NoNewline
    
    # Run Conversion
    if (Convert-MSGtoEML -MsgFilePath $msgFile.FullName -EmlFilePath $emlFilePath) {
        # Move original .msg file to backup folder
        Move-Item -Path $msgFile.FullName -Destination $msgDestPath -Force
        
        Write-Host " [OK]" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " [FAILED]" -ForegroundColor Red
        $errorCount++
    }
}

# Final Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           FINAL SUMMARY                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Processed files: $($msgFiles.Count)" -ForegroundColor White
Write-Host "Successful:      $successCount" -ForegroundColor Green
Write-Host "Failed:          $errorCount"   -ForegroundColor Red
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "[v] ALL CONVERSIONS COMPLETED SUCCESSFULLY" -ForegroundColor Green
} else {
    Write-Host "[!] SOME ERRORS OCCURRED DURING PROCESS" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
