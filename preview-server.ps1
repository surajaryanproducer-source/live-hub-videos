param(
  [int]$Port = 8000
)

Add-Type -AssemblyName System.Net
$base = (Resolve-Path .).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serving $base at http://localhost:$Port/"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = $context.Request.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
    if ($path -eq 'admin' -or $path -eq 'admin/') { $path = 'admin.html' }
    $file = Join-Path $base $path
    if (!(Test-Path $file)) {
      if ([string]::IsNullOrEmpty([IO.Path]::GetExtension($file))) {
        $fileHtml = $file + '.html'
        if (Test-Path $fileHtml) { $file = $fileHtml }
      }
      $context.Response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
      continue
    }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ctype = 'text/plain'
    switch ([IO.Path]::GetExtension($file).ToLower()) {
      '.html' { $ctype = 'text/html' }
      '.css'  { $ctype = 'text/css' }
      '.js'   { $ctype = 'application/javascript' }
      '.png'  { $ctype = 'image/png' }
      '.jpg'  { $ctype = 'image/jpeg' }
      '.jpeg' { $ctype = 'image/jpeg' }
      '.svg'  { $ctype = 'image/svg+xml' }
      '.json' { $ctype = 'application/json' }
    }
    $context.Response.ContentType = $ctype
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
} finally {
  try { $listener.Stop(); $listener.Close() } catch {}
}
