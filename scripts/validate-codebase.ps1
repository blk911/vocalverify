# AM I HUMAN.net - Codebase Validation Tool
# Tests every API route, database operation, and component

param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$Verbose = $false
)

Write-Host "=== AM I HUMAN.net CODEBASE VALIDATION ===" -ForegroundColor Magenta
Write-Host "Testing every script component for proper functionality..." -ForegroundColor Yellow
Write-Host ""

# Test Results Tracking
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Warnings = 0
}

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message = "",
        [string]$Details = ""
    )
    
    $TestResults.Total++
    
    switch ($Status) {
        "PASS" {
            Write-Host "✅ $TestName" -ForegroundColor Green
            $TestResults.Passed++
        }
        "FAIL" {
            Write-Host "❌ $TestName" -ForegroundColor Red
            Write-Host "   $Message" -ForegroundColor Red
            $TestResults.Failed++
        }
        "WARN" {
            Write-Host "⚠️  $TestName" -ForegroundColor Yellow
            Write-Host "   $Message" -ForegroundColor Yellow
            $TestResults.Warnings++
        }
    }
    
    if ($Details -and $Verbose) {
        Write-Host "   Details: $Details" -ForegroundColor Gray
    }
}

# 1. API ROUTE VALIDATION
Write-Host "=== API ROUTE VALIDATION ===" -ForegroundColor Cyan

# Test User Profile API
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/user/profile?memberCode=5551111111" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.ok -and $data.profile) {
            Write-TestResult "User Profile API" "PASS" "Returns user data correctly"
        } else {
            Write-TestResult "User Profile API" "FAIL" "API returns success but no profile data"
        }
    } else {
        Write-TestResult "User Profile API" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "User Profile API" "FAIL" "Exception: $($_.Exception.Message)"
}

# Test Invites List API
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/invites/list?memberCode=5127715877" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.invites) {
            Write-TestResult "Invites List API" "PASS" "Returns invites data correctly"
        } else {
            Write-TestResult "Invites List API" "FAIL" "API returns success but no invites data"
        }
    } else {
        Write-TestResult "Invites List API" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Invites List API" "FAIL" "Exception: $($_.Exception.Message)"
}

# Test Trust Units List API
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/trust-units/list?memberCode=5551111111" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-TestResult "Trust Units List API" "PASS" "Returns trust units data"
    } else {
        Write-TestResult "Trust Units List API" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Trust Units List API" "FAIL" "Exception: $($_.Exception.Message)"
}

# Test Admin Members API
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/admin/members" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-TestResult "Admin Members API" "PASS" "Returns admin data"
    } else {
        Write-TestResult "Admin Members API" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Admin Members API" "FAIL" "Exception: $($_.Exception.Message)"
}

# 2. DATABASE OPERATION VALIDATION
Write-Host "`n=== DATABASE OPERATION VALIDATION ===" -ForegroundColor Cyan

# Test User Registration Completion
try {
    $body = @{
        memberCode = "5551111111"
        phone = "5551111111"
        name = "User One"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/user/complete-registration" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.success) {
            Write-TestResult "User Registration Completion" "PASS" "Registration updates database"
        } else {
            Write-TestResult "User Registration Completion" "FAIL" "Registration failed: $($data.message)"
        }
    } else {
        Write-TestResult "User Registration Completion" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "User Registration Completion" "FAIL" "Exception: $($_.Exception.Message)"
}

# Test Invite Sending
try {
    $body = @{
        memberCode = "5127715877"
        invitedName = "Test User"
        invitedPhone = "5559999999"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/invites/send" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.success) {
            Write-TestResult "Invite Sending" "PASS" "Invite created in database"
        } else {
            Write-TestResult "Invite Sending" "FAIL" "Invite creation failed: $($data.message)"
        }
    } else {
        Write-TestResult "Invite Sending" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Invite Sending" "FAIL" "Exception: $($_.Exception.Message)"
}

# 3. FRONTEND COMPONENT VALIDATION
Write-Host "`n=== FRONTEND COMPONENT VALIDATION ===" -ForegroundColor Cyan

# Test Member Dashboard Loading
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/member-dashboard?memberCode=5551111111" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        if ($response.Content -match "Welcome, User One") {
            Write-TestResult "Member Dashboard Loading" "PASS" "Dashboard loads with user data"
        } else {
            Write-TestResult "Member Dashboard Loading" "WARN" "Dashboard loads but user data may be missing"
        }
    } else {
        Write-TestResult "Member Dashboard Loading" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Member Dashboard Loading" "FAIL" "Exception: $($_.Exception.Message)"
}

