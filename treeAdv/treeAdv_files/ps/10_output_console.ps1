<#
.FILENAME
    10_output_console.ps1

.SYNOPSIS
    Console and Text output formatter for TreeAdv
    Writes the tree structure to console or file with ASCII formatting

.DESCRIPTION
    Renders the directory tree with ASCII art.
    Shows file sizes, dates, and extra attributes when available.
    Hash is displayed in FULL (not truncated) for complete audit trail.
    Supports both Console output (to screen) and Text output (to file).

.PARAMETER Tree
    The tree structure to display (hierarchical format)

.PARAMETER OutputPath
    Optional path to save text output. If specified, writes to file instead of console.
#>

function Write-ConsoleOutput {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Tree,
        
        [Parameter(Mandatory=$false)]
        [string]$OutputPath
    )

    $lines = New-Object System.Collections.ArrayList
    
    # Add header
    $lines.Add("") | Out-Null
    $lines.Add("TREE STRUCTURE:") | Out-Null
    $lines.Add("══════════════") | Out-Null
    $lines.Add("") | Out-Null

    # Recursive function to build tree lines
    function Build-NodeLines {
        param(
            [PSCustomObject]$Node,
            [string]$Prefix = "",
            [bool]$IsLast = $true,
            [System.Collections.ArrayList]$Lines
        )

        # Determine branch symbol
        $branch = if ($IsLast) { "└───" } else { "├───" }

        # Build the base line
        if ($Node.IsDirectory) {
            $line = "$Prefix$branch$($Node.Name)\"
            $Lines.Add($line) | Out-Null
        } else {
            # Build optional metadata
            $metadata = @()
            
            if ($Node.SizePretty) { $metadata += $Node.SizePretty }
            if ($Node.LastWriteTime) { 
                $dateStr = if ($Node.LastWriteTime -is [datetime]) {
                    $Node.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
                } else { $Node.LastWriteTime }
                $metadata += $dateStr
            }
            if ($Node.CreationTime) { 
                $ctStr = if ($Node.CreationTime -is [datetime]) {
                    $Node.CreationTime.ToString("yyyy-MM-dd HH:mm")
                } else { $Node.CreationTime }
                $metadata += "CT=$ctStr"
            }
            if ($Node.IsReadOnly) { $metadata += "RO" }
            if ($Node.IsHidden) { $metadata += "H" }
            
            # HASH
            if ($Node.Hash) { 
                $metadata += "Hash=$($Node.Hash)"
            }
            
            if ($Node.AclSddl) { $metadata += "ACL" }
            if ($Node.IsOffline -or $Node.IsSparse) { 
                $cloud = @()
                if ($Node.IsOffline) { $cloud += "Offline" }
                if ($Node.IsSparse) { $cloud += "Sparse" }
                $metadata += "Cloud=$($cloud -join ',')"
            }

            if ($metadata.Count -gt 0) {
                $line = "$Prefix$branch$($Node.Name) [$($metadata -join ' | ')]"
            } else {
                $line = "$Prefix$branch$($Node.Name)"
            }
            
            $Lines.Add($line) | Out-Null
        }

        # Process children if it's a directory
        if ($Node.IsDirectory -and $Node.Children -and $Node.Children.Count -gt 0) {
            for ($i = 0; $i -lt $Node.Children.Count; $i++) {
                $child = $Node.Children[$i]
                $isLastChild = ($i -eq $Node.Children.Count - 1)
                $newPrefix = if ($IsLast) { "$Prefix    " } else { "$Prefix│   " }
                Build-NodeLines -Node $child -Prefix $newPrefix -IsLast $isLastChild -Lines $Lines
            }
        }
    }

    # Build tree lines starting from root
    Build-NodeLines -Node $Tree -Prefix "" -IsLast $true -Lines $lines
    $lines.Add("") | Out-Null

    # Output handling
    if ($OutputPath) {
        # Write to file
        $outputDir = Split-Path $OutputPath -Parent
        if ($outputDir -and -not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
            Write-Debug "Created directory: $outputDir"
        }
        
        $lines -join [Environment]::NewLine | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Host "Text saved to: $OutputPath" -ForegroundColor Green
        
        # Also show in console if debug mode is enabled
        if ($DebugPreference -ne 'SilentlyContinue') {
            $lines | ForEach-Object { Write-Host $_ }
        }
    } else {
        # Write to console
        $lines | ForEach-Object { Write-Host $_ }
    }
}

# Export the function