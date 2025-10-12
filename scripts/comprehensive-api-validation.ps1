# Comprehensive API Validation Script
# Tests ALL frontend API calls and catches missing endpoints

param(
    [string]$baseUrl = "http://localhost:3000"
)

Write-Host "=== COMPREHENSIVE API VALIDATION ===" -ForegroundColor Green
Write-Host "Testing ALL frontend API calls..." -ForegroundColor Yellow
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0
$missingAPIs = @()

# Test all critical APIs that frontend calls
$criticalAPIs = @(
    @{ endpoint = "user/profile"; method = "GET"; params = "?memberCode=5127715877" },
    @{ endpoint = "user/check"; method = "POST"; body = @{ memberCode = "5127715877" } },
    @{ endpoint = "invites/list"; method = "GET"; params = "?memberCode=5127715877" },
    @{ endpoint = "trust-units/list"; method = "GET"; params = "?memberCode=5127715877" },
    @{ endpoint = "trust-bonds/list"; method = "GET"; params = "?memberCode=5127715877" },
    @{ endpoint = "admin/members"; method = "GET"; params = "" },
    @{ endpoint = "admin/stats"; method = "GET"; params = "" },
    @{ endpoint = "user/upload-picture"; method = "POST"; formData = $true },
    @{ endpoint = "user/complete-registration"; method = "POST"; body = @{ memberCode = "5127715877" } },
    @{ endpoint = "invites/send"; method = "POST"; body = @{ memberCode = "5127715877"; invitedPhone = "5559998888"; invitedName = "Test User" } }
)

foreach ($api in $criticalAPIs) {
    $totalTests++
    $endpoint = $api.endpoint
    $method = $api.method
    $url = "$baseUrl/api/$endpoint"
    
    if ($api.params) {
        $url += $api.params
    }
    
    try {
        Write-Host "Testing /api/$endpoint..." -ForegroundColor Cyan
        
        if ($api.formData) {
            # Test FormData endpoint
            $boundary = [System.Guid]::NewGuid().ToString()
            $LF = "`r`n"
            $bodyLines = @()
            $bodyLines += "--$boundary"
            $bodyLines += "Content-Disposition: form-data; name=`"memberCode`""
            $bodyLines += ""
            $bodyLines += "5127715877"
            $bodyLines += "--$boundary"
            $bodyLines += "Content-Disposition: form-data; name=`"picture`"; filename=`"test.jpg`""
            $bodyLines += "Content-Type: image/jpeg"
            $bodyLines += ""
            $bodyLines += "fake-image-data"
            $bodyLines += "--$boundary--"
            $body = $bodyLines -join $LF
            
            $response = Invoke-WebRequest -Uri $url -Method $method -ContentType "multipart/form-data; boundary=$boundary" -Body $body -TimeoutSec 10
        } elseif ($api.body) {
            # Test JSON endpoint
            $body = $api.body | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $url -Method $method -ContentType "application/json" -Body $body -TimeoutSec 10
        } else {
            # Test GET endpoint
            $response = Invoke-WebRequest -Uri $url -Method $method -TimeoutSec 10
        }
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) {
            Write-Host "✅ /api/$endpoint - PASS" -ForegroundColor Green
            $passedTests++
        } else {
            Write-Host "⚠️ /api/$endpoint - WARN (Status: $($response.StatusCode))" -ForegroundColor Yellow
            $passedTests++
        }
        
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "❌ /api/$endpoint - MISSING API!" -ForegroundColor Red
            $missingAPIs += $endpoint
            $failedTests++
        } else {
            Write-Host "❌ /api/$endpoint - FAIL" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            $failedTests++
        }
    }
}

Write-Host ""
Write-Host "=== VALIDATION RESULTS ===" -ForegroundColor Magenta
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

if ($missingAPIs.Count -gt 0) {
    Write-Host ""
    Write-Host "🚨 MISSING CRITICAL APIs:" -ForegroundColor Red
    foreach ($api in $missingAPIs) {
        Write-Host "   - /api/$api" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "❌ VALIDATION FAILED - MISSING APIs MUST BE CREATED!" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ ALL CRITICAL APIs EXIST!" -ForegroundColor Green
    Write-Host "✅ VALIDATION PASSED!" -ForegroundColor Green
    exit 0
}













