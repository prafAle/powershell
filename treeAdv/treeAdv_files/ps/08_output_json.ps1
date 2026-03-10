<#
.FILENAME
    08_output_json.ps1

.SYNOPSIS
    JSON output formatter for TreeAdv

.DESCRIPTION
    Converts the tree structure to JSON format and saves it to file.
    Handles both PSCustomObject and Hashtable structures recursively.
    Includes all file attributes including hash, ACL, cloud status, etc.

.PARAMETER Data
    The data object containing tree and summary

.PARAMETER OutputPath
    Optional path to save the JSON file. If not specified, outputs to console.
#>

function Write-JsonOutput {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Data,
        
        [Parameter(Mandatory=$false)]
        [string]$OutputPath
    )
    
    Write-Debug "Write-JsonOutput: OutputPath=$OutputPath"
    
    $json = ConvertTo-JsonHierarchical -Tree $Data.tree -Summary $Data.summary
    
    if ($OutputPath) {
        $outputDir = Split-Path $OutputPath -Parent
        if ($outputDir -and -not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
            Write-Debug "Created directory: $outputDir"
        }
        
        $json | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Host "JSON saved to: $OutputPath" -ForegroundColor Green
        Write-Host "  - Total items: $($Data.summary.ItemsProcessed)" -ForegroundColor Gray
        Write-Host "  - Directories: $($Data.summary.Directories)" -ForegroundColor Gray
        Write-Host "  - Files: $($Data.summary.Files)" -ForegroundColor Gray
    } else {
        $json | Write-Output
    }
}

function ConvertTo-JsonHierarchical {
    <#
    .SYNOPSIS
        Converts tree data to hierarchical JSON format
        Supports both PSCustomObject and Hashtable structures
    #>
    param(
        [Parameter(Mandatory=$true)]
        $Tree,
        
        [Parameter(Mandatory=$false)]
        $Summary
    )
    
    # Funzione helper per ottenere valori da Hashtable o PSCustomObject
    function Get-Value {
        param($Object, [string]$Key, $DefaultValue = $null)
        
        if ($null -eq $Object) { return $DefaultValue }
        
        if ($Object -is [hashtable]) {
            if ($Object.ContainsKey($Key)) { return $Object[$Key] }
            return $DefaultValue
        }
        
        try {
            $value = $Object.$Key
            if ($null -ne $value) { return $value }
        } catch {
            # Ignore
        }
        
        return $DefaultValue
    }
    
    function Convert-Node {
        param($Node)
        
        if ($null -eq $Node) { return $null }
        
        $nodePath = Get-Value -Object $Node -Key "Path"
        if (-not $nodePath) {
            $nodePath = Get-Value -Object $Node -Key "FullPath"
        }
        if (-not $nodePath) {
            $nodePath = Get-Value -Object $Node -Key "Name" -DefaultValue ""
        }
        
        $isDir = Get-Value -Object $Node -Key "IsDirectory" -DefaultValue $false
        
        $obj = [ordered]@{
            name = Get-Value -Object $Node -Key "Name" -DefaultValue ""
            path = $nodePath
            type = if ($isDir) { "directory" } else { "file" }
            depth = Get-Value -Object $Node -Key "Depth" -DefaultValue 0
            sizeBytes = Get-Value -Object $Node -Key "SizeBytes" -DefaultValue $null
            sizePretty = Get-Value -Object $Node -Key "SizePretty" -DefaultValue ""
        }
        
        $lastWrite = Get-Value -Object $Node -Key "LastWriteTime"
        if ($lastWrite) {
            if ($lastWrite -is [datetime]) {
                $obj.lastWriteTime = $lastWrite.ToString("yyyy-MM-dd HH:mm:ss")
            } else {
                $obj.lastWriteTime = $lastWrite.ToString()
            }
        }
        
        # Extra attributes
        $creationTime = Get-Value -Object $Node -Key "CreationTime"
        if ($creationTime) {
            if ($creationTime -is [datetime]) {
                $obj.creationTime = $creationTime.ToString("yyyy-MM-dd HH:mm:ss")
            } else {
                $obj.creationTime = $creationTime.ToString()
            }
        }
        
        $hash = Get-Value -Object $Node -Key "Hash"
        if ($hash) { 
            $obj.hash = $hash 
        } elseif (-not $isDir) {
            # Se è un file ma non c'è hash, aggiungi comunque la proprietà come null
            $obj.hash = $null
        }
        
        $acl = Get-Value -Object $Node -Key "AclSddl"
        if ($acl) { 
            $obj.aclSddl = $acl 
        }
        
        $readOnly = Get-Value -Object $Node -Key "IsReadOnly" -DefaultValue $false
        if ($readOnly) { $obj.readOnly = $true }
        
        $hidden = Get-Value -Object $Node -Key "IsHidden" -DefaultValue $false
        if ($hidden) { $obj.hidden = $true }
        
        $offline = Get-Value -Object $Node -Key "IsOffline" -DefaultValue $false
        if ($offline) { $obj.isOffline = $true }
        
        $sparse = Get-Value -Object $Node -Key "IsSparse" -DefaultValue $false
        if ($sparse) { $obj.isSparse = $true }
        
        $cloudStatus = Get-Value -Object $Node -Key "CloudStatus"
        if ($cloudStatus) { 
            $obj.cloudStatus = $cloudStatus 
        } elseif ($offline -or $sparse) {
            # Costruisci cloudStatus se manca ma ci sono flag
            $status = @()
            if ($offline) { $status += "Offline" }
            if ($sparse) { $status += "Sparse" }
            if ($status.Count -gt 0) {
                $obj.cloudStatus = $status -join ","
            }
        }
        
        $children = Get-Value -Object $Node -Key "Children" -DefaultValue @()
        if ($isDir -and $children -and $children.Count -gt 0) {
            $obj.children = @()
            foreach ($child in $children) {
                $childObj = Convert-Node -Node $child
                if ($childObj) {
                    $obj.children += $childObj
                }
            }
        }
        
        return $obj
    }
    
    $treeObj = Convert-Node -Node $Tree
    
    $summaryObj = [ordered]@{
        rootPath = Get-Value -Object $Summary -Key "RootPath" -DefaultValue ""
        timestamp = Get-Value -Object $Summary -Key "Timestamp" -DefaultValue ""
        itemsProcessed = Get-Value -Object $Summary -Key "ItemsProcessed" -DefaultValue 0
        directories = Get-Value -Object $Summary -Key "Directories" -DefaultValue 0
        files = Get-Value -Object $Summary -Key "Files" -DefaultValue 0
        depthLimit = Get-Value -Object $Summary -Key "DepthLimit" -DefaultValue 0
        parallelism = Get-Value -Object $Summary -Key "Parallelism" -DefaultValue 0
        extras = Get-Value -Object $Summary -Key "Extras" -DefaultValue @()
        elapsed = Get-Value -Object $Summary -Key "Elapsed" -DefaultValue ""
    }
    
    $result = [ordered]@{
        generated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        summary = $summaryObj
        tree = $treeObj
    }
    
    return ($result | ConvertTo-Json -Depth 100)
}