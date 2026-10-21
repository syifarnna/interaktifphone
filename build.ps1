$ErrorActionPreference = 'Stop'

$cssDir = 'src\css'
$jsDir = 'src\js'
$template = 'src\template.html'
$output = 'index.html'

$cssFiles = Get-ChildItem $cssDir -Filter '*.css' | Sort-Object Name
$jsFiles = Get-ChildItem $jsDir -Filter '*.js' | Sort-Object Name

$cssContent = ($cssFiles | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"
$jsContent = ($jsFiles | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"

$html = Get-Content $template -Raw

$html = $html.Replace('__CSS__', $cssContent)
$html = $html.Replace('__JS__', $jsContent)

$assetsDir = 'assets'
$imgTokens = @{
  '__IMG_WALL_LOCK__' = 'lock-screen.jpg'
  '__IMG_WALL_HOME__' = 'home-screen.jpg'
  '__IMG_CHATBG__' = 'walpaper chat.jpg'
  '__IMG_JO__' = 'jo.jpg.jpg'
  '__IMG_SHEIN__' = 'shein.jpg.jpg'
  '__IMG_DINDA__' = 'dinda.jpg.jpg'
  '__IMG_BAYU__' = 'bayu.jpg.jpg'
  '__IMG_JO_CALL__' = 'jo-call.jpg'
  '__IMG_G1__' = 'galeri 1.jpg'
  '__IMG_G2__' = 'galeri 2.jpg'
  '__IMG_G3__' = 'galeri 3.jpg'
  '__IMG_G4__' = 'galeri 4.jpg'
  '__IMG_G5__' = 'galeri 5.jpg'
  '__IMG_G6__' = 'galeri 6.jpg'
  '__IMG_G7__' = 'galeri 7.jpg'
  '__IMG_G8__' = 'galeri 8.jpg'
  '__IMG_G9__' = 'galeri 9.jpg'
}

foreach ($token in $imgTokens.Keys) {
  $filename = $imgTokens[$token]
  $filepath = Join-Path $assetsDir $filename
  if (Test-Path $filepath) {
    $bytes = [System.IO.File]::ReadAllBytes($filepath)
    $base64 = [Convert]::ToBase64String($bytes)
    $ext = [System.IO.Path]::GetExtension($filename).ToLower()
    $mime = if ($ext -eq '.jpg') { 'image/jpeg' } elseif ($ext -eq '.png') { 'image/png' } else { 'image/jpeg' }
    $dataUri = "data:$mime;base64,$base64"
    $html = $html.Replace($token, $dataUri)
  } else {
    Write-Warning "Asset not found: $filepath"
    $html = $html.Replace($token, '')
  }
}

[System.IO.File]::WriteAllText($output, $html, [System.Text.UTF8Encoding]::new($false))
Write-Host "Build complete: $output"
