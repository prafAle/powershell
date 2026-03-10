<#
.FILENAME
    treeAdv_config.ps1

.SYNOPSIS
    Main configuration file for TreeAdv v1.0

.DESCRIPTION
    This file contains all configuration settings for TreeAdv:
    - Version information
    - Performance tuning parameters
    - Traversal settings and exclusions
    - Debug and profiling options
    - Output formatting controls
    - Hash algorithm defaults
    - Module-specific debug flags

.NOTES
    This file is dot-sourced by 00_bootstrap.ps1 during startup.
    All settings are stored in the global $TreeAdvConfig hashtable.
#>

# Main configuration hashtable
$TreeAdvConfig = @{
    
    # Script version information
    Version = "1.0.0"
    
    # Performance optimization settings
    Performance = @{
        DefaultParallelism = 12        # Default number of parallel workers
        QueueBatchSize = 64             # Items per queue batch
        MaxItems = 100000000             # Maximum items to process (safety limit)
        WorkerTimeoutSeconds = 30        # Timeout for worker threads
    }
    
    # Directory traversal settings
    Traversal = @{
        DefaultMaxDepth = 20             # Maximum directory depth to traverse
        MaxItems = 250000                 # Maximum items per traversal
        SkipLinks = $true                 # Skip symbolic links and junctions
        # Directories to exclude from traversal (case-sensitive)
        ExcludedNames = @(
            "System Volume Information",
            '$RECYCLE.BIN',               # Note: single quotes to avoid variable expansion
            "RECYCLER",
            "Windows",
            "WinSxS",
            "Temp",
            "tmp",
            "AppData",
            "Application Data"
        )
    }
    
    # ============================================================
    # DEBUG CONFIGURATION - MASTER SWITCH AND MODULE FLAGS
    # ============================================================
    Debug = @{
        # Master debug switch - when $false, overrides all module flags
        # When $true, debug output is controlled by individual module flags
        Enable = $true
        
        # Module-specific debug flags
        # Set to $true to enable debug for specific modules
        # These are only effective when Master.Enable = $true
        Modules = @{
            # PowerShell engine module
            Worker            = $false  # 06_worker.ps1 - external worker
            BFSWorker         = $false  # Worker inside 07_bfs_engine.ps1 (formerly conflated with Worker)
            BFS               = $false  # 07_bfs_engine.ps1 main engine
            HTML              = $false   # 09_output_html.ps1
            JSON              = $false  # 08_output_json.ps1
            Console           = $false  # 10_output_console.ps1
            Wizard            = $false  # 11_wizard.ps1
            SelfTest          = $false  # 90_selftest.ps1
            # JavaScript/UI module
            Dashboard         = $false  # dashboard.js
            Tree              = $false   # tree.js
            Heatmap           = $false  # heatmap.js
            Sidebar           = $false  # sidebar.js
            Core              = $false  # core.js
            Compare           = $false  # compare.js
            Catalog           = $false  # catalog.js
            HtmlBodyInit      = $false   # htmlbody-init.js
            OutputHTML        = $false   # 09_output_html.ps1
            OutputConsole     = $false  # 10_output_console.ps1
            OutputJSON        = $false  # 08_output_json.ps1
            Profiler          = $false  # 02_profiler.ps1
            Logging           = $false  # 01_logging.ps1
            Utils             = $false  # 04_utils.ps1
            Model             = $false  # 03_model.ps1
            Reparse           = $false  # 05_reparse.ps1
            Traversal         = $false  # 07_bfs_engine.ps1
            TreeWorker        = $false  # 06_worker.ps1
            Bootstrap         = $false  # 00_bootstrap.ps1
            Help              = $false  # 12_help.ps1
            Summary           = $false  # 13_summary.ps1
            OutputFormat      = $false  # 14_output_format.ps1
        }
        
        # Detailed worker tracing (very verbose)
        WorkerTracing = $false
        
        # Show timing information
        Timing = $true
    }
    
    # Performance profiling configuration
    Profiler = @{
        Enable = $true                      # Enable/disable profiler
        ReportTop = 20                       # Show top N slowest operations
    }
    
    # Output formatting options
    Output = @{
        JsonDepth = 100                      # Recursion depth for JSON conversion
    }
    
    # Hash algorithm settings
    Hash = @{
        DefaultAlgorithm = "SHA256"          # Default hash algorithm
        SupportedAlgorithms = @(              # Available algorithms
            "SHA256",
            "SHA1",
            "MD5"
        )
    }
    
    # Console output formatting
    Console = @{
        EnableColors = $true                  # Use ANSI colors in console
        ShowProgress = $true                   # Show progress bar during traversal
    }
}

# Optional: Validate critical configuration values
if ($TreeAdvConfig.Performance.DefaultParallelism -gt $TreeAdvConfig.Performance.MaxItems) {
    Write-Warning "DefaultParallelism exceeds MaxItems - reducing to safe value"
    $TreeAdvConfig.Performance.DefaultParallelism = [Math]::Min(
        $TreeAdvConfig.Performance.DefaultParallelism,
        $TreeAdvConfig.Performance.MaxItems
    )
}

# Ensure hash algorithm is valid
if ($TreeAdvConfig.Hash.DefaultAlgorithm -notin $TreeAdvConfig.Hash.SupportedAlgorithms) {
    Write-Warning "Invalid hash algorithm '$($TreeAdvConfig.Hash.DefaultAlgorithm)' - resetting to SHA256"
    $TreeAdvConfig.Hash.DefaultAlgorithm = "SHA256"
}

# Configuration loaded successfully (silent in normal mode, verbose in debug)
if ($DebugPreference -ne 'SilentlyContinue') {
    Write-Debug "Configuration loaded: Version $($TreeAdvConfig.Version)"
    Write-Debug "  Parallelism: $($TreeAdvConfig.Performance.DefaultParallelism)"
    Write-Debug "  MaxDepth: $($TreeAdvConfig.Traversal.DefaultMaxDepth)"
    Write-Debug "  Hash Algorithm: $($TreeAdvConfig.Hash.DefaultAlgorithm)"
    Write-Debug "  Debug Master Switch: $($TreeAdvConfig.Debug.Enable)"
    if ($TreeAdvConfig.Debug.Enable) {
        Write-Debug "  Active debug modules:"
        $TreeAdvConfig.Debug.Modules.Keys | ForEach-Object {
            if ($TreeAdvConfig.Debug.Modules[$_]) {
                Write-Debug "    - $_"
            }
        }
    }
}