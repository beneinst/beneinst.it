#requires -Version 5.1
<#
  Corregge i link degli indici delle raccolte nelle pagine gia esportate da WebCopy.
  Per impostazione predefinita produce solo un'anteprima. Con -Apply modifica i file.
  Eseguire dalla cartella principale del repository, prima di generare sitemap.xml.
#>
[CmdletBinding()]
param(
    [string]$Root = '',
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$Root = (Resolve-Path -LiteralPath $Root).Path
$csvPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'Indice_opere_condivise_URL_corretti.csv'
if (-not (Test-Path -LiteralPath $csvPath)) {
    throw "Manca il file di mappatura: $csvPath"
}

$siteBase = 'https://beneinst.eu/'
$targetById = @{}
foreach ($row in (Import-Csv -LiteralPath $csvPath -Delimiter ';' -Encoding UTF8)) {
    $id = $row.'ID Joomla'
    $url = $row.'URL definitivo proposto'
    if ([string]::IsNullOrWhiteSpace($url)) { continue }
    if (-not $url.StartsWith($siteBase, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "URL fuori dal sito per l'articolo $id`: $url"
    }
    $relative = [Uri]::UnescapeDataString($url.Substring($siteBase.Length)).Replace('/', [IO.Path]::DirectorySeparatorChar)
    if ($relative.Contains('..') -or $relative.Contains('?') -or $relative.Contains('#')) {
        throw "Percorso non valido per l'articolo $id`: $relative"
    }
    $target = Join-Path $Root $relative
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
        throw "La pagina dell'articolo $id non esiste nell'esportazione: $target"
    }
    $targetById[$id] = $url
}

$tagPattern = '<a\b(?=[^>]*\bbeneinst-collection-index__link\b)[^>]*>'
$hrefPattern = '\bhref\s*=\s*(["''])(?<url>.*?)\1'
$idPattern = '(?:[?&]|&amp;)id=(?<id>\d+)(?=[:&#]|$)'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$changedFiles = 0
$changedLinks = 0
$unresolved = @{}
$details = New-Object System.Collections.Generic.List[string]

$pages = Get-ChildItem -LiteralPath $Root -Recurse -File |
    Where-Object { $_.Extension -match '(?i)^\.html?$' -and $_.FullName -notmatch '[\\/](?:\.git|\.github|node_modules|vendor)[\\/]' }

foreach ($page in $pages) {
    $bytes = [IO.File]::ReadAllBytes($page.FullName)
    $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191
    $original = if ($hasBom) {
        [Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    } else {
        [Text.Encoding]::UTF8.GetString($bytes)
    }
    if ($original.IndexOf('beneinst-collection-index__link', [StringComparison]::Ordinal) -lt 0) { continue }
    $script:linksInFile = 0
    $updated = [regex]::Replace($original, $tagPattern, [System.Text.RegularExpressions.MatchEvaluator]{
        param($tagMatch)
        $tag = $tagMatch.Value
        $href = [regex]::Match($tag, $hrefPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if (-not $href.Success) { return $tag }
        $oldUrl = [Net.WebUtility]::HtmlDecode($href.Groups['url'].Value)
        if ($oldUrl -notmatch '(?i)index\.php(?:-\d+)?(?:\.html?)?\??') { return $tag }
        $article = [regex]::Match($oldUrl, $idPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if (-not $article.Success) { return $tag }
        $id = $article.Groups['id'].Value
        if (-not $targetById.ContainsKey($id)) {
            if (-not $unresolved.ContainsKey($id)) { $unresolved[$id] = 0 }
            $unresolved[$id]++
            return $tag
        }
        $url = $targetById[$id]
        $replacement = 'href=' + $href.Groups[1].Value + $url + $href.Groups[1].Value
        $script:linksInFile++
        return $tag.Substring(0, $href.Index) + $replacement + $tag.Substring($href.Index + $href.Length)
    }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($script:linksInFile -eq 0) { continue }
    $changedFiles++
    $changedLinks += $script:linksInFile
    $relative = $page.FullName.Substring($Root.Length).TrimStart([char[]]'\/')
    $details.Add("$relative : $($script:linksInFile) link")
    if ($Apply) {
        $encoding = if ($hasBom) { New-Object System.Text.UTF8Encoding($true) } else { $utf8NoBom }
        [IO.File]::WriteAllText($page.FullName, $updated, $encoding)
    }
}

$report = New-Object System.Collections.Generic.List[string]
$report.Add('Beneinst - Correzione degli indici delle raccolte')
$report.Add('Modalita: ' + $(if ($Apply) { 'MODIFICA' } else { 'ANTEPRIMA, nessun file modificato' }))
$report.Add("Pagine interessate: $changedFiles")
$report.Add("Link da sostituire: $changedLinks")
$report.Add('ID senza pagina pulita: ' + $(if ($unresolved.Count) { (($unresolved.Keys | Sort-Object {[int]$_}) -join ', ') } else { 'nessuno' }))
$report.Add('')
$report.AddRange([string[]]$details.ToArray())
$reportPath = Join-Path $Root 'indici-opere-report.txt'
[IO.File]::WriteAllLines($reportPath, [string[]]$report.ToArray(), $utf8NoBom)
Write-Host ($report | Select-Object -First 5 | Out-String)
Write-Host "Rapporto: $reportPath"
if (-not $Apply) { Write-Host 'Per eseguire le modifiche, avviare il file .bat incluso.' }
