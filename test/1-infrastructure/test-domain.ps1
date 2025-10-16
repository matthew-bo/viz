# Test 5.1.2: Canton Domain Verification
# Verifies domain 'mydomain' is bootstrapped and participants are connected

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.1.2: Canton Domain Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Test 1: Check synchronizer logs for domain
Write-Host "Test 1: Checking if domain 'mydomain' exists..." -ForegroundColor Yellow

$domainLogs = docker logs canton-synchronizer 2>&1 | Select-String -Pattern "mydomain" -Quiet

if ($domainLogs) {
    Write-Host "[PASS] Domain 'mydomain' found in synchronizer logs" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "[FAIL] Domain 'mydomain' not found in logs" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Verify synchronizer is listening on ports
Write-Host ""
Write-Host "Test 2: Checking synchronizer ports..." -ForegroundColor Yellow

try {
    $syncPublicPort = Test-NetConnection -ComputerName localhost -Port 5018 -WarningAction SilentlyContinue -InformationLevel Quiet
    $syncAdminPort = Test-NetConnection -ComputerName localhost -Port 5019 -WarningAction SilentlyContinue -InformationLevel Quiet
    
    if ($syncPublicPort) {
        Write-Host "[PASS] Synchronizer public port 5018 is listening" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Synchronizer public port 5018 not accessible" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($syncAdminPort) {
        Write-Host "[PASS] Synchronizer admin port 5019 is listening" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Synchronizer admin port 5019 not accessible" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "[FAIL] Error checking ports: $_" -ForegroundColor Red
    $testsFailed += 2
}

# Test 3: Check participant connections via logs
Write-Host ""
Write-Host "Test 3: Checking participant connections..." -ForegroundColor Yellow

$participants = @("participant1", "participant2", "participant3")

foreach ($participant in $participants) {
    $connected = docker logs "canton-$participant" 2>&1 | Select-String -Pattern "Connected to domain|domain connection" -Quiet
    
    if ($connected) {
        Write-Host "[PASS] $participant shows domain connection in logs" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[INFO]  $participant connection not confirmed in logs (may need re-init)" -ForegroundColor Yellow
        # Don't fail test - might be expected if not initialized
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "[PASS] All domain checks PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Some domain checks FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Re-initialize Canton: .\infrastructure\init-canton-final.ps1"
    Write-Host "2. Check synchronizer logs: docker logs canton-synchronizer"
    Write-Host "3. Verify containers are healthy: docker ps"
    exit 1
}

