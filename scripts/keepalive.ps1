# keepalive.ps1 — Pings Render every 3 minutes to prevent free-tier sleep
# Run: .\scripts\keepalive.ps1
# Stop: Ctrl+C

$url = "https://api.mousebase.dev/health/"
$interval = 180  # 3 minutes in seconds

Write-Host "Keepalive started. Pinging $url every $($interval)s" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor DarkGray

while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    try {
        $r = Invoke-WebRequest -Uri $url -TimeoutSec 90 -UseBasicParsing
        Write-Host "[$timestamp] OK $($r.StatusCode)" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code) {
            Write-Host "[$timestamp] HTTP $code" -ForegroundColor Yellow
        } else {
            Write-Host "[$timestamp] Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds $interval
}
