<#
.FILENAME
    01_logging.ps1

.SYNOPSIS
    Logging and profiling utilities for TreeAdv

.DESCRIPTION
    Provides debug logging, worker tracing, timing output,
    and lightweight profiling capabilities for TreeAdv.

.PARAMETER None

.NOTES
    Logging behavior controlled by TreeAdvConfig.Debug flags
#>

$script:ProfilerData = @{}

function Log-Debug($msg){
    if($TreeAdvConfig.Debug.Enable){
        Write-Host "[DEBUG] $msg" -ForegroundColor DarkGray
    }
}

function Log-Worker($msg){
    if($TreeAdvConfig.Debug.WorkerTracing){
        Write-Host "[WORKER] $msg" -ForegroundColor Yellow
    }
}

function Log-Time($msg){
    if($TreeAdvConfig.Debug.Timing){
        Write-Host "[TIME] $msg" -ForegroundColor Cyan
    }
}

function Start-Profile($name){
    if(-not $TreeAdvConfig.Profiler.Enable){ return }
    $script:ProfilerData[$name] = @{
        Start = Get-Date
    }
}

function Stop-Profile($name){
    if(-not $TreeAdvConfig.Profiler.Enable){ return }
    $end = Get-Date
    $script:ProfilerData[$name].Duration = ($end - $script:ProfilerData[$name].Start)
}

function Show-Profiler{
    if(-not $TreeAdvConfig.Profiler.Enable){ return }
    Write-Host ""
    Write-Host "==== PROFILER ====" -ForegroundColor Cyan
    $script:ProfilerData.GetEnumerator() |
    Sort-Object {$_.Value.Duration} -Descending |
    Select-Object -First $TreeAdvConfig.Profiler.ReportTop |
    ForEach-Object {
        Write-Host "$($_.Key)  $($_.Value.Duration)"
    }
}