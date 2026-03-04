param(
  [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
if (-not $root -or [string]::IsNullOrWhiteSpace($root)) {
  $root = (Get-Location).Path
}
$prefix = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Clear()
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Preview URL: $prefix"

function Get-ContentType($path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.js'   { 'application/javascript; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.svg'  { 'image/svg+xml' }
    '.png'  { 'image/png' }
    '.jpg'  { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.ico'  { 'image/x-icon' }
    default { 'application/octet-stream' }
  }
}

function Send-Bytes($ctx, [byte[]]$bytes, $contentType='application/octet-stream', $status=200) {
  $ctx.Response.StatusCode = $status
  $ctx.Response.ContentType = $contentType
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.OutputStream.Flush()
  $ctx.Response.Close()
}

function Send-Text($ctx, $text, $contentType='text/plain; charset=utf-8', $status=200) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  Send-Bytes $ctx $bytes $contentType $status
}

while ($true) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.AbsolutePath
  if ([string]::IsNullOrWhiteSpace($path) -or $path -eq '/') { $path = '/index.html' }
  if ($path -eq '/admin') { $path = '/admin.html' }
  $fsPath = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))
  if (-Not (Test-Path -LiteralPath $fsPath)) {
    Send-Text $ctx 'Not Found' 'text/plain; charset=utf-8' 404
    continue
  }
  try {
    $bytes = [System.IO.File]::ReadAllBytes($fsPath)
    $ct = Get-ContentType $fsPath
    Send-Bytes $ctx $bytes $ct 200
  } catch {
    Send-Text $ctx 'Server Error' 'text/plain; charset=utf-8' 500
  }
}