# Test Admin Dashboard Loading
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/admin-dashboard" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        if ($response.Content -match "Admin Dashboard") {
            Write-TestResult "Admin Dashboard Loading" "PASS" "Admin dashboard loads correctly"
        } else {
            Write-TestResult "Admin Dashboard Loading" "WARN" "Admin dashboard loads but content may be missing"
        }
    } else {
        Write-TestResult "Admin Dashboard Loading" "FAIL" "HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Admin Dashboard Loading" "FAIL" "Exception: $($_.Exception.Message)"
}

# 4. DATA INTEGRITY VALIDATION
Write-Host "`n=== DATA INTEGRITY VALIDATION ===" -ForegroundColor Cyan

# Test User One's Data Integrity
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/user/profile?memberCode=5551111111" -Method GET -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    
    $issues = @()
    if (-not $data.profile.sponsorId) { $issues += "Missing sponsorId" }
    if (-not $data.profile.sponsorName) { $issues += "Missing sponsorName" }
    if ($data.profile.status -ne "registered") { $issues += "Status not registered" }
    if (-not $data.profile.profilePicture -or $data.profile.profilePicture.Length -lt 100) { $issues += "Missing or invalid profile picture" }
    
    if ($issues.Count -eq 0) {
        Write-TestResult "User One Data Integrity" "PASS" "All required fields present"
    } else {
        Write-TestResult "User One Data Integrity" "FAIL" "Missing: $($issues -join ', ')"
    }
} catch {
    Write-TestResult "User One Data Integrity" "FAIL" "Exception: $($_.Exception.Message)"
}

# Test Spencer's Data Integrity
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/user/profile?memberCode=5127715877" -Method GET -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    
    $issues = @()
    if (-not $data.profile.sponsorId) { $issues += "Missing sponsorId" }
    if (-not $data.profile.sponsorName) { $issues += "Missing sponsorName" }
    if ($data.profile.status -ne "registered") { $issues += "Status not registered" }
    if (-not $data.profile.profilePicture -or $data.profile.profilePicture.Length -lt 100) { $issues += "Missing or invalid profile picture" }
    
    if ($issues.Count -eq 0) {
        Write-TestResult "Spencer Data Integrity" "PASS" "All required fields present"
    } else {
        Write-TestResult "Spencer Data Integrity" "FAIL" "Missing: $($issues -join ', ')"
    }
} catch {
    Write-TestResult "Spencer Data Integrity" "FAIL" "Exception: $($_.Exception.Message)"
}

# 5. TRUST BONDS VALIDATION
Write-Host "`n=== TRUST BONDS VALIDATION ===" -ForegroundColor Cyan

# Test Trust Bond Relationship
try {
    $userOneResponse = Invoke-WebRequest -Uri "$BaseUrl/api/user/profile?memberCode=5551111111" -Method GET -TimeoutSec 10
    $userOneData = $userOneResponse.Content | ConvertFrom-Json
    
    $spencerResponse = Invoke-WebRequest -Uri "$BaseUrl/api/user/profile?memberCode=5127715877" -Method GET -TimeoutSec 10
    $spencerData = $spencerResponse.Content | ConvertFrom-Json
    
    if ($userOneData.profile.sponsorId -eq "5127715877" -and $userOneData.profile.sponsorName -eq "Spencer Wendt") {
        Write-TestResult "Trust Bond Relationship" "PASS" "User One → Spencer relationship correct"
    } else {
        Write-TestResult "Trust Bond Relationship" "FAIL" "Trust bond relationship incorrect"
    }
} catch {
    Write-TestResult "Trust Bond Relationship" "FAIL" "Exception: $($_.Exception.Message)"
}

# 6. FINAL RESULTS
Write-Host "`n=== VALIDATION RESULTS ===" -ForegroundColor Magenta
Write-Host "Total Tests: $($TestResults.Total)" -ForegroundColor White
Write-Host "✅ Passed: $($TestResults.Passed)" -ForegroundColor Green
Write-Host "❌ Failed: $($TestResults.Failed)" -ForegroundColor Red
Write-Host "⚠️  Warnings: $($TestResults.Warnings)" -ForegroundColor Yellow

$successRate = [math]::Round(($TestResults.Passed / $TestResults.Total) * 100, 2)
Write-Host "`nSuccess Rate: $successRate%" -ForegroundColor Cyan

if ($TestResults.Failed -gt 0) {
    Write-Host "`n🚨 CRITICAL ISSUES FOUND - IMMEDIATE ATTENTION REQUIRED" -ForegroundColor Red
} elseif ($TestResults.Warnings -gt 0) {
    Write-Host "`n⚠️  WARNINGS FOUND - REVIEW RECOMMENDED" -ForegroundColor Yellow
} else {
    Write-Host "`n🎯 ALL SYSTEMS OPERATIONAL" -ForegroundColor Green
}

Write-Host "`nValidation complete. Check results above for any issues." -ForegroundColor White
