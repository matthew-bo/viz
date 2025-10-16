# Master Test Runner for Phase 5: Integration Testing
# Runs all automated tests in sequence

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Phase 5: Integration Testing - Master Test Runner" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0
$startTime = Get-Date

# Test Results Log
$logFile = "test\test-results-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"
$testResults = @()

function Run-Test {
    param(
        [string]$TestName,
        [string]$TestScript,
        [string]$Category
    )
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "Running: $TestName" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $testStart = Get-Date
    
    try {
        $output = & $TestScript 2>&1
        $exitCode = $LASTEXITCODE
        $testEnd = Get-Date
        $duration = ($testEnd - $testStart).TotalSeconds
        
        $result = @{
            Name = $TestName
            Category = $Category
            Status = if ($exitCode -eq 0) { "PASSED" } else { "FAILED" }
            Duration = [math]::Round($duration, 2)
            ExitCode = $exitCode
            Output = $output -join "`n"
        }
        
        $script:testResults += $result
        
        if ($exitCode -eq 0) {
            Write-Host ""
            Write-Host "[PASS] $TestName ($([math]::Round($duration, 2))s)" -ForegroundColor Green
            $script:passedTests++
        } else {
            Write-Host ""
            Write-Host "[FAIL] $TestName ($([math]::Round($duration, 2))s)" -ForegroundColor Red
            $script:failedTests++
        }
    } catch {
        $result = @{
            Name = $TestName
            Category = $Category
            Status = "ERROR"
            Duration = 0
            ExitCode = -1
            Output = $_.Exception.Message
        }
        
        $script:testResults += $result
        
        Write-Host ""
        Write-Host "[ERROR] $TestName : $_" -ForegroundColor Red
        $script:failedTests++
    }
    
    $script:totalTests++
}

function Round($value, $decimals) {
    [math]::Round($value, $decimals)
}

# PRE-FLIGHT CHECK
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Pre-Flight Checks" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow

Write-Host ""
Write-Host "Verifying prerequisites..." -ForegroundColor Yellow

& .\test\utils\verify-backend.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[FAIL] Pre-flight checks FAILED" -ForegroundColor Red
    Write-Host "Please fix issues before running tests" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[PASS] Pre-flight checks PASSED" -ForegroundColor Green
Start-Sleep -Seconds 2

# SECTION 5.1: INFRASTRUCTURE TESTS
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Section 5.1: Infrastructure Health Checks" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Run-Test "5.1.1: Canton Containers" ".\test\1-infrastructure\test-containers.ps1" "Infrastructure"
Run-Test "5.1.2: Canton Domain" ".\test\1-infrastructure\test-domain.ps1" "Infrastructure"
Run-Test "5.1.3: Party Verification" ".\test\1-infrastructure\test-parties.ps1" "Infrastructure"
Run-Test "5.1.4: DAR Upload" ".\test\1-infrastructure\test-dar-upload.ps1" "Infrastructure"

# SECTION 5.2: API TESTS
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Section 5.2: API Integration Tests" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Run-Test "5.2.1: Health Endpoint" ".\test\2-api\test-health.ps1" "API"
Run-Test "5.2.2: Parties Endpoint" ".\test\2-api\test-parties-endpoint.ps1" "API"
Run-Test "5.2.3: Submit Contract" ".\test\2-api\test-contracts-submit.ps1" "API"
Run-Test "5.2.4: Accept Contract" ".\test\2-api\test-contracts-accept.ps1" "API"
Run-Test "5.2.5: Query Contracts" ".\test\2-api\test-contracts-query.ps1" "API"
Run-Test "5.2.6: SSE Endpoint" ".\test\2-api\test-sse.ps1" "API"

# SECTION 5.3: PRIVACY TESTS
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Section 5.3: Privacy Validation Tests" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Run-Test "5.3.1: Two-Party Privacy" ".\test\3-privacy\test-two-party-privacy.ps1" "Privacy"
Run-Test "5.3.2: Visibility Matrix" ".\test\3-privacy\test-visibility-matrix.ps1" "Privacy"

# SUMMARY
$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Duration: $([math]::Round($totalDuration, 2)) seconds" -ForegroundColor White
Write-Host ""

# Calculate pass rate
$passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 75) { "Yellow" } else { "Red" })

# Display failed tests
if ($failedTests -gt 0) {
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor Red
    foreach ($test in $testResults) {
        if ($test.Status -ne "PASSED") {
            Write-Host "  [X] $($test.Name) ($($test.Category))" -ForegroundColor Red
        }
    }
}

# Manual test reminders
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Manual Testing Required" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "The following tests require manual verification:" -ForegroundColor White
Write-Host "  [INFO]  5.4: End-to-End UI Tests (see test/4-e2e/test-full-workflow.md)" -ForegroundColor Yellow
Write-Host "  [INFO]  5.5: Performance & Load Tests (visual inspection)" -ForegroundColor Yellow
Write-Host ""

# Save results to log file
Write-Host "Saving results to: $logFile" -ForegroundColor Gray

$logOutput = @"
═══════════════════════════════════════════════════════════
 Phase 5: Integration Testing Results
═══════════════════════════════════════════════════════════
Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Duration: $totalDuration seconds

SUMMARY:
  Total Tests: $totalTests
  Passed: $passedTests
  Failed: $failedTests
  Pass Rate: $passRate%

DETAILED RESULTS:
═══════════════════════════════════════════════════════════

"@

foreach ($test in $testResults) {
    $status = if ($test.Status -eq "PASSED") { "[PASS]" } else { "[FAIL]" }
    $logOutput += "$status [$($test.Category)] $($test.Name)`n"
    $logOutput += "   Status: $($test.Status)`n"
    $logOutput += "   Duration: $($test.Duration)s`n"
    if ($test.Status -ne "PASSED") {
        $logOutput += "   Output: $($test.Output.Substring(0, [Math]::Min(500, $test.Output.Length)))...`n"
    }
    $logOutput += "`n"
}

$logOutput | Out-File -FilePath $logFile -Encoding UTF8

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " End Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Exit with failure code if any tests failed
if ($failedTests -gt 0) {
    Write-Host "[FAIL] TESTING FAILED - $failedTests test(s) failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[PASS] ALL AUTOMATED TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Complete manual E2E testing (test/4-e2e/test-full-workflow.md)" -ForegroundColor White
    Write-Host "2. Run performance measurements" -ForegroundColor White
    Write-Host "3. Document results in test report" -ForegroundColor White
    Write-Host "4. Update IMPLEMENTATION_PLAN.md Phase 5 checklist" -ForegroundColor White
    Write-Host ""
    exit 0
}

