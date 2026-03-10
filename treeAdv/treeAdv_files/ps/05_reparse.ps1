# reparse 
function Get-ReparseClass($fsi){

if(-not ($fsi.Attributes -band [IO.FileAttributes]::ReparsePoint)){
return "none"
}

$linkType = $fsi | Select-Object -ExpandProperty LinkType -ErrorAction SilentlyContinue

if($linkType -in @("SymbolicLink","Junction")){
return "link"
}

return "cloud"

}