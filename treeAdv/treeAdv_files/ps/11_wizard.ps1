<#
.FILENAME
    11_wizard.ps1

.SYNOPSIS
    Interactive wizard for TreeAdv configuration

.DESCRIPTION
    Provides step-by-step interactive configuration for TreeAdv parameters.
    Called when the -Wizard switch is used.
#>

function Read-IntInRange {
    <#
    .SYNOPSIS
        Prompts the user for an integer within a specified range.
    #>
    param([string]$Prompt, [int]$Default, [int]$Min, [int]$Max)
    while ($true) {
        $raw = Read-Host $Prompt
        if ([string]::IsNullOrWhiteSpace($raw)) { return $Default }
        $n = 0
        if ([int]::TryParse($raw, [ref]$n) -and $n -ge $Min -and $n -le $Max) { return $n }
        Write-Warning "Invalid number. Allowed range: $Min..$Max. Try again."
    }
}

function Show-FlagPreview {
    <#
    .SYNOPSIS
        Shows a human-readable preview of selected extra flags.
    #>
    param([string[]]$Flags)
    $desc = @()
    foreach ($f in $Flags) {
        switch ($f) {
            'a' { $desc += 'ACL' }
            'h' { $desc += 'Hash' }
            'c' { $desc += 'CreationTime' }
            'r' { $desc += 'ReadOnly' }
            's' { $desc += 'Hidden' }
        }
    }
    if ($desc.Count -eq 0) { $desc = @('none') }
    Write-Host "  Preview: $($desc -join ', ')" -ForegroundColor Gray
}

function Run-Wizard {
    Clear-Host
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║                     TreeAdv Interactive Wizard                            " -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This guided setup will ask a few questions and then run the tree generation." -ForegroundColor White
    Write-Host ""

    $steps = 7
    $result = [ordered]@{}

    # Step 1 - Path (mandatory)
    while ($true) {
        Write-Host "[Step 1/$steps] Root Path [mandatory]" -ForegroundColor Yellow
        Write-Host "Enter the full path of the folder to scan (e.g., C:\Data):" -ForegroundColor Gray
        $p = Read-Host "Answer"
        if ([string]::IsNullOrWhiteSpace($p)) { Write-Host "Path is required." -ForegroundColor Red; continue }
        if (-not (Test-Path -LiteralPath $p -PathType Container)) { Write-Host "Path does not exist or is not a directory." -ForegroundColor Red; continue }
        $result.Path = $p
        Write-Host "Selected: $p" -ForegroundColor Green
        break
    }
    Write-Host ""

    # Step 2 - Output (optional)
    Write-Host "[Step 2/$steps] Output file [optional]" -ForegroundColor Yellow
    Write-Host "Enter output file path or press ENTER for Console (supported: .txt, .json, .html):" -ForegroundColor Gray
    $out = Read-Host "Answer"
    if ($out) {
        $result.Output = $out
        Write-Host "Output: $out" -ForegroundColor Green
    } else {
        Write-Host "Output: Console" -ForegroundColor Green
    }
    Write-Host ""

    # Step 3 - MaxDepth (optional)
    Write-Host "[Step 3/$steps] MaxDepth [optional]" -ForegroundColor Yellow
    $md = Read-IntInRange -Prompt "Enter maximum depth (1..128) or press ENTER for 20" -Default 20 -Min 1 -Max 128
    $result.MaxDepth = $md
    Write-Host "MaxDepth: $md" -ForegroundColor Green
    Write-Host ""

    # Step 4 - Parallelism (optional)
    Write-Host "[Step 4/$steps] MaxDegreeOfParallelism [optional]" -ForegroundColor Yellow
    $dop = Read-IntInRange -Prompt "Enter parallel workers (1..128) or press ENTER for 8" -Default 8 -Min 1 -Max 128
    $result.MaxDegreeOfParallelism = $dop
    Write-Host "Parallel workers: $dop" -ForegroundColor Green
    Write-Host ""

    # Step 5 - Extra flags (optional)
    Write-Host "[Step 5/$steps] Extra attributes [optional]" -ForegroundColor Yellow
    Write-Host "Enter flags separated by comma or space. Supported flags:" -ForegroundColor Gray
    Write-Host " a = ACL (SDDL) | h = Hash | c = CreationTime | r = ReadOnly | s = Hidden" -ForegroundColor Gray
    Write-Host "Example: a,h,c  (press ENTER for none)" -ForegroundColor Gray
    $ex = Read-Host "Answer"
    if ($ex) {
        $split = $ex -split '[, ]+' | Where-Object { $_ }
        $valid = @()
        foreach ($f in $split) {
            $fl = $f.ToLower()
            if ($fl -in @('a','h','c','r','s')) { $valid += $fl } else { Write-Warning "Ignoring invalid flag '$f'." }
        }
        $result.Extra = $valid
        Write-Host "Extra: $($valid -join ',')" -ForegroundColor Green
        Show-FlagPreview -Flags $valid
    } else {
        $result.Extra = @()
        Write-Host "Extra: (none)" -ForegroundColor Green
    }
    Write-Host ""

    # Step 6 - Hash algorithm (optional, only if 'h')
    Write-Host "[Step 6/$steps] Hash algorithm [optional]" -ForegroundColor Yellow
    if ($result.Extra -and ($result.Extra -contains 'h')) {
        Write-Host "Choose: SHA256 (default) | SHA1 | MD5. Press ENTER for default." -ForegroundColor Gray
        $ha = Read-Host "Answer"
        if ([string]::IsNullOrWhiteSpace($ha)) { $ha = "SHA256" }
        if ($ha -notin @("SHA256","SHA1","MD5")) {
            Write-Warning "Invalid choice. Using SHA256."
            $ha = "SHA256"
        }
        $result.HashAlgorithm = $ha
        Write-Host "HashAlgorithm: $ha" -ForegroundColor Green
    } else {
        Write-Host "HashAlgorithm: (not used)" -ForegroundColor Green
    }
    Write-Host ""

    # Step 7 - Confirmation
    Write-Host "[Step 7/$steps] Confirmation" -ForegroundColor Yellow
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║                              SUMMARY OF CHOICES                          " -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "║ Path    : $($result.Path)" -ForegroundColor White
    Write-Host "║ Output  : $($result.Output ?? 'Console')" -ForegroundColor White
    Write-Host "║ Depth   : $($result.MaxDepth)" -ForegroundColor White
    Write-Host "║ Workers : $($result.MaxDegreeOfParallelism)" -ForegroundColor White
    Write-Host "║ Extra   : $(($result.Extra) -join ',' )" -ForegroundColor White
    Write-Host "║ Hash    : $($result.HashAlgorithm ?? '(n/a)')" -ForegroundColor White
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $go = Read-Host "Proceed? (Y/N)"
    if ($go -match '^[Yy]') { 
        return $result 
    } else { 
        Write-Host "Cancelled by user." -ForegroundColor Yellow
        return $null 
    }
}