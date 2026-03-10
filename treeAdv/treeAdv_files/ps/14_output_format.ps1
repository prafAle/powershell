<#
.FILENAME
    14_output_format.ps1

.SYNOPSIS
    Format resolution utility for TreeAdv

.DESCRIPTION
    Determines the output format based on -Format parameter and file extension.
    Supports: Auto, Console, Text, Json, Html
#>

function Resolve-OutputFormat {
    <#
    .SYNOPSIS
        Resolves the actual output format based on parameters and file extension
    .PARAMETER Format
        The format specified by user (Auto, Console, Text, Json, Html)
    .PARAMETER OutputPath
        The output file path (if any)
    .RETURNS
        The resolved format as string
    #>
    param(
        [string]$Format,
        [string]$OutputPath
    )

    # Se il formato non è Auto, usa quello specificato
    if ($Format -ne "Auto") {
        return $Format
    }

    # Se non c'è output path, usa Console
    if ([string]::IsNullOrWhiteSpace($OutputPath)) {
        return "Console"
    }

    # Altrimenti, determina dal file extension
    $ext = [System.IO.Path]::GetExtension($OutputPath).ToLowerInvariant()
    
    switch ($ext) {
        ".json" { return "Json" }
        ".html" { return "Html" }
        ".htm"  { return "Html" }
        ".txt"  { return "Text" }
        default { return "Console" }
    }
}

# Esporta la funzione