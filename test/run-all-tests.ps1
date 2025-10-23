# Master Test Runner
# Executes all test categories in proper order

Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Canton Privacy Visualizer - Master Test Runner" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$StartTime = Get-Date
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0
$AllPassed = $true

# Function to run test phase
function Run-TestPhase {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [bool]$Required = $true
    )
    
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  Phase: $Name" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        & $Command
        
        if ($LASTEXITCODE -eq 0 -or -not $Required) {
            Write-Host ""
            Write-Host "  ✓ $Name PASSED" -ForegroundColor Green
            $script:PassedTests++
            return $true
        } else {
            Write-Host ""
            Write-Host "  ✗ $Name FAILED" -ForegroundColor Red
            $script:FailedTests++
            $script:AllPassed = $false
            return $false
        }
    } catch {
        Write-Host ""
        Write-Host "  ✗ $Name FAILED: $_" -ForegroundColor Red
        $script:FailedTests++
        $script:AllPassed = $false
        return $false
    }
    
    $script:TotalTests++
}

# Phase 1: System Health Check
Run-TestPhase -Name "System Health Check" -Command {
    & "$PSScriptRoot\qa-scripts\canton-health-check.ps1"
}

if (-not $AllPassed) {
    Write-Host ""
    Write-Host "✗ System health check failed. Cannot proceed with tests." -ForegroundColor Red
    exit 1
}

# Phase 2: Backend Unit Tests
Run-TestPhase -Name "Backend Unit Tests" -Command {
    Push-Location "$PSScriptRoot\..\backend"
    Write-Host "Running Jest unit tests..." -ForegroundColor Gray
    npm test -- --coverage --silent 2>&1 | Out-String | Write-Host
    $exitCode = $LASTEXITCODE
    Pop-Location
    exit $exitCode
}

# Phase 3: Backend Integration Tests
Run-TestPhase -Name "Backend Integration Tests" -Command {
    Push-Location "$PSScriptRoot\..\backend"
    Write-Host "Running integration tests (requires Canton + backend running)..." -ForegroundColor Gray
    
    # Check if backend is running
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        
        if ($response.status -ne "healthy") {
            Write-Host "⚠ Backend is degraded, but proceeding with tests..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Backend not running. Starting backend..." -ForegroundColor Yellow
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory (Get-Location).Path -WindowStyle Hidden
        Start-Sleep -Seconds 5
    }
    
    npm test -- test/integration/ --silent 2>&1 | Out-String | Write-Host
    $exitCode = $LASTEXITCODE
    Pop-Location
    exit $exitCode
}

# Phase 4: API Smoke Tests
Run-TestPhase -Name "API Smoke Tests" -Command {
    & "$PSScriptRoot\qa-scripts\api-smoke-test.ps1"
}

# Phase 5: Privacy Validation
Run-TestPhase -Name "Privacy Validation" -Command {
    & "$PSScriptRoot\qa-scripts\privacy-validation.ps1"
}

# Calculate duration
$EndTime = Get-Date
$Duration = $EndTime - $StartTime
$DurationFormatted = "{0:mm}m {0:ss}s" -f $Duration

# Final Summary
Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Execution Summary" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Test Phases Executed: $TotalTests" -ForegroundColor White
Write-Host "  Passed: $PassedTests" -ForegroundColor Green
Write-Host "  Failed: $FailedTests" -ForegroundColor Red
Write-Host "  Duration: $DurationFormatted" -ForegroundColor Gray
Write-Host ""

if ($AllPassed) {
    Write-Host "  ✓ ALL TEST PHASES PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "  System Status: READY FOR DEPLOYMENT" -ForegroundColor Green
    Write-Host ""
    
    # Display coverage summary if available
    if (Test-Path "$PSScriptRoot\..\backend\coverage\coverage-summary.json") {
        Write-Host "  Test Coverage Summary:" -ForegroundColor Yellow
        $coverage = Get-Content "$PSScriptRoot\..\backend\coverage\coverage-summary.json" | ConvertFrom-Json
        Write-Host "    Statements: $($coverage.total.statements.pct)%" -ForegroundColor Gray
        Write-Host "    Branches:   $($coverage.total.branches.pct)%" -ForegroundColor Gray
        Write-Host "    Functions:  $($coverage.total.functions.pct)%" -ForegroundColor Gray
        Write-Host "    Lines:      $($coverage.total.lines.pct)%" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review coverage report: .\backend\coverage\lcov-report\index.html" -ForegroundColor Gray
    Write-Host "  2. Run manual E2E tests (optional)" -ForegroundColor Gray
    Write-Host "  3. Deploy to production" -ForegroundColor Gray
    
    exit 0
} else {
    Write-Host "  ✗ SOME TEST PHASES FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  System Status: NOT READY FOR DEPLOYMENT" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed Phases:" -ForegroundColor Yellow
    
    # List failed phases (would need to track which ones failed)
    Write-Host "  Review output above for error details" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Canton containers: docker ps" -ForegroundColor Gray
    Write-Host "  2. Check backend logs: docker logs canton-participant1" -ForegroundColor Gray
    Write-Host "  3. Restart services if needed" -ForegroundColor Gray
    Write-Host "  4. Consult COMPREHENSIVE_TESTING_GUIDE.md" -ForegroundColor Gray
    
    exit 1
}
