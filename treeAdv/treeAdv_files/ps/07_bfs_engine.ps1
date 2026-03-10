<#
.FILENAME
    07_bfs_engine.ps1

.SYNOPSIS
    BFS traversal engine with runspace pool for parallel directory enumeration

.DESCRIPTION
    Implements a breadth-first search algorithm using a runspace pool for
    parallel directory traversal. Each directory is processed by a worker
    function that enumerates its contents and collects requested attributes
    (ACL, hash, timestamps, etc.).

    Features:
    - Parallel directory enumeration with configurable worker count
    - BFS algorithm ensuring depth-controlled traversal
    - Support for all extra flags (acl, hash, ctime, readonly, hidden)
    - Cloud file detection (Offline, Sparse attributes)
    - Detailed debug output controlled by configuration

.PARAMETER Root
    Root directory path to start traversal from

.PARAMETER MaxDepth
    Maximum depth to traverse (0 = root only, 1 = root + children, etc.)

.PARAMETER Parallelism
    Number of parallel worker threads to use

.PARAMETER ExtraFlags
    Hashtable of extra attributes to collect (acl, hash, ctime, readonly, hidden)

.PARAMETER HashAlgorithm
    Algorithm to use for hash calculation (SHA256, SHA1, MD5)

.OUTPUTS
    Hashtable containing 'tree' (hierarchical structure) and 'summary' (statistics)
#>

