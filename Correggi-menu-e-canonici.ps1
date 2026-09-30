#requires -Version 5.1
<#
  Beneinst statico: sostituisce i link /index.php/... agli URL della sitemap
  e dichiara il canonical per pagine principali e copie accessibili.
  Senza -Apply crea solo il rapporto. Eseguire dopo WebCopy e genera-sitemap-beneinst.bat.
#>
[CmdletBinding()]
param([string]$Root = '', [switch]$Apply)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Split-Path -Parent $MyInvocation.MyCommand.Path }
$Root = (Resolve-Path -LiteralPath $Root.Trim().Trim('"')).Path.TrimEnd([char[]]'\/')
$base = 'https://beneinst.eu/'
$sitemapPath = Join-Path $Root 'sitemap.xml'
if (-not (Test-Path -LiteralPath $sitemapPath)) { throw 'Manca sitemap.xml: genera prima la sitemap.' }

[xml]$xml = [IO.File]::ReadAllText($sitemapPath)
$preferred = @{}
foreach ($node in $xml.GetElementsByTagName('loc')) {
    $url = $node.InnerText.Trim()
    if (-not $url.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) { continue }
    $relative = [Uri]::UnescapeDataString($url.Substring($base.Length))
    if ($relative -match '(?:^|/)\.\.(?:/|$)') { continue }
    $relative = $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)
    $file = if ($relative) { Join-Path $Root $relative } else { Join-Path $Root 'index.htm' }
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        if ($url -eq $base -and (Test-Path -LiteralPath (Join-Path $Root 'index.html'))) {
            $file = Join-Path $Root 'index.html'
        } else { throw "La sitemap elenca una pagina assente: $url" }
    }
    $preferred[$file.ToLowerInvariant()] = $url
}
if ($preferred.Count -lt 20) { throw 'La sitemap contiene troppo poche pagine: verificare prima di modificare i file.' }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$pageFiles = Get-ChildItem -LiteralPath $Root -Recurse -File |
    Where-Object { $_.Extension -match '(?i)^\.html?$' -and $_.FullName -notmatch '[\\/](?:\.git|\.github|node_modules|vendor)[\\/]' }
$contents = @{}
$ids = @{}
$duplicates = @{}
foreach ($file in $pageFiles) {
    $bytes = [IO.File]::ReadAllBytes($file.FullName)
    $bom = $bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191
    $body = if ($bom) { [Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3) } else { [Text.Encoding]::UTF8.GetString($bytes) }
    $key = $file.FullName.ToLowerInvariant()
    $contents[$key] = [pscustomobject]@{ Body = $body; Bom = $bom; Path = $file.FullName }
    if (-not $preferred.ContainsKey($key)) { continue }
    $article = [regex]::Match($body, 'com_content/article/(\d+)', 'IgnoreCase')
    if (-not $article.Success) { continue }
    $id = $article.Groups[1].Value
    if ($ids.ContainsKey($id) -and $ids[$id] -ne $preferred[$key]) { $duplicates[$id] = $true }
    else { $ids[$id] = $preferred[$key] }
}
foreach ($id in $duplicates.Keys) { $ids.Remove($id) }

$sectionRoutes = @{
    '/index.php/lettere-main.html' = 'lettere.html'
    '/index.php/sedetiam-main.html' = 'sed-etiam.html'
    '/index.php/diari-main.html' = 'diari.html'
    '/index.php/invia-a-sed-etiam.html' = 'invia-a-sed-etiam.html'
}
$unknown = @{}
$conflicts = New-Object System.Collections.Generic.List[string]
$details = New-Object System.Collections.Generic.List[string]
$changedFiles = 0; $changedLinks = 0; $newCanonicals = 0
$anchorPattern = '<a\b[^>]*>'
$hrefPattern = '\bhref\s*=\s*(["''])(?<url>.*?)\1'

