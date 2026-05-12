# Starts the Next.js dev server if it isn't already running on :3000.
# This script BLOCKS while the dev server is alive (it just `& npm run dev`).
# On VS Code restart with the previous dev server still up, it exits idempotently.

$ErrorActionPreference = 'Continue'

$logFile = Join-Path $PSScriptRoot 'startup.log'

function Write-Log {
    param([string]$Message, [string]$Color = 'White')
    $stamp = Get-Date -Format 'HH:mm:ss'
    $line = "[$stamp] [dev] $Message"
    Write-Host $Message -ForegroundColor $Color
    try { Add-Content -Path $logFile -Value $line -Encoding utf8 } catch {}
}

function Test-Port3000 {
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $task = $client.ConnectAsync('127.0.0.1', 3000)
        if ($task.Wait(500)) { $client.Close(); return $true }
        $client.Close()
    } catch {}
    return $false
}

if (Test-Port3000) {
    Write-Log 'Dev-Server laeuft bereits auf http://localhost:3000 — ueberspringe Start.' 'Green'
    Write-Log 'Wenn du neu starten willst: Task "Lernikon: Stop All" -> "Lernikon: Start All".' 'DarkGray'
    # We have to stay alive a moment so VS Code's task panel doesn't immediately
    # close the terminal — but no point hanging forever. Sleep briefly and exit.
    Start-Sleep -Seconds 2
    exit 0
}

# Switch to the workspace root (parent of .vscode) and exec npm run dev.
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot
Write-Log "Starte Next.js Dev-Server in $projectRoot ..." 'Yellow'

# `& npm run dev` blocks until the dev server exits. VS Code's task UI keeps the
# terminal open and shows the live output; that's what we want.
& npm run dev
$code = $LASTEXITCODE
Write-Log "Dev-Server beendet (exit $code)." 'DarkGray'
exit $code
