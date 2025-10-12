# CODE PROTECTION SYSTEM
# Prevents accidental modification of working code
# Scans for PROTECTED markers and alerts on changes

param(
    [string]$action = "scan",  # scan, protect, validate
    [string]$filePath = "",
    [string]$functionName = ""
)

Write-Host "=== CODE PROTECTION SYSTEM ===" -ForegroundColor Green
Write-Host "Protecting working code from accidental modifications..." -ForegroundColor Yellow
Write-Host ""

# Protection markers
$PROTECTION_MARKER = "// 🔒 PROTECTED CODE - DO NOT MODIFY"
$PROTECTION_END = "// 🔓 END PROTECTED CODE"

function Protect-Function {
    param($filePath, $functionName)
    
    Write-Host "Protecting function: $functionName in $filePath" -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    $lines = $content -split "`n"
    $newLines = @()
    $inProtectedSection = $false
    $functionFound = $false
    
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        
        # Check if this is the function we want to protect
        if ($line -match "function\s+$functionName|export\s+async\s+function\s+$functionName|const\s+$functionName\s*=") {
            $functionFound = $true
            $newLines += $PROTECTION_MARKER
            $newLines += $line
            $inProtectedSection = $true
            continue
        }
        
        # If we're in a protected section, check for function end
        if ($inProtectedSection) {
            $newLines += $line
            
            # Check for function end (closing brace at start of line or end of function)
            if ($line -match "^\s*}\s*$" -and $functionFound) {
                $newLines += $PROTECTION_END
                $inProtectedSection = $false
                $functionFound = $false
            }
        } else {
            $newLines += $line
        }
    }
    
    $newContent = $newLines -join "`n"
    Set-Content -Path $filePath -Value $newContent -NoNewline
    Write-Host "✅ Function protected!" -ForegroundColor Green
}

function Scan-ProtectedCode {
    Write-Host "Scanning for protected code..." -ForegroundColor Cyan
    
    $protectedFiles = @()
    $apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts"
    
    foreach ($file in $apiFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match $PROTECTION_MARKER) {
            $protectedFiles += $file.FullName
            Write-Host "🔒 Protected file: $($file.Name)" -ForegroundColor Green
        }
    }
    
    return $protectedFiles
}

function Validate-ProtectedCode {
    Write-Host "Validating protected code integrity..." -ForegroundColor Cyan
    
    $violations = @()
    $apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts"
    
    foreach ($file in $apiFiles) {
        $content = Get-Content $file.FullName -Raw
        
        if ($content -match $PROTECTION_MARKER) {
            # Check if protection markers are intact
            $markerCount = ($content | Select-String $PROTECTION_MARKER).Count
            $endCount = ($content | Select-String $PROTECTION_END).Count
            
            if ($markerCount -ne $endCount) {
                $violations += "❌ $($file.Name) - Protection markers mismatch!"
            }
            
            # Check for common destructive patterns in protected sections
            $protectedSections = $content -split $PROTECTION_MARKER
            for ($i = 1; $i -lt $protectedSections.Length; $i += 2) {
                $section = $protectedSections[$i]
                if ($section -match "DELETE|REMOVE|CLEAR|DESTROY" -and $section -notmatch "//.*DELETE|//.*REMOVE") {
                    $violations += "⚠️ $($file.Name) - Destructive operation in protected section!"
                }
            }
        }
    }
    
    if ($violations.Count -gt 0) {
        Write-Host "🚨 PROTECTION VIOLATIONS DETECTED:" -ForegroundColor Red
        foreach ($violation in $violations) {
            Write-Host "   $violation" -ForegroundColor Red
        }
        return $false
    } else {
        Write-Host "✅ All protected code is intact!" -ForegroundColor Green
        return $true
    }
}

# Main execution
switch ($action) {
    "protect" {
        if ($filePath -and $functionName) {
            Protect-Function -filePath $filePath -functionName $functionName
        } else {
            Write-Host "Usage: .\code-protection-system.ps1 -action protect -filePath 'path' -functionName 'name'" -ForegroundColor Yellow
        }
    }
    "scan" {
        $protectedFiles = Scan-ProtectedCode
        Write-Host "Found $($protectedFiles.Count) protected files" -ForegroundColor White
    }
    "validate" {
        $isValid = Validate-ProtectedCode
        if (-not $isValid) {
            Write-Host "❌ PROTECTION VALIDATION FAILED!" -ForegroundColor Red
            exit 1
        } else {
            Write-Host "✅ PROTECTION VALIDATION PASSED!" -ForegroundColor Green
            exit 0
        }
    }
    default {
        Write-Host "Usage: .\code-protection-system.ps1 -action [scan|protect|validate]" -ForegroundColor Yellow
    }
}













