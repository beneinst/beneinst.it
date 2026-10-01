#requires -Version 5.1
$script:BeneinstBase = 'https://beneinst.eu/'
$script:BeneinstUtf8 = New-Object System.Text.UTF8Encoding($false)

function Get-BeneinstRoot([string]$Root, [string]$ScriptFolder) {
    if ([string]::IsNullOrWhiteSpace($Root)) { $Root = $ScriptFolder }
    $Root = $Root.Trim().Trim('"')
    $resolved = (Resolve-Path -LiteralPath $Root -ErrorAction Stop).Path.TrimEnd([char[]]'\/')
    if (-not (Test-Path -LiteralPath (Join-Path $resolved 'sitemap.xml') -PathType Leaf)) {
        throw "Manca sitemap.xml nella cartella $resolved"
    }
    return $resolved
}

function Get-BeneinstId([string]$Html) {
    $match = [regex]::Match($Html, 'com_content/article/(\d+)\b', 'IgnoreCase')
    if ($match.Success) { return $match.Groups[1].Value }
    return ''
}

function Get-BeneinstHtml([string]$Path) {
    return [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
}

function Get-BeneinstRedirect([string]$Destination) {
    $encoded = [Net.WebUtility]::HtmlEncode($Destination)
    $jsUrl = ConvertTo-Json -InputObject $Destination -Compress
    return @"
<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Pagina trasferita | Beneinst</title>
<meta http-equiv="refresh" content="0; url=$encoded">
<link rel="canonical" href="$encoded">
<script>window.location.replace($jsUrl);</script>
</head>
<body><p>Questa pagina è stata trasferita: <a href="$encoded">apri l'opera su Beneinst</a>.</p></body>
</html>
"@
}

function Get-BeneinstCanonicalUpdate([string]$Html, [string]$Destination) {
    $match = [regex]::Match($Html, '<link\b(?=[^>]*\brel\s*=\s*["'']canonical["''])[^>]*>', 'IgnoreCase')
    if ($match.Success) {
        $href = [regex]::Match($match.Value, '\bhref\s*=\s*["''](?<url>[^"'']+)["'']', 'IgnoreCase')
        if ($href.Success -and [Net.WebUtility]::HtmlDecode($href.Groups['url'].Value) -eq $Destination) { return $Html }
        throw "Canonical preesistente discordante: $($match.Value)"
    }
    $head = [regex]::Match($Html, '<head\b[^>]*>', 'IgnoreCase')
    if (-not $head.Success) { throw 'Manca il tag <head>.' }
    $tag = '<link rel="canonical" href="' + [Net.WebUtility]::HtmlEncode($Destination) + '">' + "`n"
    return $Html.Insert($head.Index + $head.Length, "`n" + $tag)
}

function Save-BeneinstFile([string]$Path, [string]$Html, [string]$Root, [string]$BackupRoot) {
    $relative = $Path.Substring($Root.Length).TrimStart([char[]]'\/')
    $backup = Join-Path $BackupRoot $relative
    $parent = Split-Path -Parent $backup
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $backup)) { Copy-Item -LiteralPath $Path -Destination $backup }
    [IO.File]::WriteAllText($Path, $Html, $script:BeneinstUtf8)
}

function Get-BeneinstSitemap([string]$Root) {
    [xml]$xml = Get-BeneinstHtml (Join-Path $Root 'sitemap.xml')
    $result = @()
    foreach ($node in $xml.GetElementsByTagName('loc')) {
        $url = $node.InnerText.Trim()
        if (-not $url.StartsWith($script:BeneinstBase, [StringComparison]::OrdinalIgnoreCase)) { continue }
        $relative = [Uri]::UnescapeDataString($url.Substring($script:BeneinstBase.Length))
        if ($relative -match '(^|/)\.\.(/|$)' -or $relative.Contains('?')) { continue }
        if ($relative -eq '') { $relative = 'index.html' }
        $file = Join-Path $Root $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)
        $result += [pscustomobject]@{ Url = $url; Relative = $relative; Path = $file }
    }
    if ($result.Count -lt 20) { throw 'La sitemap contiene troppo poche pagine: controllarla prima di procedere.' }
    return $result
}
