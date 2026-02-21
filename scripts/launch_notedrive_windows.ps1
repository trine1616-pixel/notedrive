param(
  [int]$Port = 9002
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Join-Path $RootDir "notedrive"
$LogDir = Join-Path $RootDir "logs"
$PidFile = Join-Path $LogDir "notedrive_windows.pid"
$LogFile = Join-Path $LogDir "notedrive_server_windows.log"

if (-not (Test-Path $AppDir)) {
  Write-Error "notedrive folder not found: $AppDir"
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Stop-PortProcess {
  param([int]$TargetPort)
  $conn = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
      try {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      } catch {}
    }
  }
}

Stop-PortProcess -TargetPort $Port

Push-Location $AppDir
try {
  if (-not (Test-Path (Join-Path $AppDir "node_modules"))) {
    npm install | Out-File -Append -FilePath $LogFile
  }

  if (Test-Path (Join-Path $AppDir ".next")) {
    Remove-Item -Recurse -Force (Join-Path $AppDir ".next")
  }

  npm run build | Out-File -Append -FilePath $LogFile

  $p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start -- -p $Port" -WorkingDirectory $AppDir -WindowStyle Hidden -PassThru
  Set-Content -Path $PidFile -Value $p.Id
} finally {
  Pop-Location
}

Start-Sleep -Seconds 2
Start-Process "http://localhost:$Port"
