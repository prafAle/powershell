<#
.FILENAME
  09_output_html.ps1

.SYNOPSIS
  Main HTML generator for TreeAdv
  Writes the tree data to HTML format with professional top navigation

.DESCRIPTION
  Generates a complete HTML report with interactive tree visualization,
  treemap, dashboard, and compare functionality.
  Creates a folder with the same name as the HTML file (without extension)
  containing all necessary CSS, JS, and data files.
  Uses clean top navigation bar instead of sidebar.

.PARAMETER Data
  The tree data object from BFS traversal

.PARAMETER OutputPath
  Path where to save the HTML file
#>

function Write-HtmlOutput {
  param(
    [Parameter(Mandatory=$true)]
    [PSCustomObject]$Data,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputPath
  )

  Start-Profile "HTML"

  Write-Host ""
  Write-Host "╔════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
  Write-Host "║ HTML OUTPUT" -ForegroundColor Magenta
  Write-Host "╚════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
  Write-Host ""

  Write-Debug "Write-HtmlOutput: OutputPath=$OutputPath"

  # ============================================================
  # Normalize the entire tree structure
  # ============================================================
  
  function ConvertTo-PSObject {
    param($Node)
    
    if ($null -eq $Node) { return $null }
    
    # If it's a hashtable, convert to PSCustomObject
    if ($Node -is [hashtable]) {
      
      function Get-HashValue($Hash, $Key, $Default = $null) {
        if ($Hash.ContainsKey($Key)) { return $Hash[$Key] }
        return $Default
      }
      
      $obj = [PSCustomObject]@{
        Name = Get-HashValue $Node 'Name' ''
        Path = Get-HashValue $Node 'Path' (Get-HashValue $Node 'FullPath' '')
        FullPath = Get-HashValue $Node 'FullPath' (Get-HashValue $Node 'Path' '')
        IsDirectory = Get-HashValue $Node 'IsDirectory' $false
        Depth = Get-HashValue $Node 'Depth' 0
        SizeBytes = Get-HashValue $Node 'SizeBytes' $null
        SizePretty = Get-HashValue $Node 'SizePretty' ''
        LastWriteTime = Get-HashValue $Node 'LastWriteTime' $null
        CreationTime = Get-HashValue $Node 'CreationTime' $null
        IsReadOnly = Get-HashValue $Node 'IsReadOnly' $false
        IsHidden = Get-HashValue $Node 'IsHidden' $false
        IsOffline = Get-HashValue $Node 'IsOffline' $false
        IsSparse = Get-HashValue $Node 'IsSparse' $false
        AclSddl = Get-HashValue $Node 'AclSddl' $null
        Hash = Get-HashValue $Node 'Hash' $null
        CloudStatus = Get-HashValue $Node 'CloudStatus' ''
        Children = @()
      }
      
      $children = Get-HashValue $Node 'Children' @()
      if ($children -and $children.Count -gt 0) {
        foreach ($child in $children) {
          $childObj = ConvertTo-PSObject -Node $child
          if ($childObj) {
            $obj.Children += $childObj
          }
        }
      }
      
      return $obj
    }
    
    # If it's already a PSCustomObject
    if ($Node -is [PSCustomObject]) {
      
      $obj = [PSCustomObject]@{
        Name = if ($null -ne $Node.Name) { $Node.Name } else { '' }
        Path = if ($null -ne $Node.Path) { $Node.Path } else { 
             if ($null -ne $Node.FullPath) { $Node.FullPath } else { 
             if ($null -ne $Node.Name) { $Node.Name } else { '' } } }
        FullPath = if ($null -ne $Node.FullPath) { $Node.FullPath } else { 
               if ($null -ne $Node.Path) { $Node.Path } else { 
               if ($null -ne $Node.Name) { $Node.Name } else { '' } } }
        IsDirectory = if ($null -ne $Node.IsDirectory) { $Node.IsDirectory } else { $false }
        Depth = if ($null -ne $Node.Depth) { $Node.Depth } else { 0 }
        SizeBytes = if ($null -ne $Node.SizeBytes) { $Node.SizeBytes } else { $null }
        SizePretty = if ($null -ne $Node.SizePretty) { $Node.SizePretty } else { '' }
        LastWriteTime = if ($null -ne $Node.LastWriteTime) { $Node.LastWriteTime } else { $null }
        CreationTime = if ($null -ne $Node.CreationTime) { $Node.CreationTime } else { $null }
        IsReadOnly = if ($null -ne $Node.IsReadOnly) { $Node.IsReadOnly } else { $false }
        IsHidden = if ($null -ne $Node.IsHidden) { $Node.IsHidden } else { $false }
        IsOffline = if ($null -ne $Node.IsOffline) { $Node.IsOffline } else { $false }
        IsSparse = if ($null -ne $Node.IsSparse) { $Node.IsSparse } else { $false }
        AclSddl = if ($null -ne $Node.AclSddl) { $Node.AclSddl } else { $null }
        Hash = if ($null -ne $Node.Hash) { $Node.Hash } else { $null }
        CloudStatus = if ($null -ne $Node.CloudStatus) { $Node.CloudStatus } else { '' }
        Children = @()
      }
      
      if ($null -ne $Node.Children -and $Node.Children.Count -gt 0) {
        foreach ($child in $Node.Children) {
          $childObj = ConvertTo-PSObject -Node $child
          if ($childObj) {
            $obj.Children += $childObj
          }
        }
      }
      
      return $obj
    }
    
    return $Node
  }

  Write-Host "▶ TREE NORMALIZATION" -ForegroundColor Cyan
  $normalizedTree = ConvertTo-PSObject -Node $Data.tree
  Write-Host "  ✓ Normalized tree type: $($normalizedTree.GetType().Name)" -ForegroundColor Green

  # Prepare paths
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($OutputPath)
  $outputDir = Split-Path $OutputPath -Parent
  $filesDir = Join-Path $outputDir "${baseName}_files"
  $cssDir = Join-Path $filesDir "css"
  $modDir = Join-Path $filesDir "mod"
  $dataDir = Join-Path $filesDir "data"

  Write-Host "▶ OUTPUT PATHS" -ForegroundColor Cyan
  Write-Host "  - HTML Output : $OutputPath"
  Write-Host "  - Files Dir   : $filesDir"

  # Create directories
  Write-Host "▶ CREATING DIRECTORIES" -ForegroundColor Cyan
  try {
    if (-not (Test-Path $filesDir)) {
      $null = New-Item -ItemType Directory -Path $filesDir -Force
      Write-Host "  ✓ Created: $filesDir" -ForegroundColor Green
    }
    if (-not (Test-Path $cssDir)) {
      $null = New-Item -ItemType Directory -Path $cssDir -Force
      Write-Host "  ✓ Created: $cssDir" -ForegroundColor Green
    }
    if (-not (Test-Path $modDir)) {
      $null = New-Item -ItemType Directory -Path $modDir -Force
      Write-Host "  ✓ Created: $modDir" -ForegroundColor Green
    }
    if (-not (Test-Path $dataDir)) {
      $null = New-Item -ItemType Directory -Path $dataDir -Force
      Write-Host "  ✓ Created: $dataDir" -ForegroundColor Green
    }
  } catch {
    Write-Host "  ✗ ERROR creating directory: $_" -ForegroundColor Red
    throw
  }

  # Find static files
  Write-Host "▶ LOCATING STATIC FILES" -ForegroundColor Cyan
  
  $scriptPath = $null
  if ($PSScriptRoot) {
    $scriptPath = $PSScriptRoot
    Write-Host "  - Using PSScriptRoot: $scriptPath" -ForegroundColor Gray
  }
  
  if (-not $scriptPath -or -not (Test-Path (Join-Path $scriptPath "..\mod"))) {
    $currentDir = Get-Location
    Write-Host "  - Using current directory: $currentDir" -ForegroundColor Gray
    $scriptPath = $currentDir.Path
  }
  
  if (-not $scriptPath -or -not (Test-Path (Join-Path $scriptPath "..\mod"))) {
    $invocationPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
    if ($invocationPath) {
      Write-Host "  - Using MyInvocation: $invocationPath" -ForegroundColor Gray
      $scriptPath = $invocationPath
    }
  }

  Write-Host "  - Script path determined: $scriptPath" -ForegroundColor Yellow

  $treeAdvRoot = if ($scriptPath -like "*\ps") {
    Split-Path -Parent $scriptPath
  } else {
    $scriptPath
  }
  
  Write-Host "  - TreeAdv root: $treeAdvRoot" -ForegroundColor Yellow

  $modSourcePath = Join-Path $treeAdvRoot "mod"
  $cssSourcePath = Join-Path $treeAdvRoot "css\style.css"
  
  Write-Host "  - Mod path: $modSourcePath" -ForegroundColor Gray
  Write-Host "  - Mod exists: $(Test-Path $modSourcePath)" -ForegroundColor Gray
  Write-Host "  - CSS path: $cssSourcePath" -ForegroundColor Gray
  Write-Host "  - CSS exists: $(Test-Path $cssSourcePath)" -ForegroundColor Gray

  # Copy CSS
  if (Test-Path $cssSourcePath) {
    Write-Host "  COPYING CSS:" -ForegroundColor Yellow
    $cssDest = Join-Path $cssDir "style.css"
    Copy-Item -Path $cssSourcePath -Destination $cssDest -Force
    Write-Host "  ✓ CSS copied" -ForegroundColor Green
  } else {
    Write-Host "  ⚠ CSS not found in: $cssSourcePath" -ForegroundColor Yellow
  }

  # Copy JS
  if (Test-Path $modSourcePath) {
    Write-Host "  COPYING JS:" -ForegroundColor Yellow
    $jsFiles = Get-ChildItem -Path $modSourcePath -Filter "*.js"
    Write-Host "  Found $($jsFiles.Count) JS files" -ForegroundColor Gray
    
    foreach ($file in $jsFiles) {
      $destFile = Join-Path $modDir $file.Name
      Copy-Item -Path $file.FullName -Destination $destFile -Force
      Write-Host "  ✓ Copied: $($file.Name)" -ForegroundColor Green
    }
  } else {
    Write-Host "  ⚠ Mod directory not found: $modSourcePath" -ForegroundColor Yellow
  }

  # Save JSON
  Write-Host "▶ SAVING JSON" -ForegroundColor Cyan
  $jsonPath = Join-Path $dataDir "$baseName.json"
  
  $jsDataObject = @{
    tree = $normalizedTree
    summary = if ($Data.summary) { $Data.summary } else { $null }
  }
  
  try {
    $json = $jsDataObject | ConvertTo-Json -Depth 100
    $json | Out-File -FilePath $jsonPath -Encoding UTF8
    Write-Host "  ✓ JSON saved: $jsonPath" -ForegroundColor Green
  } catch {
    Write-Host "  ✗ ERROR saving JSON: $_" -ForegroundColor Red
    throw
  }

  # Generate HTML
  Write-Host "▶ GENERATING HTML" -ForegroundColor Cyan
  try {
    $html = Get-HtmlTemplate -BaseName $baseName -DataObject $jsDataObject
    $html | Out-File -FilePath $OutputPath -Encoding UTF8
    Write-Host "  ✓ HTML saved: $OutputPath" -ForegroundColor Green
  } catch {
    Write-Host "  ✗ ERROR generating HTML: $_" -ForegroundColor Red
    throw
  }

  Write-Host ""
  Write-Host "╔════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
  Write-Host "║ COMPLETED" -ForegroundColor Magenta
  Write-Host "╚════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
  Write-Host ""

  Stop-Profile "HTML"
}

