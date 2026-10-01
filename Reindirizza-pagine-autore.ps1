#requires -Version 5.1
[CmdletBinding()]
param([string]$Root = '', [switch]$Apply)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Funzioni-pulizia-beneinst.ps1')
$Root = Get-BeneinstRoot $Root $PSScriptRoot
$mapFile = Join-Path $PSScriptRoot 'Mappa-42-pagine-autore.csv'
if (-not (Test-Path -LiteralPath $mapFile)) { throw 'Manca Mappa-42-pagine-autore.csv.' }
$rows = @(Import-Csv -LiteralPath $mapFile -Encoding UTF8)
if ($rows.Count -ne 42) { throw "Attese 42 righe nella mappa, trovate $($rows.Count)." }
$site = Get-BeneinstSitemap $Root
$sitemapUrls = @{}
foreach ($p in $site) { $sitemapUrls[$p.Url.ToLowerInvariant()] = $true }
$results = @()
$updates = @()
$seen = @{}
foreach ($row in $rows) {
    $old = [string]$row.Vecchio; $new = [string]$row.Nuovo; $expectedId = [string]$row.ID
    if ($old -notmatch '^di-[a-z0-9-]+-\d+\.html$' -or $new -notmatch '^opere-(lettere|poesie)-menu/[a-z0-9,\-]+\.html$' -or $expectedId -notmatch '^\d+$') {
        throw "Riga della mappa non valida: $old -> $new"
    }
    if ($seen.ContainsKey($old.ToLowerInvariant())) { throw "Vecchio URL duplicato nella mappa: $old" }
    $seen[$old.ToLowerInvariant()] = $true
    $oldPath = Join-Path $Root $old
    $newPath = Join-Path $Root $new.Replace('/', [IO.Path]::DirectorySeparatorChar)
    $newUrl = $script:BeneinstBase + $new
    $status = 'PRONTO'; $note = ''
    $oldHtml = ''; $newHtml = ''; $canonicalHtml = ''
    if (-not (Test-Path -LiteralPath $oldPath -PathType Leaf)) { $status='SALTA'; $note='Vecchio file assente' }
    elseif (-not (Test-Path -LiteralPath $newPath -PathType Leaf)) { $status='SALTA'; $note='Nuova pagina assente' }
    elseif ($sitemapUrls.ContainsKey(($script:BeneinstBase + $old).ToLowerInvariant())) { $status='SALTA'; $note='Vecchio URL ancora nella sitemap' }
    elseif (-not $sitemapUrls.ContainsKey($newUrl.ToLowerInvariant())) { $status='SALTA'; $note='Nuova pagina assente dalla sitemap' }
    else {
        $oldHtml = Get-BeneinstHtml $oldPath
        $newHtml = Get-BeneinstHtml $newPath
        if ($oldHtml.Contains('<title>Pagina trasferita | Beneinst</title>') -and $oldHtml.Contains($newUrl)) {
            $status='GIA_REINDIRIZZATO'; $note='Nessuna modifica richiesta'
        } elseif ((Get-BeneinstId $oldHtml) -ne $expectedId -or (Get-BeneinstId $newHtml) -ne $expectedId) {
            $status='SALTA'; $note="ID articolo diverso da $expectedId (vecchio $(Get-BeneinstId $oldHtml), nuovo $(Get-BeneinstId $newHtml))"
        } else {
            try { $canonicalHtml = Get-BeneinstCanonicalUpdate $newHtml $newUrl }
            catch { $status='SALTA'; $note=$_.Exception.Message }
        }
    }
    $results += [pscustomobject]@{ Stato=$status; Vecchio=$old; Nuovo=$new; ID=$expectedId; Nota=$note }
    if ($status -eq 'PRONTO') {
        $updates += [pscustomobject]@{ OldPath=$oldPath; NewPath=$newPath; NewUrl=$newUrl; NewHtml=$canonicalHtml; AddCanonical=($canonicalHtml -cne $newHtml) }
    }
}
$report = Join-Path $Root 'report-reindirizzamenti-autore.csv'
$results | Export-Csv -LiteralPath $report -Encoding UTF8 -NoTypeInformation -Delimiter ';'
$ready = @($results | Where-Object Stato -eq 'PRONTO').Count
$skipped = @($results | Where-Object Stato -eq 'SALTA').Count
$done = @($results | Where-Object Stato -eq 'GIA_REINDIRIZZATO').Count
Write-Host "Pagine autore: $ready pronte; $done gia reindirizzate; $skipped da controllare. Rapporto: $report"
if (-not $Apply) { Write-Host 'Anteprima: nessuna pagina modificata.'; return }
if ($skipped -gt 0) { throw 'Modifica interrotta: risolvere le righe SALTA del rapporto prima di applicare.' }
$backupRoot = Join-Path (Split-Path -Parent $Root) ('beneinst-backup-url-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
foreach ($item in $updates) {
    if ($item.AddCanonical) { Save-BeneinstFile $item.NewPath $item.NewHtml $Root $backupRoot }
    Save-BeneinstFile $item.OldPath (Get-BeneinstRedirect $item.NewUrl) $Root $backupRoot
}
Write-Host "Applicati $($updates.Count) reindirizzamenti. Backup: $backupRoot"
