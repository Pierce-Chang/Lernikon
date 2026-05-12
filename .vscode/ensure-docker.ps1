# Ensures Docker Desktop is up and the daemon responds.
# Idempotent: returns immediately if Docker is already running.
# Used by .vscode/tasks.json so opening the folder primes the whole stack.

$ErrorActionPreference = 'Continue'

$logFile = Join-Path $PSScriptRoot 'startup.log'

function Write-Log {
    param([string]$Message, [string]$Color = 'White')
    $stamp = Get-Date -Format 'HH:mm:ss'
    $line = "[$stamp] [docker] $Message"
    Write-Host $Message -ForegroundColor $Color
    try { Add-Content -Path $logFile -Value $line -Encoding utf8 } catch {}
}

function Test-DockerDaemon {
    docker version --format '{{.Server.Version}}' > $null 2>&1
    return $LASTEXITCODE -eq 0
}

function Test-DockerProcessRunning {
    # True if "Docker Desktop.exe" is currently a running process (any state).
    $null -ne (Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue)
}

if (Test-DockerDaemon) {
    Write-Log 'Docker laeuft bereits.' 'Green'
    exit 0
}

$candidatePaths = @(
    'C:\Program Files\Docker\Docker\Docker Desktop.exe',
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe",
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
)
$dockerExe = $candidatePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $dockerExe) {
    Write-Log '' 'White'
    Write-Log 'Docker Desktop ist nicht installiert (oder an einem unueblichen Ort).' 'Red'
    Write-Log 'Bitte einmalig installieren: https://www.docker.com/products/docker-desktop/' 'Yellow'
    Write-Log 'Tipp: in Docker Desktop -> Settings -> General -> "Start Docker Desktop when you sign in" anhaken,' 'Yellow'
    Write-Log 'dann muss dieses Script bei zukuenftigen Logins nichts mehr tun.' 'Yellow'
    exit 1
}

if (Test-DockerProcessRunning) {
    Write-Log 'Docker Desktop laeuft bereits (Daemon noch nicht bereit). Warte ...' 'Yellow'
} else {
    Write-Log "Starte Docker Desktop ($dockerExe) ..." 'Yellow'
    try {
        Start-Process -FilePath $dockerExe -ErrorAction Stop | Out-Null
    } catch {
        Write-Log "Konnte Docker Desktop nicht starten: $($_.Exception.Message)" 'Red'
        exit 1
    }
}

$timeoutSeconds = 180
$deadline = (Get-Date).AddSeconds($timeoutSeconds)
$dots = 0

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    if (Test-DockerDaemon) {
        Write-Host ''
        Write-Log 'Docker bereit.' 'Green'
        exit 0
    }
    Write-Host '.' -NoNewline
    $dots++
    if ($dots % 30 -eq 0) { Write-Host '' }
}

Write-Host ''
Write-Log "Docker Daemon hat sich in $timeoutSeconds s nicht gemeldet." 'Red'
Write-Log 'Bitte Docker Desktop manuell pruefen (Tray-Icon) und Task "Lernikon: Start All" erneut ausfuehren.' 'Yellow'
exit 1
