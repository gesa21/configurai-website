# Simple static file server for ConfigurAI website
$port = 3200
$root = $PSScriptRoot

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff2'= 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/"

while ($listener.IsListening) {
  $ctx  = $listener.GetContext()
  $req  = $ctx.Request
  $resp = $ctx.Response

  $urlPath = $req.Url.LocalPath
  if ($urlPath -eq '/' -or $urlPath -eq '') { $urlPath = '/index.html' }

  $filePath = Join-Path $root $urlPath.TrimStart('/')

  if (Test-Path $filePath -PathType Leaf) {
    $ext  = [System.IO.Path]::GetExtension($filePath).ToLower()
    $ct   = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $resp.ContentType   = $ct
    $resp.ContentLength64 = $bytes.Length
    $resp.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $resp.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
    $resp.OutputStream.Write($msg, 0, $msg.Length)
  }
  $resp.OutputStream.Close()
}
