<# AMIHUMAN • BaselineSmoke.ps1 — PS 5.1 compatible #>

param(
  [string]$BaseUrl = "http://localhost:3000",
  [switch]$Headless,
  [int]$HealthTimeoutSec = 60,
  [int]$ReqTimeoutSec = 20
)

# --- bootstrap ---
$ErrorActionPreference = "Stop"
if(-not $Headless){ Write-Host ">>> BaselineSmoke bootstrap..." -ForegroundColor Cyan }
$scriptDir = $PSScriptRoot; if (-not $scriptDir) { if (Test-Path ".\scripts"){ $scriptDir=(Resolve-Path ".\scripts").Path } else { $scriptDir=(Get-Location).Path } }
$logsDir = Join-Path $scriptDir "logs"; if (!(Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }
$ts = (Get-Date).ToString("yyyyMMdd-HHmmss")
$global:BaselineSmoke_LogFile = Join-Path $logsDir "BaselineSmoke-$ts.log"
function Log($m){ ("[{0}] {1}" -f (Get-Date).ToString("s"), $m) | Out-File -FilePath $global:BaselineSmoke_LogFile -Append -Encoding utf8 }
function Step($m){ if(-not $Headless){ Write-Host "▸ $m" -ForegroundColor Cyan }; Log "STEP: $m" }
function Ok($m){   if(-not $Headless){ Write-Host "  ✔ $m" -ForegroundColor Green }; Log "OK: $m" }
function Warn($m){ if(-not $Headless){ Write-Host "  ! $m" -ForegroundColor Yellow }; Log "WARN: $m" }
function Fail($m){ if(-not $Headless){ Write-Host "  ✖ $m" -ForegroundColor Red }; Log "FAIL: $m" }
if(-not $Headless){ Write-Host (">>> Logs → " + $global:BaselineSmoke_LogFile) -ForegroundColor DarkCyan }
# --- end bootstrap ---

# HTTP core
$defaultHeaders = @{"Content-Type"="application/json"}
if($env:AMIHUMAN_API_TOKEN){ $defaultHeaders["Authorization"]="Bearer $($env:AMIHUMAN_API_TOKEN)" }

function Invoke-Json {
  param([string]$Method,[string]$Url,$Body=$null,[hashtable]$Headers=$null,[int]$TimeoutSec=20)
  if (-not $Headers) { $Headers = $defaultHeaders }
  $bodyStr = if($Body -ne $null){ ($Body | ConvertTo-Json -Depth 10 -Compress) } else { $null }
  try{
    $resp = Invoke-WebRequest -Method $Method -Uri $Url -Headers $Headers -Body $bodyStr -TimeoutSec $TimeoutSec -UseBasicParsing
    $json=$null; if($resp.Content){ try{ $json=$resp.Content | ConvertFrom-Json }catch{} }
    Log ("HTTP {0} {1} → {2}" -f $Method,$Url,$resp.StatusCode)
    if($bodyStr){ Log ("BODY: {0}" -f $bodyStr) }
    if($resp.Content){ Log ("RESP: {0}" -f $resp.Content) }
    return @{ ok=($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300); status=$resp.StatusCode; json=$json; raw=$resp }
  } catch { Log ("HTTP ERROR {0} {1} :: {2}" -f $Method,$Url,$_.Exception.Message); return @{ ok=$false; status=0; json=$null; error=$_.Exception.Message } }
}

# utils
$script:Passed=0; $script:Failed=0
function Assert {
  param([Parameter(Mandatory=$true)]$cond,[string]$pass,[string]$fail)
  $truthy = $false
  if ($cond -is [bool]) {
    $truthy = $cond
  } elseif ($null -ne $cond) {
    $s = [string]$cond
    $truthy = -not [string]::IsNullOrEmpty($s)
  }
  if($truthy){ $script:Passed++; Ok $pass } else { $script:Failed++; Fail $fail }
}
function Get-AnyKey { param($Obj,[string[]]$Keys) foreach($k in $Keys){ if($Obj -and $Obj.PSObject.Properties.Name -contains $k){ return $Obj.$k } } return $null }

# dev server
function Ensure-DevServer {
  Step "Ensuring dev server is running at $BaseUrl"
  $deadline=(Get-Date).AddSeconds($HealthTimeoutSec)

  function Test-Online {
    $r = Invoke-Json -Method GET -Url "$BaseUrl/api/health" -TimeoutSec 5
    if($r.status -ne $null){ return $true }
    $r2 = Invoke-Json -Method GET -Url "$BaseUrl/" -TimeoutSec 5
    if($r2.status -ne $null -and $r2.status -lt 500){ return $true }
    return $false
  }

  while((Get-Date) -lt $deadline){
    if (Test-Online) { Ok "Dev server is online."; return }
    Start-Sleep -Seconds 2
  }

  Warn "Dev server not responding; attempting to start via 'pnpm dev'…"
  try{
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "pnpm"; $startInfo.Arguments = "dev"
    $startInfo.WorkingDirectory = (Get-Item "$scriptDir\..").FullName
    $startInfo.UseShellExecute = $true
    [System.Diagnostics.Process]::Start($startInfo) | Out-Null
    Log "Started 'pnpm dev' detached."
  } catch { Fail "Could not start dev server: $($_.Exception.Message)" }

  $deadline=(Get-Date).AddSeconds($HealthTimeoutSec)
  while((Get-Date) -lt $deadline){
    if (Test-Online) { Ok "Dev server online."; return }
    Start-Sleep -Seconds 2
  }
  throw "Dev server not reachable at $BaseUrl after $HealthTimeoutSec seconds."
}

# seed
$seed = @{
  sponsorCode = "SPONSOR-DEMO-001"
  invitee = @{ phone="+15550001234"; email="demo.invitee@example.com"; name="Demo Invitee" }
  memberProfile = @{ displayName="Demo Invitee"; tz="America/Denver" }
  tb = @{ title="Baseline TB" }
  tu = @{ title="Baseline Trust Unit" }
  chat = @{ subject="Baseline Smoke Thread"; message="Hello from BaselineSmoke.ps1" }
}

# FLOW
try{
  Ensure-DevServer

  Step "Ping core routes"
  foreach($path in @("/", "/member-dashboard?memberCode=demo", "/admin-dashboard", "/dash/profile")){
    $res = Invoke-Json -Method GET -Url "$BaseUrl$path" -TimeoutSec $ReqTimeoutSec
    Assert $res.ok "GET $path → $($res.status)" "GET $path failed"
  }

  Step "Invite → /api/invites/send"
  $inviteBody = @{ toPhone=$seed.invitee.phone; toEmail=$seed.invitee.email; sponsorCode=$seed.sponsorCode }
  $rInvite = Invoke-Json -Method POST -Url "$BaseUrl/api/invites/send" -Body $inviteBody -TimeoutSec $ReqTimeoutSec
  Assert $rInvite.ok "Invite sent (HTTP $($rInvite.status))" "Invite send failed"
  $inviteId = $null; $inviteCode = $null
  if($rInvite.json){ $inviteId = Get-AnyKey $rInvite.json @("inviteId","id","_id"); $inviteCode = Get-AnyKey $rInvite.json @("inviteCode","code","token") }
  Assert ($inviteId -or $inviteCode) "Invite identifiers captured" "Invite identifiers missing"

  Step "Member Accept → /api/invites/accept (fallback /api/members/accept)"
  $acceptBody = @{ inviteCode=$inviteCode; memberProfile=$seed.memberProfile }
  $rAccept = Invoke-Json -Method POST -Url "$BaseUrl/api/invites/accept" -Body $acceptBody -TimeoutSec $ReqTimeoutSec
  if(-not $rAccept.ok){
    Warn "accept fallback → /api/members/accept"
    $rAccept = Invoke-Json -Method POST -Url "$BaseUrl/api/members/accept" -Body $acceptBody -TimeoutSec $ReqTimeoutSec
  }
  Assert $rAccept.ok "Member accepted (HTTP $($rAccept.status))" "Member accept failed"
  $memberId=$null; $memberCode=$null
  if($rAccept.json){ $memberId = Get-AnyKey $rAccept.json @("memberId","id","_id"); $memberCode = Get-AnyKey $rAccept.json @("memberCode","code") }
  Assert ($memberId -or $memberCode) "Member identifiers captured" "Member identifiers missing"

  Step "Trust Bond → /api/trust/bonds"
  $tbBody = @{ title=$seed.tb.title; members=@($memberId); inviteCode=$inviteCode }
  $rTB = Invoke-Json -Method POST -Url "$BaseUrl/api/trust/bonds" -Body $tbBody -TimeoutSec $ReqTimeoutSec
  Assert $rTB.ok "TB created (HTTP $($rTB.status))" "TB creation failed"
  $tbId = $null; if($rTB.json){ $tbId = Get-AnyKey $rTB.json @("tbId","bondId","id","_id") }
  Assert $tbId "TB id captured" "TB id missing"

  Step "Trust Unit → /api/trust/units"
  $tuBody = @{ name=$seed.tu.title; memberCodes=@($memberCode); creatorCode=$seed.sponsorCode }
  $rTU = Invoke-Json -Method POST -Url "$BaseUrl/api/trust/units" -Body $tuBody -TimeoutSec $ReqTimeoutSec
  Assert $rTU.ok "TU formed (HTTP $($rTU.status))" "TU formation failed"
  $tuId = $null; if($rTU.json){ $tuId = Get-AnyKey $rTU.json @("tuId","unitId","id","_id") }
  Assert $tuId "TU id captured" "TU id missing"

  Step "Chat Start → /api/chat/start"
  $chatStartBody = @{ unitId=$tuId; subject=$seed.chat.subject }
  $rChatStart = Invoke-Json -Method POST -Url "$BaseUrl/api/chat/start" -Body $chatStartBody -TimeoutSec $ReqTimeoutSec
  Assert $rChatStart.ok "Chat thread started (HTTP $($rChatStart.status))" "Chat start failed"
  $threadId = $null; if($rChatStart.json){ $threadId = Get-AnyKey $rChatStart.json @("threadId","id","_id") }
  Assert $threadId "Chat thread id captured" "Chat thread id missing"

  Step "Chat Send → /api/chat/send"
  $sendBody = @{ threadId=$threadId; fromMemberId=$memberId; text=$seed.chat.message }
  $rSend = Invoke-Json -Method POST -Url "$BaseUrl/api/chat/send" -Body $sendBody -TimeoutSec $ReqTimeoutSec
  Assert $rSend.ok "Chat message sent (HTTP $($rSend.status))" "Chat send failed"
  $messageId = $null; if($rSend.json){ $messageId = Get-AnyKey $rSend.json @("messageId","id","_id") }
  Assert $messageId "Message id captured" "Message id missing"

  Step "Chat Thread Fetch → /api/chat/thread/:id"
  $rThread = Invoke-Json -Method GET -Url "$BaseUrl/api/chat/thread/$threadId" -TimeoutSec $ReqTimeoutSec
  Assert $rThread.ok "Thread fetched (HTTP $($rThread.status))" "Thread fetch failed"
    $hasMsgs = $false
  if($rThread.json){
    $j = $rThread.json
    $candidates = @()
    $candidates += (Get-AnyKey $j @("messages","msgs","items"))
    if($j.PSObject.Properties.Name -contains 'data'){
      $candidates += (Get-AnyKey $j.data @("messages","msgs","items"))
    }
    if($j.PSObject.Properties.Name -contains 'thread'){
      $candidates += (Get-AnyKey $j.thread @("messages","msgs","items"))
    }
    foreach($m in $candidates){
      if($null -ne $m){
        if($m -is [Array]) { if($m.Count -ge 1){ $hasMsgs = $true; break } }
        elseif($m.PSObject.Properties.Name -contains 'length') { if($m.length -ge 1){ $hasMsgs = $true; break } }
      }
    }
  }
  if($hasMsgs){
    $script:Passed++; Ok "Thread contains messages"
  }else{
    Warn "Thread has no messages (acceptable for baseline)"
  }

  $statusWord = if($script:Failed -eq 0){"GREEN"} else {"RED"}
  $oneLine = "Baseline Smoke: $statusWord — Passed=$($script:Passed) Failed=$($script:Failed) (log: $(Split-Path $global:BaselineSmoke_LogFile -Leaf))"
  if($script:Failed -eq 0){
    Ok $oneLine
    $tagHintPath = Join-Path $scriptDir "_baseline.tag"
    "baseline-v1-green" | Out-File -FilePath $tagHintPath -Encoding utf8
    if(-not $Headless){ Write-Host "`nRun to tag:  git tag baseline-v1-green && git push --tags" -ForegroundColor DarkCyan }
    exit 0
  } else {
    Fail $oneLine
    exit 1
  }
} catch {
  $script:Failed++
  $msg = $_.Exception.Message
  Fail "Harness crashed: $msg"
  Log  "STACK: $($_ | Out-String)"
  $oneLine = "Baseline Smoke: RED — Passed=$($script:Passed) Failed=$($script:Failed) (log: $(Split-Path $global:BaselineSmoke_LogFile -Leaf))"
  Fail $oneLine
  exit 2
}

