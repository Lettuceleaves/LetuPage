$port = if ($env:PORT) { [int]$env:PORT } else { 8080 }
$logDir = if ($env:LOG_DIR) { $env:LOG_DIR } else { "bridge-logs" }

if (-not (Test-Path $logDir)) {
  $null = New-Item -ItemType Directory -Path $logDir
}

$listener = [System.Net.Sockets.TcpListener]::new(
  [System.Net.IPAddress]::Parse("127.0.0.1"),
  $port
)
$listener.Start()

Write-Host ("bridge listening on http://127.0.0.1:{0}/" -f $port)
Write-Host ("logs will be written to {0}" -f $logDir)

function Send-JsonResponse {
  param(
    [Parameter(Mandatory = $true)]
    [System.Net.Sockets.NetworkStream]$Stream,
    [Parameter(Mandatory = $true)]
    [int]$StatusCode,
    [Parameter(Mandatory = $true)]
    [string]$Body
  )

  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
  $statusText = if ($StatusCode -eq 200) { "OK" } elseif ($StatusCode -eq 405) { "Method Not Allowed" } else { "ERROR" }
  $headerText = @(
    "HTTP/1.1 $StatusCode $statusText"
    "Content-Type: application/json"
    "Content-Length: $($bodyBytes.Length)"
    "Access-Control-Allow-Origin: *"
    "Access-Control-Allow-Methods: GET,POST,OPTIONS"
    "Access-Control-Allow-Headers: Content-Type"
    "Connection: close"
    ""
    ""
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
  $Stream.Flush()
}

while ($true) {
  $client = $listener.AcceptTcpClient()

  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader(
      $stream,
      [System.Text.Encoding]::ASCII,
      $false,
      8192,
      $true
    )

    $requestLine = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($requestLine)) {
      continue
    }

    $parts = $requestLine.Split(" ")
    $method = $parts[0]
    $path = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
    $contentLength = 0

    while ($true) {
      $line = $reader.ReadLine()
      if ([string]::IsNullOrEmpty($line)) {
        break
      }

      if ($line -match "^Content-Length:\s*(\d+)$") {
        $contentLength = [int]$Matches[1]
      }
    }

    $body = ""
    if ($contentLength -gt 0) {
      $charBuffer = New-Object char[] $contentLength
      [void]$reader.ReadBlock($charBuffer, 0, $contentLength)
      $body = -join $charBuffer
    }

    if ($method -eq "OPTIONS") {
      Send-JsonResponse -Stream $stream -StatusCode 200 -Body '{"code":200}'
      continue
    }

    if ($method -eq "GET" -and $path -eq "/health") {
      Send-JsonResponse -Stream $stream -StatusCode 200 -Body '{"code":200,"ready":true}'
      continue
    }

    if ($method -eq "POST") {
      $logId = (Get-Date -Format "yyyyMMdd-HHmmss-fff") + "-" + [guid]::NewGuid().ToString()
      $logPath = Join-Path $logDir ("bridge-log-" + $logId + ".json")

      $parsedBody = $null
      if ($body) {
        try {
          $parsedBody = ConvertFrom-Json -InputObject $body
        } catch {
          $parsedBody = $body
        }
      }

      $payloadObject = [ordered]@{
        id = $logId
        method = $method
        path = $path
        timestamp = (Get-Date).ToString("o")
        body = $parsedBody
      }

      $payload = ConvertTo-Json -InputObject $payloadObject -Depth 10
      Set-Content -Path $logPath -Value $payload -Encoding UTF8

      Send-JsonResponse -Stream $stream -StatusCode 200 -Body '{"code":200}'
      continue
    }

    Send-JsonResponse -Stream $stream -StatusCode 405 -Body '{"code":405}'
  } finally {
    $client.Close()
  }
}
