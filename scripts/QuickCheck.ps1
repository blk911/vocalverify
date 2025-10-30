param(
  [string]$BaseUrl = "http://localhost:3000",
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
function Step($m){ Write-Host "▸ $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "  ✔ $m" -ForegroundColor Green }
function Fail($m){ Write-Host "  ✖ $m" -ForegroundColor Red }

# 0) deps
if (-not $SkipInstall) {
  Step "Installing dev deps (typescript, eslint)"
  pnpm install --silent | Out-Null
}

# 1) TS compile (no emit)
Step "TypeScript check"
pnpm exec tsc -b --pretty false --noEmit
Ok "TS ok"

# 2) ESLint (warnings fail)
Step "ESLint"
pnpm exec eslint . --ext .ts,.tsx --max-warnings=0
Ok "ESLint clean"

# 3) Find Next routes on disk
function Get-NextRoutes {
  $root = Join-Path (Get-Location) "src"
  if (-not (Test-Path $root)) { $root = Get-Location }
  $appDir = Join-Path $root "app"
  $pages = @()
  $apis = @()
  if (Test-Path $appDir) {
    $pages = Get-ChildItem $appDir -Recurse -File -Include page.tsx,page.jsx -ErrorAction SilentlyContinue
    $apis  = Get-ChildItem $appDir -Recurse -File -Include route.ts,route.tsx -ErrorAction SilentlyContinue |
            Where-Object { $_.DirectoryName -match "\\api(\\|/)" }
  }
  [pscustomobject]@{
    Pages = $pages | ForEach-Object { $_.FullName -replace ".*\\app","/app" -replace "\\","/" -replace "/page\.(t|j)sx$","" }
    Api   = $apis  | ForEach-Object { $_.FullName -replace ".*\\app","/app" -replace "\\","/" -replace "/route\.(t|j)sx?$","" -replace "^/app","" }
  }
}
Step "Scanning Next pages/API"
$routes = Get-NextRoutes
Ok "Found $($routes.Pages.Count) pages, $($routes.Api.Count) API endpoints"

# 4) Ensure dev server is up (start if needed)
Step "Starting/attaching to dev server"
$alive=$false
try { (Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl" -TimeoutSec 2) | Out-Null; $alive=$true } catch {}
if (-not $alive) {
  Start-Job { pnpm dev } | Out-Null
  $ok=$false; 1..60 | % { try { Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl" -TimeoutSec 2 | Out-Null; $ok=$true; break } catch { Start-Sleep -Milliseconds 500 } }
  if (-not $ok) { throw "Dev server didn't start on $BaseUrl" }
}
Ok "Server available at $BaseUrl"

# 5) Probe key routes
Step "HTTP probes"
$probes = @(
  "/",
  "/api/health",
  "/member-dashboard?memberCode=demo",
  "/admin-dashboard",
  "/dash/profile"
) + ($routes.Api | Select-Object -Unique)

$bad = @()
foreach($p in $probes){
  try {
    $res = Invoke-WebRequest -UseBasicParsing -Uri ($BaseUrl+$p) -TimeoutSec 5
    if ($res.StatusCode -lt 200 -or $res.StatusCode -ge 400) { $bad += [pscustomobject]@{Path=$p; Code=$res.StatusCode} }
  } catch { $bad += [pscustomobject]@{Path=$p; Code="ERR"} }
}
if ($bad.Count) {
  Fail "Route failures:"; $bad | Format-Table -AutoSize | Out-String | Write-Host
  exit 2
} else { Ok "All GET probes OK" }

# 6) Minimal POST contract smoke (add more as you wire endpoints)
Step "POST smoke"
function PostJson($path,$obj){
  $json = ($obj | ConvertTo-Json -Depth 8)
  Invoke-WebRequest -UseBasicParsing -Method POST -Uri ($BaseUrl+$path) -Body $json -ContentType "application/json"
}
$tests = @(
  @{ path="/api/invites/send";   body=@{ email="qc+1@amihuman.net"; sponsorId="admin" } },
  @{ path="/api/profile/extract"; body=@{ domain="cooking"; prompt="p"; answer="a" } }
)
$pfails=@()
foreach($t in $tests){
  try {
    $r = PostJson $t.path $t.body
    if ($r.StatusCode -lt 200 -or $r.StatusCode -ge 400) { $pfails += [pscustomobject]@{Path=$t.path; Code=$r.StatusCode} }
  } catch { $pfails += [pscustomobject]@{Path=$t.path; Code="ERR"} }
}
if ($pfails.Count) { Fail "POST failures:"; $pfails | Format-Table -AutoSize | Out-String | Write-Host; exit 3 }
Ok "POST smoke OK"

Ok "QuickCheck complete — baseline looks healthy."
