@echo off
setlocal

if "%PORT%"=="" set PORT=8080
if "%STATUS_CODE%"=="" set STATUS_CODE=200
if "%ACTION%"=="" set ACTION=keep
if "%MESSAGE%"=="" set MESSAGE=bridge received request

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$port = [int]$env:PORT; ^
$statusCode = [int]$env:STATUS_CODE; ^
$action = $env:ACTION; ^
$message = $env:MESSAGE; ^
$listener = New-Object System.Net.HttpListener; ^
$listener.Prefixes.Add(('http://127.0.0.1:{0}/' -f $port)); ^
$listener.Start(); ^
Write-Host ('bridge listening on http://127.0.0.1:{0}/' -f $port); ^
while ($true) { ^
  $context = $listener.GetContext(); ^
  $request = $context.Request; ^
  $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding); ^
  $body = $reader.ReadToEnd(); ^
  Write-Host '----- bridge request begin -----'; ^
  Write-Host ($request.HttpMethod + ' ' + $request.Url.AbsolutePath); ^
  if ($body) { Write-Host $body }; ^
  Write-Host '----- bridge request end -------'; ^
  $responseBody = '{\"code\":' + $statusCode + ',\"action\":\"' + $action + '\",\"message\":\"' + $message + '\"}'; ^
  $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseBody); ^
  $context.Response.StatusCode = $statusCode; ^
  $context.Response.ContentType = 'application/json'; ^
  $context.Response.OutputStream.Write($buffer, 0, $buffer.Length); ^
  $context.Response.Close(); ^
}"
