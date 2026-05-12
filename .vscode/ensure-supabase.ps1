# Ensures the local Supabase stack is up.
# Idempotent: returns immediately if Supabase is already running.

$ErrorActionPreference = 'Continue'

$logFile = Join-Path $PSScriptRoot 'startup.log'

function Write-Log {
    param([string]$Message, [string]$Color = 'White')
    $stamp = Get-Date -Format 'HH:mm:ss'
    $line = "[$stamp] [supabase] $Message"
    Write-Host $Message -ForegroundColor $Color
    try { Add-Content -Path $logFile -Value $line -Encoding utf8 } catch {}
}

function Test-SupabaseKong {
    # Kong gateway on 54321 = stack is reachable.
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $task = $client.ConnectAsync('127.0.0.1', 54321)
        if ($task.Wait(800)) { $client.Close(); return $true }
        $client.Close()
    } catch {}
    return $false
}

if (Test-SupabaseKong) {
    Write-Log 'Supabase laeuft bereits (Kong auf 54321 erreichbar).' 'Green'
    exit 0
}

Write-Log 'Starte Supabase ...' 'Yellow'
Write-Log '(Erster Start zieht Images, kann ein paar Minuten dauern.)' 'DarkGray'

# `npx supabase start` is itself idempotent against partially-up state — it will
# either bring missing containers up or report status.
& npx supabase start
$code = $LASTEXITCODE

if ($code -ne 0) {
    Write-Log "Supabase konnte nicht starten (exit $code)." 'Red'
    Write-Log 'Haeufige Ursachen:' 'Yellow'
    Write-Log '  - Docker-Daemon nicht bereit -> Tray-Icon pruefen' 'Yellow'
    Write-Log '  - Port-Reservierung von Windows (winnat) -> als Admin:' 'Yellow'
    Write-Log '      net stop winnat' 'Yellow'
    Write-Log '      netsh int ipv4 add excludedportrange protocol=tcp startport=54320 numberofports=10' 'Yellow'
    Write-Log '      net start winnat' 'Yellow'
    exit $code
}

# Final sanity check.
if (-not (Test-SupabaseKong)) {
    Write-Log 'Supabase scheint zwar gestartet, aber Kong auf 54321 antwortet nicht.' 'Red'
    Write-Log 'Pruefe: docker ps und "npx supabase status".' 'Yellow'
    exit 1
}

Write-Log 'Supabase bereit.' 'Green'
exit 0
