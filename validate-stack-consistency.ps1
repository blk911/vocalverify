# Stack Consistency Validator
# Checks for mismatches between Frontend, API, and Database

Write-Host "🔍 Stack Consistency Validation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# Test 1: Admin Send Invitation Flow
Write-Host "Test 1: Admin Send Invitation Flow" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray

$testInvite = @{
    name = "Validation Test User"
    phone = "1112223333"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/send-invitation" -Method Post -Body $testInvite -ContentType "application/json"
    
    if ($response.ok) {
        Write-Host "✅ API Response Structure:" -ForegroundColor Green
        Write-Host "   - ok: $($response.ok)" -ForegroundColor White
        Write-Host "   - message: $($response.message)" -ForegroundColor White
        Write-Host "   - invite.id: $($response.invite.id)" -ForegroundColor White
        Write-Host "   - invite.name: $($response.invite.name)" -ForegroundColor White
        Write-Host "   - invite.phone: $($response.invite.phone)" -ForegroundColor White
        Write-Host "   - invite.status: $($response.invite.status)" -ForegroundColor White
        Write-Host "   - invite.sponsorName: $($response.invite.sponsorName)" -ForegroundColor White
        
        $inviteId = $response.invite.id
        $testName = $response.invite.name
    } else {
        $issues += "Admin send-invitation API failed"
        Write-Host "❌ API returned error: $($response.error)" -ForegroundColor Red
    }
} catch {
    $issues += "Admin send-invitation API error: $($_.Exception.Message)"
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: User Check With Invite Flow
Write-Host "Test 2: User Check With Invite Flow" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Gray

try {
    $checkResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/user/check-with-invite?name=$([uri]::EscapeDataString($testName))" -Method Get
    
    Write-Host "✅ API Response Structure:" -ForegroundColor Green
    Write-Host "   - ok: $($checkResponse.ok)" -ForegroundColor White
    Write-Host "   - exists: $($checkResponse.exists)" -ForegroundColor White
    Write-Host "   - hasInvite: $($checkResponse.hasInvite)" -ForegroundColor White
    
    if ($checkResponse.hasInvite) {
        Write-Host "   - invite.id: $($checkResponse.invite.id)" -ForegroundColor White
        Write-Host "   - invite.name: $($checkResponse.invite.name)" -ForegroundColor White
        Write-Host "   - invite.phone: $($checkResponse.invite.phone)" -ForegroundColor White
        Write-Host "   - invite.sponsorName: $($checkResponse.invite.sponsorName)" -ForegroundColor White
        
        # Validate field consistency
        if ($checkResponse.invite.id -ne $inviteId) {
            $issues += "Invite ID mismatch between send and check APIs"
        }
        if ($checkResponse.invite.name -ne $testName) {
            $issues += "Name mismatch between send and check APIs"
        }
    } else {
        $issues += "check-with-invite did not find the invite we just created"
        Write-Host "❌ Invite not found!" -ForegroundColor Red
    }
} catch {
    $issues += "check-with-invite API error: $($_.Exception.Message)"
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Capture Phone Flow
Write-Host "Test 3: Capture Phone Flow" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Gray

$phoneData = @{
    name = $testName
    phone = "1112223333"
    inviteId = $inviteId
} | ConvertTo-Json

try {
    $captureResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/user/capture-phone" -Method Post -Body $phoneData -ContentType "application/json"
    
    Write-Host "✅ API Response Structure:" -ForegroundColor Green
    Write-Host "   - ok: $($captureResponse.ok)" -ForegroundColor White
    Write-Host "   - hasInvite: $($captureResponse.hasInvite)" -ForegroundColor White
    Write-Host "   - message: $($captureResponse.message)" -ForegroundColor White
    
    if ($captureResponse.hasInvite -and $captureResponse.user) {
        Write-Host "   - user.memberCode: $($captureResponse.user.memberCode)" -ForegroundColor White
        Write-Host "   - user.name: $($captureResponse.user.name)" -ForegroundColor White
        Write-Host "   - user.phone: $($captureResponse.user.phone)" -ForegroundColor White
        Write-Host "   - user.status: $($captureResponse.user.status)" -ForegroundColor White
        Write-Host "   - user.sponsorName: $($captureResponse.user.sponsorName)" -ForegroundColor White
        
        $memberCode = $captureResponse.user.memberCode
        
        # Validate field consistency
        if ($captureResponse.user.name -ne $testName) {
            $issues += "Name mismatch in capture-phone response"
        }
        if ($captureResponse.user.phone -ne "1112223333") {
            $issues += "Phone mismatch in capture-phone response"
        }
    } else {
        $warnings += "capture-phone did not create user from invite"
    }
} catch {
    $issues += "capture-phone API error: $($_.Exception.Message)"
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Database Verification
Write-Host "Test 4: Database Verification" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray

try {
    $membersResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/members" -Method Get
    
    $testUser = $membersResponse.members | Where-Object { $_.name -eq $testName }
    
    if ($testUser) {
        Write-Host "✅ User found in database:" -ForegroundColor Green
        Write-Host "   - name: $($testUser.name)" -ForegroundColor White
        Write-Host "   - phone: $($testUser.phone)" -ForegroundColor White
        Write-Host "   - memberCode: $($testUser.memberCode)" -ForegroundColor White
        Write-Host "   - status: $($testUser.status)" -ForegroundColor White
        
        # Validate database field consistency
        if ($testUser.name -ne $testName) {
            $issues += "Database name doesn't match expected value"
        }
        if ($testUser.phone -ne "1112223333") {
            $issues += "Database phone doesn't match expected value"
        }
        if ($testUser.memberCode -ne $memberCode) {
            $issues += "Database memberCode doesn't match API response"
        }
    } else {
        $issues += "User not found in database after creation"
        Write-Host "❌ User not found in database!" -ForegroundColor Red
    }
} catch {
    $issues += "Database verification error: $($_.Exception.Message)"
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 5: Frontend Field Mapping Check
Write-Host "Test 5: Frontend Field Mapping Analysis" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "Checking connect page logic..." -ForegroundColor Gray

# Read connect page source
$connectPage = Get-Content "src\app\connect\page.tsx" -Raw

# Check for correct field usage
$frontendChecks = @{
    "data.hasInvite" = $connectPage -match "data\.hasInvite"
    "data.invite" = $connectPage -match "data\.invite"
    "data.exists" = $connectPage -match "data\.exists"
    "data.user" = $connectPage -match "data\.user"
    "sessionStorage.setItem('pendingInvite'" = $connectPage -match "sessionStorage\.setItem\('pendingInvite'"
    "inviteId: pendingInvite?.id" = $connectPage -match "inviteId:\s*pendingInvite\?\.id"
}

foreach ($check in $frontendChecks.GetEnumerator()) {
    if ($check.Value) {
        Write-Host "   ✅ $($check.Key) - Found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($check.Key) - NOT FOUND" -ForegroundColor Red
        $issues += "Frontend missing check for: $($check.Key)"
    }
}

Write-Host ""

# Test 6: API Response Consistency Check
Write-Host "Test 6: API Response Consistency" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Gray

$apiChecks = @{
    "send-invitation returns invite.id" = $null -ne $inviteId
    "check-with-invite returns hasInvite" = $checkResponse.hasInvite -eq $true
    "check-with-invite returns invite object" = $null -ne $checkResponse.invite
    "capture-phone returns hasInvite" = $captureResponse.hasInvite -eq $true
    "capture-phone returns user object" = $null -ne $captureResponse.user
}

foreach ($check in $apiChecks.GetEnumerator()) {
    if ($check.Value) {
        Write-Host "   ✅ $($check.Key)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($check.Key)" -ForegroundColor Red
        $issues += "API consistency issue: $($check.Key)"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Final Report
Write-Host "📊 VALIDATION REPORT" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Stack is consistent:" -ForegroundColor Green
    Write-Host "  ✅ Frontend logic matches API responses" -ForegroundColor Green
    Write-Host "  ✅ API responses match database schema" -ForegroundColor Green
    Write-Host "  ✅ All field names are consistent" -ForegroundColor Green
    Write-Host "  ✅ Data flows correctly through the stack" -ForegroundColor Green
} else {
    if ($issues.Count -gt 0) {
        Write-Host "❌ CRITICAL ISSUES FOUND: $($issues.Count)" -ForegroundColor Red
        Write-Host ""
        foreach ($issue in $issues) {
            Write-Host "  ❌ $issue" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  WARNINGS: $($warnings.Count)" -ForegroundColor Yellow
        Write-Host ""
        foreach ($warning in $warnings) {
            Write-Host "  ⚠️  $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cleanup test data
Write-Host "🧹 Cleaning up test data..." -ForegroundColor Gray

try {
    $deletePayload = @{
        inviteId = $inviteId
        phone = "1112223333"
    } | ConvertTo-Json
    
    $deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/delete-invite" -Method Delete -Body $deletePayload -ContentType "application/json"
    
    if ($deleteResponse.ok) {
        Write-Host "✅ Test data cleaned up" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not clean up test data" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Validation complete!" -ForegroundColor Cyan

# Exit with error code if issues found
if ($issues.Count -gt 0) {
    exit 1
} else {
    exit 0
}

