function Start-BFSTraversal {
    param(
        [string]$Root,
        [int]$MaxDepth,
        [int]$Parallelism,
        [hashtable]$ExtraFlags = @{},
        [string]$HashAlgorithm = "SHA256"
    )

    Start-Profile "Traversal"

    # Use configuration defaults if parameters not provided
    if (-not $Parallelism -or $Parallelism -eq 0) {
        $Parallelism = $TreeAdvConfig.Performance.DefaultParallelism
    }
    if (-not $MaxDepth -or $MaxDepth -eq 0) {
        $MaxDepth = $TreeAdvConfig.Traversal.DefaultMaxDepth
    }

    # Determine if master debug is enabled
    $masterDebugEnabled = $TreeAdvConfig.Debug.Enable
    
    Write-Debug "Start-BFSTraversal: Root=$Root, MaxDepth=$MaxDepth, Parallelism=$Parallelism"
    Write-Debug "ExtraFlags: $(($ExtraFlags.Keys -join ','))"

    # Dictionary to store all nodes by ID
    $treeNodes = @{}

    # Create root node
    try {
        $rootItem = Get-Item -LiteralPath $Root -Force -ErrorAction Stop
        if ($masterDebugEnabled) { Write-Debug "Root item found: $($rootItem.FullName)" }
    } catch {
        Write-Error "Cannot access root path: $Root"
        return $null
    }

    $rootNode = [PSCustomObject]@{
        Id = 0
        ParentId = -1
        Name = Split-Path $Root -Leaf
        Path = $Root
        FullPath = $Root
        IsDirectory = $true
        Depth = 0
        Children = New-Object System.Collections.ArrayList
        LastWriteTime = $rootItem.LastWriteTime
        CreationTime = $rootItem.CreationTime
        SizeBytes = $null
        SizePretty = ""
        IsReadOnly = $rootItem.Attributes.HasFlag([IO.FileAttributes]::ReadOnly)
        IsHidden = $rootItem.Attributes.HasFlag([IO.FileAttributes]::Hidden)
        IsOffline = $rootItem.Attributes.HasFlag([IO.FileAttributes]::Offline)
        IsSparse = $rootItem.Attributes.HasFlag([IO.FileAttributes]::SparseFile)
        AclSddl = $null
        Hash = $null
    }
    $treeNodes[0] = $rootNode

    # Initialize BFS queue
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue(@{
        Path = $Root
        Depth = 0
        ParentId = -1
        NodeId = 0
    })

    $nextId = 1
    $processedCount = 0
    $dirCount = 0
    $fileCount = 0
    $hashCalculatedCount = 0
    $hashFailedCount = 0

    # Create runspace pool
    $pool = [runspacefactory]::CreateRunspacePool(1, $Parallelism)
    $pool.Open()
    $psList = New-Object System.Collections.ArrayList

    Write-Host "Starting BFS scan with $Parallelism workers..." -ForegroundColor Cyan

    # Before starting workers, determine whether worker debugging is enabled
    $workerDebugEnabled = $masterDebugEnabled -and $TreeAdvConfig.Debug.Modules.BFSWorker

    # Log to verify the actual value (only if master debug is enabled)
    if ($masterDebugEnabled) {
        Write-Debug "BFSWorker debug flag = $workerDebugEnabled (config value: $($TreeAdvConfig.Debug.Modules.BFSWorker))"
    }

    # Worker function script block with proper variable escaping
    $workerScript = {
        param(
            [string]$Path,
            [hashtable]$ExtraFlags,
            [string]$HashAlgorithm,
            [bool]$DebugEnabled
        )
        
        $results = @()
        $debugPrefix = "[WORKER:$Path]"
        
        # Debug entry - solo se esplicitamente abilitato
        if ($DebugEnabled) {
            Write-Debug "$debugPrefix Started with ExtraFlags: $(($ExtraFlags.Keys -join ',')) HashAlgorithm: $HashAlgorithm"
        }
        
        try {
            # Verify path exists
            if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
                if ($DebugEnabled) { Write-Debug "$debugPrefix Directory not found" }
                return $results
            }
            
            # Create DirectoryInfo
            $di = [System.IO.DirectoryInfo]::new($Path)
            if (-not $di.Exists) {
                if ($DebugEnabled) { Write-Debug "$debugPrefix DirectoryInfo.Exists false" }
                return $results
            }
            
            if ($DebugEnabled) { Write-Debug "$debugPrefix Starting enumeration..." }
            
            # Enumerate all items
            $itemCount = 0
            $errorCount = 0
            
            foreach ($item in $di.EnumerateFileSystemInfos()) {
                $itemCount++
                
                try {
                    $isDir = $item.Attributes.HasFlag([IO.FileAttributes]::Directory)
                    $isHidden = $item.Attributes.HasFlag([IO.FileAttributes]::Hidden)
                    $isRO = $item.Attributes.HasFlag([IO.FileAttributes]::ReadOnly)
                    $isSystem = $item.Attributes.HasFlag([IO.FileAttributes]::System)
                    $isOffline = $item.Attributes.HasFlag([IO.FileAttributes]::Offline)
                    $isSparse = $item.Attributes.HasFlag([IO.FileAttributes]::SparseFile)
                    
                    # Debug item details
                    if ($DebugEnabled) {
                        Write-Debug "$debugPrefix Item #$($itemCount): $($item.Name) (Dir=$isDir, Hidden=$isHidden, RO=$isRO, System=$isSystem, Offline=$isOffline, Sparse=$isSparse)"
                    }
                    
                    # Skip system items
                    if ($isSystem) { 
                        if ($DebugEnabled) { Write-Debug "$debugPrefix Skipping system item: $($item.Name)" }
                        continue 
                    }
                    
                    $ctime = $null
                    $sddl = $null
                    $hash = $null
                    $size = $null
                    
                    # CreationTime (if requested)
                    if ($ExtraFlags.ctime) {
                        try { 
                            $ctime = $item.CreationTime
                            if ($DebugEnabled) { Write-Debug "$debugPrefix Got CreationTime: $ctime for $($item.Name)" }
                        } catch { 
                            if ($DebugEnabled) { Write-Debug "$debugPrefix Failed to get CreationTime: $($_.Exception.Message)" }
                        }
                    }
                    
                    # Size (files only)
                    if (-not $isDir) {
                        try { 
                            $size = $item.Length
                            if ($DebugEnabled) { Write-Debug "$debugPrefix Size: $size bytes for $($item.Name)" }
                        } catch { 
                            if ($DebugEnabled) { Write-Debug "$debugPrefix Failed to get size: $($_.Exception.Message)" }
                        }
                    }
                    
                    # ACL (if requested)
                    if ($ExtraFlags.acl) {
                        try { 
                            $acl = Get-Acl -LiteralPath $item.FullName -ErrorAction Stop
                            $sddl = $acl.Sddl
                            if ($DebugEnabled) { Write-Debug "$debugPrefix Got ACL for $($item.Name)" }
                        } catch { 
                            if ($DebugEnabled) { Write-Debug "$debugPrefix Failed to get ACL: $($_.Exception.Message)" }
                        }
                    }
                    
                    # HASH CALCULATION
                    if ($ExtraFlags.hash -and -not $isDir -and -not $isOffline) {
                        try {
                            if ($DebugEnabled) { Write-Debug "$debugPrefix Calculating hash for $($item.Name) using Get-FileHash..." }
                            $fileHash = Get-FileHash -LiteralPath $item.FullName -Algorithm $HashAlgorithm -ErrorAction Stop
                            $hash = $fileHash.Hash
                            if ($DebugEnabled) { 
                                Write-Debug "$debugPrefix HASH SUCCESS for $($item.Name): $($hash.Substring(0, [Math]::Min(8, $hash.Length)))..."
                            }
                        } catch { 
                            if ($DebugEnabled) { Write-Debug "$debugPrefix HASH FAILED for $($item.Name): $($_.Exception.Message)" }
                        }
                    } elseif ($ExtraFlags.hash -and -not $isDir -and $isOffline) {
                        if ($DebugEnabled) { Write-Debug "$debugPrefix Skipping hash for offline file: $($item.Name)" }
                    }
                    
                    # Create result object
                    $obj = [PSCustomObject]@{
                        Name = $item.Name
                        FullPath = $item.FullName
                        IsDirectory = $isDir
                        LastWriteTime = $item.LastWriteTime
                        CreationTime = $ctime
                        SizeBytes = $size
                        IsReadOnly = $isRO
                        IsHidden = $isHidden
                        IsOffline = $isOffline
                        IsSparse = $isSparse
                        AclSddl = $sddl
                        Hash = $hash
                    }
                    
                    $results += $obj
                    if ($DebugEnabled) { Write-Debug "$debugPrefix Added $($item.Name) to results. Total: $($results.Count)" }
                    
                } catch {
                    $errorCount++
                    if ($DebugEnabled) { 
                        Write-Debug "$debugPrefix Error processing item $($item.Name): $($_.Exception.Message)"
                        Write-Debug "$debugPrefix Stack: $($_.ScriptStackTrace)"
                    }
                }
            }
            
            if ($DebugEnabled) { 
                Write-Debug "$debugPrefix Enumeration complete. Processed: $itemCount items, Errors: $errorCount, Results: $($results.Count)"
            }
            
        } catch {
            if ($DebugEnabled) {
                Write-Debug "$debugPrefix Fatal error enumerating directory: $($_.Exception.Message)"
                Write-Debug "$debugPrefix Stack: $($_.ScriptStackTrace)"
            }
        }
        
        if ($DebugEnabled) { Write-Debug "$debugPrefix Returning $($results.Count) items" }
        return $results
    }

    # Main BFS loop
    while($queue.Count -gt 0 -or $psList.Count -gt 0) {
        # Start new workers if queue has items and we have capacity
        while($queue.Count -gt 0 -and $psList.Count -lt $Parallelism) {
            $item = $queue.Dequeue()
            
            if ($masterDebugEnabled) { Write-Debug "Starting worker for: $($item.Path) (depth: $($item.Depth))" }
            
            $ps = [powershell]::Create()
            $ps.RunspacePool = $pool
            
            # Load the worker script as a script block with parameters
            $null = $ps.AddScript($workerScript.ToString())
            $null = $ps.AddCommand("Invoke-Command").AddParameter("ScriptBlock", $workerScript)
            $null = $ps.AddParameter("ArgumentList", @($item.Path, $ExtraFlags, $HashAlgorithm, $workerDebugEnabled))

            $handle = $ps.BeginInvoke()
            $psList.Add(@{
                PowerShell = $ps
                Handle = $handle
                Depth = $item.Depth
                ParentId = $item.ParentId
                NodeId = $item.NodeId
                Path = $item.Path
            }) | Out-Null
        }

        # Process completed workers
        $completedPs = New-Object System.Collections.ArrayList
        $remainingPs = New-Object System.Collections.ArrayList
        
        foreach($p in $psList) {
            if($p.Handle.IsCompleted) {
                try {
                    $res = $p.PowerShell.EndInvoke($p.Handle)
                    
                    if ($res -and $res.Count -gt 0) {
                        if ($masterDebugEnabled) { Write-Debug "Worker for $($p.Path) found $($res.Count) items" }
                        
                        foreach($entry in $res) {
                            if (-not $entry) { continue }
                            
                            $currentId = $nextId++
                            
                            # Count hash operations for reporting
                            if ($entry.IsDirectory -eq $false) {
                                if ($entry.Hash) {
                                    $hashCalculatedCount++
                                } else {
                                    $hashFailedCount++
                                }
                            }
                            
                            $node = [PSCustomObject]@{
                                Id = $currentId
                                ParentId = $p.NodeId
                                Name = $entry.Name
                                Path = $entry.FullPath
                                FullPath = $entry.FullPath
                                IsDirectory = $entry.IsDirectory
                                Depth = $p.Depth + 1
                                Children = New-Object System.Collections.ArrayList
                                LastWriteTime = $entry.LastWriteTime
                                CreationTime = $entry.CreationTime
                                SizeBytes = if($entry.IsDirectory) { $null } else { $entry.SizeBytes }
                                SizePretty = if($entry.IsDirectory) { "" } else { Format-Size $entry.SizeBytes }
                                IsReadOnly = $entry.IsReadOnly
                                IsHidden = $entry.IsHidden
                                IsOffline = $entry.IsOffline
                                IsSparse = $entry.IsSparse
                                AclSddl = $entry.AclSddl
                                Hash = $entry.Hash
                            }
                            
                            $treeNodes[$currentId] = $node
                            
                            if ($treeNodes.ContainsKey($p.NodeId)) {
                                $parent = $treeNodes[$p.NodeId]
                                [void]$parent.Children.Add($currentId)
                            }
                            
                            $processedCount++
                            
                            if ($entry.IsDirectory) {
                                $dirCount++
                                if (($p.Depth + 1) -lt $MaxDepth) {
                                    $queue.Enqueue(@{
                                        Path = $entry.FullPath
                                        Depth = $p.Depth + 1
                                        ParentId = $p.NodeId
                                        NodeId = $currentId
                                    })
                                }
                            } else {
                                $fileCount++
                            }
                        }
                    } else {
                        if ($masterDebugEnabled) { Write-Debug "Worker for $($p.Path) found no items" }
                    }
                } catch {
                    if ($masterDebugEnabled) { Write-Debug "Error processing worker result: $_" }
                }
                $p.PowerShell.Dispose()
                $completedPs.Add($p) | Out-Null
            } else {
                $remainingPs.Add($p) | Out-Null
            }
        }
        
        $psList = $remainingPs
        
        if ($psList.Count -gt 0) {
            Start-Sleep -Milliseconds 50
        }
    }

    $pool.Close()
    $pool.Dispose()

    Stop-Profile "Traversal"

    if ($masterDebugEnabled) { 
        Write-Debug "Scan completed. Found $processedCount items ($dirCount directories, $fileCount files)"
        Write-Debug "Hash stats: $hashCalculatedCount successful, $hashFailedCount failed/missing"
    }

    # Convert flat node list to hierarchical tree
    function ConvertTo-TreeHierarchy {
        param($NodeId, $Nodes)
        
        $node = $Nodes[$NodeId]
        if (-not $node) { return $null }
        
        $result = @{
            Name = $node.Name
            Path = $node.Path
            FullPath = $node.FullPath
            IsDirectory = $node.IsDirectory
            Depth = $node.Depth
            SizeBytes = $node.SizeBytes
            SizePretty = $node.SizePretty
            LastWriteTime = $node.LastWriteTime
            CreationTime = $node.CreationTime
            IsReadOnly = $node.IsReadOnly
            IsHidden = $node.IsHidden
            IsOffline = $node.IsOffline
            IsSparse = $node.IsSparse
            AclSddl = $node.AclSddl
            Hash = $node.Hash
            Children = @()
        }
        
        if ($node.IsDirectory -and $node.Children.Count -gt 0) {
            foreach ($childId in $node.Children) {
                $childNode = ConvertTo-TreeHierarchy -NodeId $childId -Nodes $Nodes
                if ($childNode) {
                    $result.Children += $childNode
                }
            }
        }
        
        return $result
    }

    # Verify treeNodes contains data
    if ($masterDebugEnabled) { Write-Debug "treeNodes contains $($treeNodes.Count) elements" }
    
    $tree = ConvertTo-TreeHierarchy -NodeId 0 -Nodes $treeNodes
    
    # Verify tree was built successfully
    if (-not $tree) {
        Write-Error "Cannot build tree! treeNodes might be empty."
        return $null
    }
    
    if ($masterDebugEnabled) { Write-Debug "Tree built successfully" }

    # Build extras array
    $extrasArray = @(
        $(if ($ExtraFlags.acl) { "ACL" }),
        $(if ($ExtraFlags.hash) { "Hash($HashAlgorithm)" }),
        $(if ($ExtraFlags.ctime) { "CreationTime" }),
        $(if ($ExtraFlags.readonly) { "ReadOnly" }),
        $(if ($ExtraFlags.hidden) { "Hidden" })
    ) | Where-Object { $_ }  # Filter empty elements

    # Convert array to string with join
    $extrasString = $extrasArray -join ", "

    # Build final result
    $result = @{
        tree = $tree
        summary = [PSCustomObject]@{
            RootPath = $Root
            Timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            ItemsProcessed = $processedCount
            Directories = $dirCount
            Files = $fileCount
            DepthLimit = $MaxDepth
            Parallelism = $Parallelism
            Extras = $extrasString
            Elapsed = if ($TreeAdvConfig.Profiler.Enable) { (Get-ProfileTime "Traversal") } else { $null }
        }
        root = $tree
    }

    if ($processedCount -eq 0) {
        Write-Host "WARNING: No items found! Check if directory is empty and permissions are correct." -ForegroundColor Yellow
    } else {
        Write-Host "Scan completed. Found $processedCount items ($dirCount directories, $fileCount files)." -ForegroundColor Green
        Write-Host "Hash calculation: $hashCalculatedCount successful, $hashFailedCount failed/missing" -ForegroundColor Cyan
    }

    return $result
}