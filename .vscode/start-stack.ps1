# Boot orchestrator: Docker -> Supabase. Each step is idempotent.
# The dev server runs as a separate VS Code task so its long-running output
# stays in its own terminal panel.

$ErrorActionPreference = 'Continue'

$logFile = Join-Path $PSScriptRoot 'startup.log'
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
try { Add-Content -Path $logFile -Value "`n=== $stamp Lernikon boot ===" -Encoding utf8 } catch {}

Write-Host '== Lernikon Boot ==' -ForegroundColor Cyan
Write-Host "Log: $logFile" -ForegroundColor DarkGray
Write-Host ''

# Step 1: Docker
Write-Host '[1/2] Docker' -ForegroundColor Cyan
& "$PSScriptRoot\ensure-docker.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'Boot abgebrochen: Docker nicht bereit.' -ForegroundColor Red
    Write-Host 'Terminal bleibt offen — Fehler oben lesen.' -ForegroundColor Yellow
    exit 1
}
Write-Host ''

# Step 2: Supabase
Write-Host '[2/2] Supabase' -ForegroundColor Cyan
& "$PSScriptRoot\ensure-supabase.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'Boot abgebrochen: Supabase nicht bereit.' -ForegroundColor Red
    Write-Host 'Terminal bleibt offen — Fehler oben lesen.' -ForegroundColor Yellow
    exit 1
}

Write-Host ''
Write-Host '== Stack bereit ==' -ForegroundColor Green
Write-Host '  App:     http://localhost:3000  (Dev-Server startet im naechsten Terminal)' -ForegroundColor White
Write-Host '  Studio:  http://127.0.0.1:54323' -ForegroundColor White
Write-Host '  Mailpit: http://127.0.0.1:54324' -ForegroundColor White
exit 0
