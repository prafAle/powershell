# Convert-MSGtoEML.ps1
# Part of the prafAle Optimization Suite

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
    Write-Host "Error: Microsoft Outlook is not installed. This tool requires Outlook COM objects." -ForegroundColor Red
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
        # Garbage collection for system stability
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
    }
}

# --- MAIN PROCESS ---
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$monkeyJobPath = Join-Path $scriptPath "monkeyjob"

if (!(Test-Path $monkeyJobPath)) {
    New-Item -ItemType Directory -Path $monkeyJobPath -Force | Out-Null
    Write-Host "[v] Folder 'monkeyjob' created." -ForegroundColor Green
}

$emlFolder = Join-Path $monkeyJobPath "$timestamp-eml"
$msgFolder = Join-Path $monkeyJobPath "$timestamp-msg"

New-Item -ItemType Directory -Path $emlFolder -Force | Out-Null
New-Item -ItemType Directory -Path $msgFolder -Force | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       MSG TO EML CONVERTER             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Timestamp:  $timestamp" -ForegroundColor Yellow
Write-Host ""

$msgFiles = Get-ChildItem -Path $scriptPath -Filter "*.msg"

if ($msgFiles.Count -eq 0) {
    Write-Host "(i) No .msg files found in script directory." -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "Found $($msgFiles.Count) files to process..." -ForegroundColor Green

$successCount = 0
$errorCount = 0

foreach ($msgFile in $msgFiles) {
    $emlFileName = [System.IO.Path]::ChangeExtension($msgFile.Name, "eml")
    $emlFilePath = Join-Path $emlFolder $emlFileName
    $msgDestPath = Join-Path $msgFolder $msgFile.Name
    
    Write-Host "Converting: $($msgFile.Name) " -NoNewline
    
    if (Convert-MSGtoEML -MsgFilePath $msgFile.FullName -EmlFilePath $emlFilePath) {
        Move-Item -Path $msgFile.FullName -Destination $msgDestPath -Force
        Write-Host "[OK]" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "[FAILED]" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           FINAL SUMMARY                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total processed: $($msgFiles.Count)"
Write-Host "Successful:      $successCount" -ForegroundColor Green
Write-Host "Failed:          $errorCount"   -ForegroundColor Red
Write-Host "`nResults stored in: $monkeyJobPath" -ForegroundColor Yellow
Write-Host "`nPress any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