foreach ($entry in $contents.Values) {
    $file = $entry.Path
    $key = $file.ToLowerInvariant()
    $body = $entry.Body
    $relative = $file.Substring($Root.Length).TrimStart([char[]]'\/').Replace('\', '/')
    $pageUrl = [Uri]::new($base + $relative)
    $script:linksHere = 0
    $updated = [regex]::Replace($body, $anchorPattern, [System.Text.RegularExpressions.MatchEvaluator]{
        param($tagMatch)
        $tag = $tagMatch.Value
        $href = [regex]::Match($tag, $hrefPattern, 'IgnoreCase')
        if (-not $href.Success) { return $tag }
        $old = [Net.WebUtility]::HtmlDecode($href.Groups['url'].Value)
        if ($old -notmatch '(?i)index\.php/') { return $tag }
        try { $destination = [Uri]::new($pageUrl, $old) } catch { return $tag }
        if ($destination.Host -ne 'beneinst.eu' -or $destination.AbsolutePath -notmatch '^/index\.php/') { return $tag }
        $route = [Uri]::UnescapeDataString($destination.AbsolutePath)
        if (-not $route.EndsWith('.html', [StringComparison]::OrdinalIgnoreCase)) { $route += '.html' }
        $target = $null
        if ($sectionRoutes.ContainsKey($route)) {
            $candidate = Join-Path $Root $sectionRoutes[$route]
            $candidateKey = $candidate.ToLowerInvariant()
            if ($preferred.ContainsKey($candidateKey)) { $target = $preferred[$candidateKey] }
        } else {
            $candidate = Join-Path $Root $route.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
            $candidateKey = $candidate.ToLowerInvariant()
            if ($contents.ContainsKey($candidateKey)) {
                $idMatch = [regex]::Match($contents[$candidateKey].Body, 'com_content/article/(\d+)', 'IgnoreCase')
                if ($idMatch.Success -and $ids.ContainsKey($idMatch.Groups[1].Value)) {
                    $target = $ids[$idMatch.Groups[1].Value]
                }
            }
        }
        if (-not $target) {
            if (-not $unknown.ContainsKey($route)) { $unknown[$route] = 0 }
            $unknown[$route]++
            return $tag
        }
        if ($destination.Fragment) { $target += $destination.Fragment }
        $replacement = 'href=' + $href.Groups[1].Value + $target + $href.Groups[1].Value
        $script:linksHere++
        return $tag.Substring(0, $href.Index) + $replacement + $tag.Substring($href.Index + $href.Length)
    }, 'IgnoreCase')

    $canonical = $null
    if ($preferred.ContainsKey($key)) { $canonical = $preferred[$key] }
    elseif ($relative -eq 'index.htm' -or $relative -eq 'index.html') { $canonical = $base }
    else {
        $article = [regex]::Match($body, 'com_content/article/(\d+)', 'IgnoreCase')
        if ($article.Success -and $ids.ContainsKey($article.Groups[1].Value)) { $canonical = $ids[$article.Groups[1].Value] }
        if (-not $canonical -and $sectionRoutes.ContainsKey('/' + $relative)) {
            $candidate = Join-Path $Root $sectionRoutes['/' + $relative]
            if ($preferred.ContainsKey($candidate.ToLowerInvariant())) { $canonical = $preferred[$candidate.ToLowerInvariant()] }
        }
    }
    $added = 0
    if ($canonical) {
        $existing = [regex]::Match($updated, '<link\b(?=[^>]*\brel\s*=\s*["'']canonical["''])[^>]*>', 'IgnoreCase')
        if ($existing.Success) {
            if ($existing.Value -notlike "*$canonical*") { $conflicts.Add($relative) }
        } else {
            $headEnd = [regex]::Match($updated, '</head\s*>', 'IgnoreCase')
            if ($headEnd.Success) {
                $updated = $updated.Insert($headEnd.Index, '  <link rel="canonical" href="' + $canonical + '">' + "`r`n")
                $added = 1
            }
        }
    }
    if (-not $script:linksHere -and -not $added) { continue }
    $changedFiles++; $changedLinks += $script:linksHere; $newCanonicals += $added
    $details.Add("$relative : $($script:linksHere) link; $added canonical")
    if ($Apply) {
        $encoding = if ($entry.Bom) { New-Object System.Text.UTF8Encoding($true) } else { $utf8NoBom }
        [IO.File]::WriteAllText($file, $updated, $encoding)
    }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('Beneinst - Menu e URL canonici')
$lines.Add('Modalita: ' + $(if ($Apply) { 'MODIFICA' } else { 'ANTEPRIMA' }))
$lines.Add("Pagine interessate: $changedFiles")
$lines.Add("Link /index.php/ sostituiti: $changedLinks")
$lines.Add("Tag canonical inseriti: $newCanonicals")
$lines.Add("Rotte irrisolte: $($unknown.Count); canonici preesistenti discordanti: $($conflicts.Count); ID ambigui: $($duplicates.Count)")
$lines.Add('')
foreach ($route in ($unknown.Keys | Sort-Object)) { $lines.Add("DA VERIFICARE: $route ($($unknown[$route]) link)") }
foreach ($path in $conflicts) { $lines.Add("CANONICAL PREESISTENTE: $path") }
foreach ($id in $duplicates.Keys) { $lines.Add("ID AMBIGUO: $id") }
$lines.Add('')
$lines.AddRange([string[]]$details.ToArray())
$reportPath = Join-Path $Root 'menu-canonici-report.txt'
[IO.File]::WriteAllLines($reportPath, [string[]]$lines.ToArray(), $utf8NoBom)
Write-Host ($lines | Select-Object -First 6 | Out-String)
Write-Host "Rapporto: $reportPath"
