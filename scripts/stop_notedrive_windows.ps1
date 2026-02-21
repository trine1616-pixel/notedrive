param(
  [int]$Port = 9002
)

$ErrorActionPreference = "SilentlyContinue"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $RootDir "logs"
$PidFile = Join-Path $LogDir "notedrive_windows.pid"

if (Test-Path $PidFile) {
  $pid = Get-Content $PidFile
  if ($pid) {
    Stop-Process -Id $pid -Force
  }
  Remove-Item -Force $PidFile
}

$conn = Get-NetTCPConnection -LocalPort $Port -State Listen
if ($conn) {
  $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($id in $pids) {
    Stop-Process -Id $id -Force
  }
}
