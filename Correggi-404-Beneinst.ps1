#requires -Version 5.1
[CmdletBinding()]
param([string]$Root = '', [switch]$Apply)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = $PSScriptRoot }
$Root = (Resolve-Path -LiteralPath $Root.Trim().Trim('"')).Path
$maps = @(
    @('di-luigi-cardarellib5c2.html', 'opere-lettere-menu/penisola-indocinese-1993.html'),
    @('di-salvatore-messina3204.html', 'opere-poesie-menu/non-ce-armonia.html'),
    @('di-franco-bazzarellib620.html', 'opere-poesie-menu/sui-risvegli-dellanima.html'),
    @('di-franco-bazzarelli4047.html', 'opere-poesie-menu/quando-busserai-alla-mia-porta.html')
)
# I quattro vecchi nomi corrispondono agli ID 235, 162, 200 e 197 del rapporto.
# Le query string del vecchio URL non cambiano il file servito da GitHub Pages.
$rows = @(); $updates = @()
foreach ($map in $maps) {
    $old = Join-Path $Root $map[0]
    $target = Join-Path $Root $map[1]
    $url = 'https://beneinst.eu/' + $map[1]
    $state = 'PRONTO'; $note = ''
    $html = @"
<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<title>Pagina trasferita | Beneinst</title>
<meta http-equiv="refresh" content="0; url=$url">
<link rel="canonical" href="$url">
<script>window.location.replace("$url");</script>
</head><body><p>Pagina trasferita: <a href="$url">continua la lettura</a>.</p></body></html>
"@
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $state = 'DA_CONTROLLARE'; $note = 'La pagina di destinazione manca in locale'
    } elseif (Test-Path -LiteralPath $old) {
        $existing = [IO.File]::ReadAllText($old)
        if ($existing.Contains('window.location.replace("' + $url + '")') -and $existing.Contains('<title>Pagina trasferita | Beneinst</title>')) {
            $state = 'GIA_CORRETTO'
        } else {
            $state = 'DA_CONTROLLARE'; $note = 'File esistente: non viene sovrascritto automaticamente'
        }
    }
    $rows += [pscustomobject]@{ Stato=$state; VecchioFile=$map[0]; Destinazione=$url; Nota=$note }
    if ($state -eq 'PRONTO') { $updates += [pscustomobject]@{ Path=$old; Html=$html } }
}
$rows | Export-Csv -LiteralPath (Join-Path $Root 'report-correzione-404.csv') -Delimiter ';' -Encoding UTF8 -NoTypeInformation
Write-Host 'Correzione 404 Beneinst - versione 2026-10-02'
$rows | Format-Table -AutoSize
if (-not $Apply) { Write-Host 'ANTEPRIMA: nessun file HTML modificato.'; return }
$backup = Join-Path (Split-Path -Parent $Root) ('beneinst-backup-404-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
# Manifesto per annullare: questi file erano assenti prima dell'applicazione.
$updates | Select-Object Path | Export-Csv -LiteralPath (Join-Path $backup 'file-creati.csv') -NoTypeInformation -Encoding UTF8
foreach ($item in $updates) { [IO.File]::WriteAllText($item.Path, $item.Html, (New-Object Text.UTF8Encoding($false))) }
Write-Host "Creati $($updates.Count) reindirizzamenti. Manifesto: $backup"
