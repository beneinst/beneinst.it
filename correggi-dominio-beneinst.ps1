param(
    [string]$Root
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = $PSScriptRoot
}

$Root = $Root.Trim().Trim('"').TrimEnd('\', '/')

$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$allowedExtensions = @('.html', '.htm', '.js', '.json', '.xml')

$replacements = @(
    @('http:\/\/192.168.178.46', 'https:\/\/beneinst.eu'),
    @('https:\/\/192.168.178.46', 'https:\/\/beneinst.eu'),
    @('http%3A%2F%2F192.168.178.46', 'https%3A%2F%2Fbeneinst.eu'),
    @('https%3A%2F%2F192.168.178.46', 'https%3A%2F%2Fbeneinst.eu'),
    @('http%3a%2f%2f192.168.178.46', 'https%3a%2f%2fbeneinst.eu'),
    @('https%3a%2f%2f192.168.178.46', 'https%3a%2f%2fbeneinst.eu'),
    @('http://192.168.178.46', 'https://beneinst.eu'),
    @('https://192.168.178.46', 'https://beneinst.eu'),
    @('192.168.178.46', 'beneinst.eu')
)

$files = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File |
    Where-Object { $allowedExtensions -contains $_.Extension.ToLowerInvariant() }

$changedFiles = 0
$replacementCount = 0

foreach ($file in $files) {
    $original = [System.IO.File]::ReadAllText($file.FullName)
    $updated = $original

    foreach ($pair in $replacements) {
        $before = $updated
        $updated = $updated.Replace($pair[0], $pair[1])

        if ($updated -ne $before) {
            $replacementCount++
        }
    }

    if ($updated -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $updated, $utf8NoBom)
        $changedFiles++
        Write-Host "Corretto: $($file.FullName)"
    }
}

Write-Host ""
Write-Host "Operazione completata."
Write-Host "File modificati: $changedFiles"
Write-Host "Gruppi di sostituzioni applicati: $replacementCount"

$remaining = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File |
    Where-Object { $allowedExtensions -contains $_.Extension.ToLowerInvariant() } |
    Select-String -Pattern '192\.168\.178\.46'

if ($remaining) {
    Write-Warning "Sono rimasti riferimenti all'indirizzo locale:"
    $remaining | ForEach-Object {
        Write-Warning "$($_.Path):$($_.LineNumber)"
    }
    exit 1
}

Write-Host "Verifica superata: nessun riferimento residuo a 192.168.178.46."
