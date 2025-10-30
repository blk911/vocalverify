param([string[]]$Roots = @("src\app\api","apps\api"))

$ErrorActionPreference = "Stop"

# Patterns to forbid
$forbidden = @(
  'MOCK_',                           # mock constants
  'random\.choice',                  # python randoms
  'Random\(',                        # TS/JS randoms
  'setTimeout\(.*res\.json',         # delayed stub response
  'Response\.json\(\s*{\s*ok:\s*true\s*,\s*.*stub', # stub payloads
  'return\s+NextResponse\.json\(\s*{[^}]*"(stub-|demo-|fake-|placeholder)"',
  'TODO:\s*temporary',
  'canned\s+response',
  'hardcoded\s+(response|payload)'
)

$failures = @()

foreach($root in $Roots){
  if(-not (Test-Path $root)){ continue }

  # Skip bulky / generated dirs
  $files = Get-ChildItem -Path $root -Recurse -File -Include *.ts,*.tsx,*.js,*.py `
           | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.next\\|\\dist\\|\\\.git\\' }

  foreach($f in $files){
    # Use -LiteralPath so [id] etc. aren’t treated as wildcards
    try {
      $content = Get-Content -LiteralPath $f.FullName -Raw -ErrorAction Stop
    } catch {
      # File may have been deleted/locked; skip safely
      continue
    }

    foreach($pat in $forbidden){
      if([System.Text.RegularExpressions.Regex]::IsMatch($content, $pat, "IgnoreCase")){
        $failures += [PSCustomObject]@{ File=$f.FullName; Pattern=$pat }
      }
    }
  }
}

if($failures.Count -gt 0){
  Write-Host "❌ Guard failed — mock/static patterns found:" -ForegroundColor Red
  $failures | Sort-Object File,Pattern | Format-Table -AutoSize
  exit 1
}else{
  Write-Host "✅ Guard passed — no mock/static patterns detected." -ForegroundColor Green
}

