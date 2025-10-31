param(
  [string]$RepoPath = "$PSScriptRoot\..",
  [string]$Branch   = "wip/spencer",
  [int]$TimeoutSec  = 45,
  [ValidateSet("AutoSave","Skip")][string]$OnTimeout = "AutoSave",
  [switch]$Silent
)
$ErrorActionPreference = "Stop"

function Ensure-Repo {
  if (-not (Test-Path $RepoPath)) { throw "RepoPath not found: $RepoPath" }
  Set-Location $RepoPath
  if (-not (Test-Path ".git")) { throw "Not a git repo: $RepoPath" }
}
function Exec($cmd,$err="Command failed"){
  $p=Start-Process -FilePath "cmd.exe" -ArgumentList "/c $cmd" -NoNewWindow -PassThru -Wait
  if($p.ExitCode -ne 0){ throw "$err ($cmd)" }
}
function Get-HasChanges { $s = (& git status --porcelain) 2>$null; return -not [string]::IsNullOrWhiteSpace($s) }
function Ensure-Branch {
  $cur = (& git rev-parse --abbrev-ref HEAD).Trim()
  if($cur -ne $Branch){
    $exists = (& git branch --list $Branch)
    if([string]::IsNullOrWhiteSpace($exists)){ Exec "git checkout -b $Branch" } else { Exec "git checkout $Branch" }
  }
}

function Try-TrayPrompt {
  param([int]$TimeoutSec)
  $base = $env:LOCALAPPDATA; if(-not $base){ return $null }
  $root = Join-Path $base 'AmihumanSnapshot'
  $req  = Join-Path $root 'requests'
  $res  = Join-Path $root 'responses'
  if(-not (Test-Path $req)) { return $null }
  if(-not (Test-Path $res)) { return $null }
  $id = [guid]::NewGuid().ToString()
  $reqFile = Join-Path $req ("$id.json")
  $resFile = Join-Path $res ("$id.json")
  $payload = @{ id=$id; branch=$Branch; timeoutSec=$TimeoutSec; question="Commit & push to '$Branch' now?" }
  Write-Host "Tray IPC root: $root"
  Write-Host "Writing request: $reqFile (timeout $TimeoutSec s)"
  $payload | ConvertTo-Json | Out-File -FilePath $reqFile -Encoding UTF8 -Force
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while((Get-Date) -lt $deadline){
    if(Test-Path $resFile){
      $resp = Get-Content $resFile -Raw | ConvertFrom-Json
      Write-Host "Tray response: $($resp.decision)"
      return $resp.decision
    }
    Start-Sleep -Milliseconds 300
  }
  Write-Host "Tray prompt timed out."
  return 'Timeout'
}

function Prompt-Interactive([int]$TimeoutSec){
  # 1) Try tray prompt via file IPC
  $decision = Try-TrayPrompt -TimeoutSec $TimeoutSec
  if($decision -and $decision -ne 'Timeout'){ return $decision }

  # 2) Force WinForms fallback. Relaunch in STA if needed so forms can render.
  if(([System.Threading.Thread]::CurrentThread.ApartmentState) -ne 'STA'){
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName  = 'powershell.exe'
    $psi.Arguments = "-STA -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -RepoPath `"$RepoPath`" -Branch `"$Branch`" -TimeoutSec $TimeoutSec -OnTimeout `"$OnTimeout`""
    $psi.UseShellExecute = $true
    [System.Diagnostics.Process]::Start($psi) | Out-Null
    exit 0
  }

  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  $form = New-Object System.Windows.Forms.Form
  $form.Text = "Git Snapshot"
  $form.Size = New-Object System.Drawing.Size(380,160)
  $form.StartPosition = "CenterScreen"
  $label = New-Object System.Windows.Forms.Label
  $label.Text = "Commit & push to '$Branch' now?"
  $label.AutoSize = $true; $label.Location = New-Object System.Drawing.Point(20,20)
  $yes = New-Object System.Windows.Forms.Button; $yes.Text='Yes'; $yes.Location=New-Object System.Drawing.Point(70,70); $yes.Add_Click({ $form.Tag='Yes'; $form.Close() })
  $no  = New-Object System.Windows.Forms.Button; $no.Text='No';  $no.Location=New-Object System.Drawing.Point(200,70); $no.Add_Click({ $form.Tag='No';  $form.Close() })
  $timer = New-Object System.Windows.Forms.Timer; $timer.Interval = $TimeoutSec*1000; $timer.Add_Tick({ $form.Tag='Timeout'; $form.Close() }); $timer.Start()
  $form.Controls.AddRange(@($label,$yes,$no)); $null=$form.ShowDialog()
  switch($form.Tag){ 'Yes'{'Yes'} 'No'{'No'} default{'Timeout'} }
}

try{
  Ensure-Repo; Ensure-Branch
  if(-not (Get-HasChanges)) { Write-Host 'No changes; nothing to snapshot.'; exit 0 }

  $choice = if($Silent){ 'Yes' } else { Prompt-Interactive -TimeoutSec $TimeoutSec }
  Write-Host "Decision: $choice"
  if($choice -eq 'Yes' -or ($choice -eq 'Timeout' -and $OnTimeout -eq 'AutoSave')){
    & git add -A
    & git diff --cached --quiet; if($LASTEXITCODE -eq 0){ Write-Host 'No staged changes.'; exit 0 }

    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

    # >>> BYPASS HUSKY for autosnapshots <<<
    $prevHusky = $env:HUSKY
    $env:HUSKY = '0'
    Write-Host "Committing (hooks disabled) ..."
    Exec "git commit -m `"wip: auto snapshot $stamp`" --no-verify"
    Write-Host "Pushing ..."
    Exec "git push origin $Branch" 'Push failed'
    if ($null -ne $prevHusky) { $env:HUSKY = $prevHusky } else { Remove-Item Env:\HUSKY -ErrorAction SilentlyContinue }

    Write-Host 'Snapshot saved.'
  } else {
    Write-Host 'Snapshot skipped.'
  }
}
catch { Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