function Get-HtmlTemplate {
  param(
    [string]$BaseName,
    [PSCustomObject]$DataObject
  )

  $jsonData = $DataObject | ConvertTo-Json -Depth 100
  $jsonDataSafe = $jsonData -replace '</script','<\/script'
  # Determine JS debugging based on configuration
  $debugJs = if ($TreeAdvConfig.Debug.Enable) { "true" } else { "false" }
  
  # Log to verify (only if master debug is active)
  if ($TreeAdvConfig.Debug.Enable) {
      Write-Debug "HTML debug flag = $debugJs"
  }

  return @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TreeAdv - Filesystem Analyzer</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="./${BaseName}_files/css/style.css">
  <script>
    window.__DEBUG__ = $debugJs;
    window.__USE_FA__ = true;   // Force Font Awesome for icons
    window.__BASE_FOLDER__ = "${BaseName}_files";
    window.__DATA_FILE__ = "${BaseName}.json";
  </script>
</head>
<body>
  <div id="app"></div>
  <script id="fs-data" type="application/json">$jsonDataSafe</script>
  <script src="./${BaseName}_files/mod/core.js"></script>
  <script src="./${BaseName}_files/mod/catalog.js"></script>
  <script src="./${BaseName}_files/mod/dashboard.js"></script>
  <script src="./${BaseName}_files/mod/tree.js"></script>  
  <script src="./${BaseName}_files/mod/heatmap.js"></script>
  <script src="./${BaseName}_files/mod/compare.js"></script>
  <script src="./${BaseName}_files/mod/htmlbody-init.js"></script>
</body>
</html>
"@
}