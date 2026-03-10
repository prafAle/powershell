<#
.FILENAME
    02_profiler.ps1

.SYNOPSIS
    Performance profiling utilities for TreeAdv

.DESCRIPTION
    Provides functions to measure and track execution time of different operations.
    Profiling data is stored in a global hashtable and can be displayed at the end.
#>

# Inizializza il profiler
$script:Profiler = @{}
$script:ProfileTimers = @{}

function Start-Profile {
    <#
    .SYNOPSIS
        Starts a profiling timer for a named operation
    .PARAMETER Name
        Name of the operation to profile
    #>
    param([string]$Name)
    if (-not $TreeAdvConfig.Profiler.Enable) { return }
    $script:ProfileTimers[$Name] = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Debug "Profiler started: $Name"
}

function Stop-Profile {
    <#
    .SYNOPSIS
        Stops a profiling timer and records the elapsed time
    .PARAMETER Name
        Name of the operation to stop profiling
    #>
    param([string]$Name)
    if (-not $TreeAdvConfig.Profiler.Enable) { return }
    if ($script:ProfileTimers.ContainsKey($Name)) {
        $timer = $script:ProfileTimers[$Name]
        $timer.Stop()
        $script:Profiler[$Name] = @{
            Duration = $timer.Elapsed
            Timestamp = Get-Date
        }
        Write-Debug "Profiler stopped: $Name - $($timer.Elapsed.ToString('hh\:mm\:ss\.fffffff'))"
        $script:ProfileTimers.Remove($Name)
    }
}

function Get-ProfileTime {
    <#
    .SYNOPSIS
        Gets the recorded time for a profiled operation
    .PARAMETER Name
        Name of the operation to get time for
    .RETURNS
        TimeSpan object or empty string if not found
    #>
    param([string]$Name)
    if ($script:Profiler.ContainsKey($Name)) {
        $duration = $script:Profiler[$Name].Duration
        # Return formatted string for display
        return $duration.ToString('hh\:mm\:ss\.fffffff')
    }
    return ""
}

function Show-Profiler {
    <#
    .SYNOPSIS
        Displays all profiled operations with their durations
    #>
    if (-not $TreeAdvConfig.Profiler.Enable) { return }
    Write-Host ""
    Write-Host "Profiler Results" -ForegroundColor Cyan
    Write-Host "----------------" -ForegroundColor Cyan
    $script:Profiler.GetEnumerator() |
    Sort-Object { $_.Value.Duration } -Descending |
    ForEach-Object {
        $duration = $_.Value.Duration
        Write-Host "$($_.Key) $($duration.ToString('hh\:mm\:ss\.fffffff'))"
    }
}

# Esporta le funzioni (disponibili automaticamente tramite dot-sourcing)