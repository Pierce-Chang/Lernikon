Write-Host '== Lernikon Status ==' -ForegroundColor Cyan

# Docker
docker version --format '{{.Server.Version}}' 2>$null | ForEach-Object {
    Write-Host "Docker:    OK ($_)" -ForegroundColor Green
}
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker:    nicht erreichbar' -ForegroundColor Red
}

# Supabase (Kong gateway on 54321)
$kong = $false
try {
    $c = [System.Net.Sockets.TcpClient]::new()
    $t = $c.ConnectAsync('127.0.0.1', 54321)
    $kong = $t.Wait(500)
    $c.Close()
} catch {}
if ($kong) {
    Write-Host 'Supabase:  OK (Kong :54321)' -ForegroundColor Green
} else {
    Write-Host 'Supabase:  nicht erreichbar' -ForegroundColor Red
}

# Dev server
$dev = $false
try {
    $c = [System.Net.Sockets.TcpClient]::new()
    $t = $c.ConnectAsync('127.0.0.1', 3000)
    $dev = $t.Wait(500)
    $c.Close()
} catch {}
if ($dev) {
    Write-Host 'Dev:       OK (http://localhost:3000)' -ForegroundColor Green
} else {
    Write-Host 'Dev:       nicht erreichbar' -ForegroundColor Red
}
