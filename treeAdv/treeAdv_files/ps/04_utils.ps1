<#
.FILENAME
    04_utils.ps1

.SYNOPSIS

.DESCRIPTION
        Ensures that a node has either Path or FullPath property

#>

function Format-Size($bytes){
    if($bytes -lt 1kb){ return "$bytes B" }
    if($bytes -lt 1mb){ return "{0:N1} KB" -f ($bytes/1kb) }
    if($bytes -lt 1gb){ return "{0:N1} MB" -f ($bytes/1mb) }
    return "{0:N1} GB" -f ($bytes/1gb)
}

function Safe-GetItem($path){
    try{
        return Get-Item -LiteralPath $path -Force -ErrorAction Stop
    }
    catch{
        Log-Debug "Access error $path"
        return $null
    }
}

function Normalize-Path($p){
    return [System.IO.Path]::GetFullPath($p)
}

function Ensure-PathProperty {
    param($Node)
    if (-not $Node) { return $null }
    # Se ha già Path, ok
    if (Get-Member -InputObject $Node -Name Path -ErrorAction SilentlyContinue) {
        return $Node
    }
    # Se ha FullPath ma non Path, crea Path da FullPath
    if (Get-Member -InputObject $Node -Name FullPath -ErrorAction SilentlyContinue) {
        $Node | Add-Member -MemberType NoteProperty -Name Path -Value $Node.FullPath -Force
        return $Node
    }
    # Se non ha nessuno dei due, usa Name
    if (Get-Member -InputObject $Node -Name Name -ErrorAction SilentlyContinue) {
        $Node | Add-Member -MemberType NoteProperty -Name Path -Value $Node.Name -Force
        return $Node
    }
    return $Node
}