# Simple Stack Mismatch Checker

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Stack Consistency Checker" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()

# Test the actual flow
Write-Host "Testing Invite Flow..." -ForegroundColor Yellow
Write-Host ""

# 1. Create invite
Write-Host "1. Creating test invite..." -ForegroundColor Gray
$invite = @{ name = "Test User"; phone = "9998887777" } | ConvertTo-Json
$r1 = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/send-invitation" -Method Post -Body $invite -ContentType "application/json"

if (-not $r1.ok) {
    $errors += "send-invitation failed"
    Write-Host "   ❌ Failed" -ForegroundColor Red
} else {
    Write-Host "   ✅ Success - ID: $($r1.invite.id)" -ForegroundColor Green
    $inviteId = $r1.invite.id
    $testName = $r1.invite.name
}

Write-Host ""

# 2. Check invite
Write-Host "2. Checking if invite found..." -ForegroundColor Gray
$r2 = Invoke-RestMethod -Uri "http://localhost:3000/api/user/check-with-invite?name=$([uri]::EscapeDataString($testName))" -Method Get

Write-Host "   Response fields:" -ForegroundColor White
Write-Host "     - ok: $($r2.ok)" -ForegroundColor White
Write-Host "     - exists: $($r2.exists)" -ForegroundColor White
Write-Host "     - hasInvite: $($r2.hasInvite)" -ForegroundColor White

if ($r2.hasInvite) {
    Write-Host "   ✅ Invite found" -ForegroundColor Green
} else {
    $errors += "check-with-invite did not return hasInvite=true"
    Write-Host "   ❌ Invite NOT found" -ForegroundColor Red
}

Write-Host ""

# 3. Capture phone
Write-Host "3. Capturing phone with invite..." -ForegroundColor Gray
$phone = @{ name = $testName; phone = "9998887777"; inviteId = $inviteId } | ConvertTo-Json
$r3 = Invoke-RestMethod -Uri "http://localhost:3000/api/user/capture-phone" -Method Post -Body $phone -ContentType "application/json"

Write-Host "   Response fields:" -ForegroundColor White
Write-Host "     - ok: $($r3.ok)" -ForegroundColor White
Write-Host "     - hasInvite: $($r3.hasInvite)" -ForegroundColor White
Write-Host "     - user exists: $($null -ne $r3.user)" -ForegroundColor White

if ($r3.hasInvite -and $r3.user) {
    Write-Host "   ✅ User created" -ForegroundColor Green
    Write-Host "     - memberCode: $($r3.user.memberCode)" -ForegroundColor White
} else {
    $errors += "capture-phone did not create user"
    Write-Host "   ❌ User NOT created" -ForegroundColor Red
}

Write-Host ""

# 4. Verify in database
Write-Host "4. Verifying in database..." -ForegroundColor Gray
$r4 = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members" -Method Get
$user = $r4.members | Where-Object { $_.name -eq $testName }

if ($user) {
    Write-Host "   ✅ User found in database" -ForegroundColor Green
    Write-Host "     - name: $($user.name)" -ForegroundColor White
    Write-Host "     - phone: $($user.phone)" -ForegroundColor White
    Write-Host "     - memberCode: $($user.memberCode)" -ForegroundColor White
} else {
    $errors += "User not in database"
    Write-Host "   ❌ User NOT in database" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check frontend code
Write-Host "Checking Frontend Code..." -ForegroundColor Yellow
Write-Host ""

$connectCode = Get-Content "src\app\connect\page.tsx" -Raw

$checks = @(
    @{ name = "data.hasInvite check"; pattern = "data\.hasInvite" },
    @{ name = "data.invite usage"; pattern = "data\.invite" },
    @{ name = "sessionStorage pendingInvite"; pattern = "pendingInvite" },
    @{ name = "inviteId parameter"; pattern = "inviteId:" }
)

foreach ($check in $checks) {
    if ($connectCode -match $check.pattern) {
        Write-Host "   ✅ $($check.name)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($check.name) - NOT FOUND" -ForegroundColor Red
        $errors += "Frontend missing: $($check.name)"
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Final report
if ($errors.Count -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "No mismatches found!" -ForegroundColor Green
} else {
    Write-Host "❌ FOUND $($errors.Count) ISSUES" -ForegroundColor Red
    Write-Host ""
    foreach ($err in $errors) {
        Write-Host "  • $err" -ForegroundColor Red
    }
}

Write-Host ""

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Gray
try {
    $del = @{ inviteId = $inviteId; phone = "9998887777" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3000/api/admin/delete-invite" -Method Delete -Body $del -ContentType "application/json" | Out-Null
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Cleanup skipped" -ForegroundColor Yellow
}

Write-Host ""





