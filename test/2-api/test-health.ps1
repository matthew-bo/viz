# Test 5.2.1: Health Endpoint
# Verifies GET /health returns correct response

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.2.1: Health Endpoint Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$apiBase = "http://localhost:3001"

# Test 1: Health endpoint responds
Write-Host "Test 1: GET /health endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$apiBase/health" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "[PASS] Health endpoint responded" -ForegroundColor Green
    $testsPassed++
    
    # Test 2: Check response structure
    Write-Host ""
    Write-Host "Test 2: Validating response structure..." -ForegroundColor Yellow
    
    if ($response.status) {
        Write-Host "[PASS] Response has 'status' field: $($response.status)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Response missing 'status' field" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.timestamp) {
        Write-Host "[PASS] Response has 'timestamp' field: $($response.timestamp)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Response missing 'timestamp' field" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.version) {
        Write-Host "[PASS] Response has 'version' field: $($response.version)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Response missing 'version' field" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 3: Validate status value
    Write-Host ""
    Write-Host "Test 3: Checking health status..." -ForegroundColor Yellow
    
    if ($response.status -eq "healthy") {
        Write-Host "[PASS] Backend status: healthy" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Backend status: $($response.status) (expected: healthy)" -ForegroundColor Red
        $testsFailed++
    }
    
} catch {
    Write-Host "[FAIL] Health endpoint not accessible" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $testsFailed++
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
    Write-Host "[PASS] Health endpoint test PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Health endpoint test FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if backend is running: curl http://localhost:3001/health"
    Write-Host "2. Start backend: cd backend; npm run dev"
    Write-Host "3. Check backend logs for errors"
    exit 1
}

