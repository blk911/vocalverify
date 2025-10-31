param(
  [string]$TrayDir = "$PSScriptRoot\..\tools\tray"
)
$ErrorActionPreference = "Stop"

$startup = [Environment]::GetFolderPath('Startup')
$lnk = Join-Path $startup 'Amihuman Snapshot.lnk'
$cmd = 'powershell.exe'
$args = "-NoProfile -ExecutionPolicy Bypass -Command `"cd `"" + $TrayDir + "`"; npm install --no-fund --no-audit; npm start`""

$shell = New-Object -ComObject WScript.Shell
$sc = $shell.CreateShortcut($lnk)
$sc.TargetPath = $cmd
$sc.Arguments = $args
$sc.WorkingDirectory = $TrayDir
$sc.Description = 'Start Amihuman Snapshot Tray'
$sc.Save()

Write-Host "Startup shortcut created: $lnk"
