# model 
class TreeNode {

[int]$Id
[int]$ParentId
[string]$Name
[string]$FullPath
[bool]$IsDirectory
[int]$Depth
[long]$SizeBytes
[datetime]$LastWriteTime

}

function New-TreeAdvItem {
    param(
        [string]$Path,
        [bool]$IsDirectory,
        [int64]$Size,
        [int]$Depth
    )
    [pscustomobject]@{
        Path        = $Path
        Name        = [System.IO.Path]::GetFileName($Path)
        Size        = $Size
        IsDirectory = $IsDirectory
        Depth       = $Depth
    }
}