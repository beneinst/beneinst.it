#requires -Version 5.1

<#
  BENEINST.EU - GENERATORE SITEMAP PER SITO STATICO

  Collocare questo file nella cartella principale del repository,
  accanto a genera-sitemap-beneinst.bat.

  Lo script:
  - analizza ricorsivamente i file HTML del sito statico;
  - esclude pagine tecniche, noindex e cartelle non pubbliche;
  - usa l'URL canonical quando valido, altrimenti il percorso del file;
  - elimina duplicati, query string, frammenti e riferimenti locali;
  - genera sitemap.xml in UTF-8 senza BOM;
  - omette lastmod: la data del file esportato non prova una modifica del contenuto;
  - verifica/aggiorna robots.txt;
  - crea sitemap-report.txt con il risultato dell'analisi.
#>

[CmdletBinding()]
param(
    [string]$Root = '',
    [string]$BaseUrl = 'https://beneinst.eu'
)

$ErrorActionPreference = 'Stop'

# In alcune installazioni di Windows PowerShell 5.1, $PSScriptRoot puo
# risultare vuoto quando viene usato direttamente come valore predefinito
# di un parametro. Determiniamo quindi la cartella dopo l'avvio.
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
}

if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Get-Location).Path
}

function Write-Section {
    param([string]$Text)
    Write-Host ''
    Write-Host $Text -ForegroundColor Cyan
}

