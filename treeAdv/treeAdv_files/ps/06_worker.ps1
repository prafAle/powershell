<#
.FILENAME
    06_worker.ps1

.SYNOPSIS
    Worker function for parallel directory enumeration

.DESCRIPTION
    Enumerates a single directory with support for extra attributes.
    Debug output is controlled by the $TreeAdvConfig.Debug.Modules.Worker flag.
#>

function Invoke-TreeWorker {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        [Parameter(Mandatory=$false)]
        [hashtable]$ExtraFlags,
        [Parameter(Mandatory=$false)]
        [ValidateSet("SHA256", "SHA1", "MD5")]
        [string]$HashAlgorithm = "SHA256",
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