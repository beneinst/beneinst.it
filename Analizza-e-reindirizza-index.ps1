#requires -Version 5.1
[CmdletBinding()]
param([string]$Root = '', [switch]$Apply)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Funzioni-pulizia-beneinst.ps1')
$Root = Get-BeneinstRoot $Root $PSScriptRoot
$sitemap = Get-BeneinstSitemap $Root
$idToPage = @{}
foreach ($item in $sitemap) {
    if (-not (Test-Path -LiteralPath $item.Path -PathType Leaf)) { continue }
    $id = Get-BeneinstId (Get-BeneinstHtml $item.Path)
    if (-not $id) { continue }
    if (-not $idToPage.ContainsKey($id)) { $idToPage[$id] = @() }
    $idToPage[$id] += $item
}
$indexPages = @(Get-ChildItem -LiteralPath $Root -File | Where-Object { $_.Name -match '^index\.php-\d+\.html$' } | Sort-Object Name)
if ($indexPages.Count -eq 0) { throw 'Nessun file index.php-N.html nella radice.' }
$reportRows = @(); $updates = @()
foreach ($page in $indexPages) {
    $html = Get-BeneinstHtml $page.FullName
    $id = Get-BeneinstId $html
    $status = 'PRONTO'; $note = ''; $destination = ''; $target = $null; $canonicalHtml = ''
    if ($html.Contains('<title>Pagina trasferita | Beneinst</title>')) {
        $status='GIA_REINDIRIZZATO'; $note='Controllare manualmente la destinazione esistente'
    } elseif (-not $id) { $status='SALTA'; $note='ID articolo non trovato' }
    elseif (-not $idToPage.ContainsKey($id)) { $status='SALTA'; $note='ID assente dalla sitemap' }
    elseif ($idToPage[$id].Count -ne 1) { $status='SALTA'; $note='ID con piu destinazioni nella sitemap' }
    else {
        $target = $idToPage[$id][0]
        $destination = $target.Url
        if ($target.Relative -match '^index\.php-\d+\.html$' -or $target.Path -eq $page.FullName) {
            $status='SALTA'; $note='La sitemap rimanda a un file tecnico o a se stesso'
        } else {
            $destHtml = Get-BeneinstHtml $target.Path
            try { $canonicalHtml = Get-BeneinstCanonicalUpdate $destHtml $destination }
            catch { $status='SALTA'; $note=$_.Exception.Message }
            if ($status -eq 'PRONTO') {
                $updates += [pscustomobject]@{ OldPath=$page.FullName; NewPath=$target.Path; NewUrl=$destination; NewHtml=$canonicalHtml; AddCanonical=($canonicalHtml -cne $destHtml) }
            }
        }
    }
    $reportRows += [pscustomobject]@{ Stato=$status; File=$page.Name; ID=$id; Destinazione=$destination; Nota=$note }
}
$report = Join-Path $Root 'report-file-index.csv'
$reportRows | Export-Csv -LiteralPath $report -Encoding UTF8 -NoTypeInformation -Delimiter ';'
$ready = @($reportRows | Where-Object Stato -eq 'PRONTO').Count
$skipped = @($reportRows | Where-Object Stato -eq 'SALTA').Count
$done = @($reportRows | Where-Object Stato -eq 'GIA_REINDIRIZZATO').Count
Write-Host "File index: $($indexPages.Count); $ready pronti; $done gia reindirizzati; $skipped da controllare. Rapporto: $report"
if (-not $Apply) { Write-Host 'Anteprima: nessuna pagina modificata.'; return }
if ($skipped -gt 0) { Write-Warning "$skipped file non saranno modificati: controllare le righe SALTA del rapporto." }
$backupRoot = Join-Path (Split-Path -Parent $Root) ('beneinst-backup-url-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
foreach ($item in $updates) {
    if ($item.AddCanonical) { Save-BeneinstFile $item.NewPath $item.NewHtml $Root $backupRoot }
    Save-BeneinstFile $item.OldPath (Get-BeneinstRedirect $item.NewUrl) $Root $backupRoot
}
Write-Host "Applicati $($updates.Count) reindirizzamenti index. Backup: $backupRoot"