function Get-RelativePath {
    param(
        [string]$BasePath,
        [string]$FullPath
    )

    $base = $BasePath.TrimEnd([char[]]'\/')
    if ($FullPath.Length -le $base.Length) {
        return ''
    }

    return $FullPath.Substring($base.Length).TrimStart([char[]]'\/').Replace('\', '/')
}

function Get-CanonicalUrl {
    param([string]$Html)

    $linkTags = [regex]::Matches(
        $Html,
        '<link\b[^>]*>',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    foreach ($match in $linkTags) {
        $tag = $match.Value
        if ($tag -notmatch '(?i)\brel\s*=\s*["''][^"'']*\bcanonical\b[^"'']*["'']') {
            continue
        }

        $href = [regex]::Match($tag, '(?i)\bhref\s*=\s*["'']([^"'']+)["'']')
        if ($href.Success) {
            return [System.Net.WebUtility]::HtmlDecode($href.Groups[1].Value.Trim())
        }
    }

    return $null
}

function Get-StructuredPageUrl {
    param([string]$Html)

    # Joomla inserisce normalmente l'URL pubblico anche nei dati JSON-LD.
    # La ricerca e limitata al blocco WebPage per non confonderlo con link
    # dell'organizzazione, immagini o contenuti correlati.
    $match = [regex]::Match(
        $Html,
        '(?is)"@type"\s*:\s*"WebPage".{0,2500}?"url"\s*:\s*"([^"]+)"'
    )

    if (-not $match.Success) {
        return $null
    }

    $value = $match.Groups[1].Value
    $value = $value.Replace('\/', '/')
    $value = [regex]::Replace(
        $value,
        '\\u([0-9a-fA-F]{4})',
        { param($m) [char]([Convert]::ToInt32($m.Groups[1].Value, 16)) }
    )

    return [System.Net.WebUtility]::HtmlDecode($value.Trim())
}

function Get-JoomlaArticleId {
    param([string]$Html)

    $match = [regex]::Match(
        $Html,
        '(?i)com_content/article/(\d+)'
    )

    if ($match.Success) {
        return $match.Groups[1].Value
    }

    return $null
}

function Test-NoIndex {
    param([string]$Html)

    $metaTags = [regex]::Matches(
        $Html,
        '<meta\b[^>]*>',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    foreach ($match in $metaTags) {
        $tag = $match.Value
        $isRobots =
            $tag -match '(?i)\bname\s*=\s*["''](?:robots|googlebot)["'']'
        $hasNoIndex =
            $tag -match '(?i)\bcontent\s*=\s*["''][^"'']*\bnoindex\b[^"'']*["'']'

        if ($isRobots -and $hasNoIndex) {
            return $true
        }
    }

    return $false
}

function Convert-FileToUrl {
    param(
        [string]$RelativePath,
        [string]$SiteBase
    )

    $path = $RelativePath.Replace('\', '/').TrimStart('/')
    if ($path -match '(?i)^(?:index\.html?|index\.php\.html)$') {
        return "$SiteBase/"
    }

    # EscapeUriString conserva le barre e codifica spazi e caratteri speciali.
    $escapedPath = [Uri]::EscapeUriString($path)
    return "$SiteBase/$escapedPath"
}

function Normalize-SitemapUrl {
    param(
        [string]$Candidate,
        [string]$SiteBase
    )

    if ([string]::IsNullOrWhiteSpace($Candidate)) {
        return $null
    }

    $candidateValue = [System.Net.WebUtility]::HtmlDecode($Candidate.Trim())

    try {
        $baseUri = [Uri]("$SiteBase/")
        $uri = New-Object Uri($baseUri, $candidateValue)
    }
    catch {
        return $null
    }

    if ($uri.Scheme -ne 'https' -or $uri.Host -ne ([Uri]$SiteBase).Host) {
        return $null
    }

    $builder = New-Object System.UriBuilder($uri)
    $builder.Scheme = 'https'
    $builder.Port = -1
    $builder.Query = ''
    $builder.Fragment = ''

    $url = $builder.Uri.AbsoluteUri
    if ($builder.Uri.AbsolutePath -eq '/') {
        return "$SiteBase/"
    }

    return $url.TrimEnd('/')
}

try {
    Write-Section 'Beneinst - Generazione sitemap'

    $rootCandidate = $Root.Trim().Trim('"').TrimEnd([char[]]'\/')
    $resolvedRoot = (Resolve-Path -LiteralPath $rootCandidate).Path.TrimEnd([char[]]'\/')
    $BaseUrl = $BaseUrl.Trim().TrimEnd('/')

    Write-Host "Cartella analizzata: $resolvedRoot"
    Write-Host "Dominio pubblico:    $BaseUrl"

    # Cartelle mai destinate all'indicizzazione.
    $excludedDirectories = @(
        '.git', '.github', '.idea', '.vscode',
        'administrator', 'cache', 'cli', 'installation', 'logs', 'tmp',
        'node_modules', 'vendor', 'backup', 'backups'
    )

    # File tecnici da non inserire. Aggiungere qui altri nomi, se necessario.
    $excludedFileNames = @(
        '404.html', '404.htm',
        'error.html', 'error.htm',
        'offline.html', 'offline.htm',
        'index.php.html',
        'home-2.html',
        'autore-2.html',
        'diari-2.html',
        'ebook-gratis.html',
        'e-book-gratis-2.html',
        'lettere-4.html',
        'sed-etiam-2.html',
        'sedetiam-main.html',
        'opere-poesie-menu.html',
        'anteprime-audio.html',
        'archivio-ipfs.html'
    )

    # Percorsi pubblici da escludere manualmente. Usare URL relativi con "/".
    # Esempio: 'pagina-obsoleta.html', 'cartella/prova.html'
    $manualExclusions = @()

    $included = New-Object System.Collections.Generic.List[object]
    $excluded = New-Object System.Collections.Generic.List[object]
    $seenUrls = @{}
    $seenArticleIds = @{}

    $htmlFiles = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File |
        Where-Object { $_.Extension -match '(?i)^\.html?$' } |
        Sort-Object @{
            Expression = {
                $sortPath = Get-RelativePath -BasePath $resolvedRoot -FullPath $_.FullName

                # In caso di copie dello stesso articolo, preferisce i nuovi
                # percorsi semantici e i titoli italiani aggiornati.
                if ($sortPath -match '(?i)^opere-(?:poesie|lettere)-menu/') {
                    return 0
                }
                if ($sortPath -match '(?i)^(?:la-burocrazia-del-linguaggio|un-alloggio-per-l.anima)\.html?$') {
                    return 1
                }
                return 10
            }
        }, FullName

    foreach ($file in $htmlFiles) {
        $relativePath = Get-RelativePath -BasePath $resolvedRoot -FullPath $file.FullName
        $segments = $relativePath -split '/'
        $blockedDirectory = $false

        # WebCopy puo salvare le rotte dinamiche di Joomla come una cartella
        # index.php/ oppure come index.php-1.html, index.php-2.html, ecc.
        # Sono copie tecniche e non URL pubblici da proporre ai motori.
        if (
            $relativePath -match '(?i)^index\.php/' -or
            $relativePath -match '(?i)^index\.php-\d+\.html?$' -or
			$relativePath -match '(?i)^di-[^/]+-\d+\.html?$' -or
            $relativePath -match '(?i)^opere-poesie-menu-\d+\.html?$' -or
            $relativePath -match '(?i)^(?:la-burocrazia-del-linguaggio|un-alloggio-per-l.anima)-\d+\.html?$'
        ) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = 'Copia tecnica di una rotta Joomla index.php'
            })
            continue
        }

        foreach ($segment in $segments) {
            if ($excludedDirectories -contains $segment.ToLowerInvariant()) {
                $blockedDirectory = $true
                break
            }
        }

        if ($blockedDirectory) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = 'Cartella tecnica esclusa'
            })
            continue
        }

        if ($excludedFileNames -contains $file.Name.ToLowerInvariant()) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = 'File tecnico escluso'
            })
            continue
        }

        if ($manualExclusions -contains $relativePath) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = 'Esclusione manuale'
            })
            continue
        }

        $html = [System.IO.File]::ReadAllText($file.FullName)

        if (Test-NoIndex -Html $html) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = 'Meta robots noindex'
            })
            continue
        }

        $articleId = Get-JoomlaArticleId -Html $html

        if ($articleId -and $seenArticleIds.ContainsKey($articleId)) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = "Copia dell'articolo Joomla ID $articleId gia presente in $($seenArticleIds[$articleId])"
            })
            continue
        }

        # Nel sito prodotto da WebCopy i dati strutturati possono conservare
        # l'URL della pagina dalla quale e iniziata la navigazione. Per evitare
        # falsi duplicati, l'URL pubblico deriva sempre dal percorso statico.
        $candidateUrl = Convert-FileToUrl -RelativePath $relativePath -SiteBase $BaseUrl
        $candidateUrl = Normalize-SitemapUrl -Candidate $candidateUrl -SiteBase $BaseUrl
        $source = 'percorso file statico'

        if (-not $candidateUrl) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = 'Impossibile creare un URL pubblico valido'
            })
            continue
        }

        $urlKey = $candidateUrl.ToLowerInvariant()
        if ($seenUrls.ContainsKey($urlKey)) {
            $excluded.Add([pscustomobject]@{
                File = $relativePath
                Reason = "URL duplicato di $($seenUrls[$urlKey])"
            })
            continue
        }

        $seenUrls[$urlKey] = $relativePath
        if ($articleId) {
            $seenArticleIds[$articleId] = $relativePath
        }
        $included.Add([pscustomobject]@{
            Url = $candidateUrl
            File = $relativePath
            Source = $source
        })
    }

    $orderedUrls = $included | Sort-Object @{ Expression = { if ($_.Url -eq "$BaseUrl/") { 0 } else { 1 } } }, Url

    $sitemapPath = Join-Path $resolvedRoot 'sitemap.xml'
    $settings = New-Object System.Xml.XmlWriterSettings
    $settings.Indent = $true
    $settings.IndentChars = '  '
    $settings.Encoding = New-Object System.Text.UTF8Encoding($false)

    $writer = [System.Xml.XmlWriter]::Create($sitemapPath, $settings)
    try {
        $writer.WriteStartDocument()
        $writer.WriteStartElement('urlset', 'http://www.sitemaps.org/schemas/sitemap/0.9')

        foreach ($entry in $orderedUrls) {
            $writer.WriteStartElement('url')
            $writer.WriteElementString('loc', $entry.Url)
            $writer.WriteEndElement()
        }

        $writer.WriteEndElement()
        $writer.WriteEndDocument()
    }
    finally {
        $writer.Dispose()
    }

    # Verifica che l'XML appena prodotto sia ben formato.
    [xml](Get-Content -LiteralPath $sitemapPath -Raw) | Out-Null

    $robotsPath = Join-Path $resolvedRoot 'robots.txt'
    $sitemapDirective = "Sitemap: $BaseUrl/sitemap.xml"

    if (Test-Path -LiteralPath $robotsPath) {
        $robots = [System.IO.File]::ReadAllText($robotsPath)
        if ($robots -match '(?im)^\s*Sitemap\s*:') {
            $robots = [regex]::Replace(
                $robots,
                '(?im)^\s*Sitemap\s*:.*$',
                $sitemapDirective
            )
        }
        else {
            $robots = $robots.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $sitemapDirective + [Environment]::NewLine
        }
    }
    else {
        $robots = "User-agent: *`r`nAllow: /`r`n`r`n$sitemapDirective`r`n"
    }

    [System.IO.File]::WriteAllText(
        $robotsPath,
        $robots,
        (New-Object System.Text.UTF8Encoding($false))
    )

    $reportPath = Join-Path $resolvedRoot 'sitemap-report.txt'
    $report = New-Object System.Collections.Generic.List[string]
    $report.Add('BENEINST.EU - RAPPORTO GENERAZIONE SITEMAP')
    $report.Add(('Generato: {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')))
    $report.Add("Cartella: $resolvedRoot")
    $report.Add("URL inclusi: $($orderedUrls.Count)")
    $report.Add("File esclusi: $($excluded.Count)")
    $report.Add('')
    $report.Add('URL INCLUSI')
    $report.Add('============')

    foreach ($entry in $orderedUrls) {
        $report.Add("$($entry.Url) | $($entry.File) | $($entry.Source)")
    }

    $report.Add('')
    $report.Add('FILE ESCLUSI')
    $report.Add('=============')

    if ($excluded.Count -eq 0) {
        $report.Add('Nessuno.')
    }
    else {
        foreach ($entry in ($excluded | Sort-Object File)) {
            $report.Add("$($entry.File) | $($entry.Reason)")
        }
    }

    [System.IO.File]::WriteAllLines(
        $reportPath,
        $report,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Section 'Operazione completata'
    Write-Host "URL inseriti:  $($orderedUrls.Count)" -ForegroundColor Green
    Write-Host "File esclusi:  $($excluded.Count)" -ForegroundColor Yellow
    Write-Host "Sitemap:       $sitemapPath"
    Write-Host "Rapporto:      $reportPath"
    Write-Host "Robots:        $robotsPath"
    exit 0
}
catch {
    Write-Host ''
    Write-Host 'ERRORE: la sitemap non e stata generata.' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ''
    Write-Host 'Dettagli:' -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace
    exit 1
}
