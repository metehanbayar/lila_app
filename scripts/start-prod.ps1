$ErrorActionPreference = 'Stop'

$port = 3300
$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($listeners) {
  $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $processIds) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Host "Stopped process on port ${port}: ${processId}"
    } catch {
      Write-Host "Could not stop process ${processId} on port ${port}"
    }
  }

  Start-Sleep -Seconds 1
}

npm --prefix server run start
