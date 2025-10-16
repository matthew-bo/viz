# Test 5.2.4: Accept Contract Endpoint
# Verifies POST /api/contracts/:id/accept creates Payment correctly

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.2.4: Accept Contract Endpoint Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$apiBase = "http://localhost:3001"

# Get contract ID from submit test (or create new one)
$contractIdFile = "test/.last-contract-id.txt"

if (Test-Path $contractIdFile) {
    $contractId = Get-Content $contractIdFile -Raw
    Write-Host "Using contract ID from previous test: $contractId" -ForegroundColor Gray
} else {
    Write-Host "No contract ID found, creating new transaction..." -ForegroundColor Yellow
    
    $testTransaction = @{
        sender = "TechBank"
        receiver = "GlobalCorp"
        amount = 2000
        description = "API Test - Accept Flow"
    } | ConvertTo-Json
    
    try {
        $submitResponse = Invoke-RestMethod -Uri "$apiBase/api/contracts" `
            -Method Post `
            -Body $testTransaction `
            -ContentType "application/json" `
            -TimeoutSec 30 `
            -ErrorAction Stop
        
        $contractId = $submitResponse.contractId
        Write-Host "[PASS] Created new contract: $contractId" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Failed to create test contract" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        exit 1
    }
}

# Test 1: Accept transaction
Write-Host ""
Write-Host "Test 1: POST /api/contracts/$contractId/accept..." -ForegroundColor Yellow
Write-Host "   Accepting as GlobalCorp" -ForegroundColor Gray

$acceptBody = @{
    receiver = "GlobalCorp"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiBase/api/contracts/$contractId/accept" `
        -Method Post `
        -Body $acceptBody `
        -ContentType "application/json" `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "[PASS] Contract accepted successfully" -ForegroundColor Green
    $testsPassed++
    
    # Test 2: Validate response structure
    Write-Host ""
    Write-Host "Test 2: Validating response structure..." -ForegroundColor Yellow
    
    if ($response.contractId) {
        Write-Host "[PASS] Response has contractId: $($response.contractId)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Response missing contractId" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.templateId -eq "Payment:Payment") {
        Write-Host "[PASS] Correct templateId: Payment:Payment" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong templateId: $($response.templateId)" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.status -eq "committed") {
        Write-Host "[PASS] Status: committed" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong status: $($response.status)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 3: Validate timestamps
    Write-Host ""
    Write-Host "Test 3: Validating timestamps..." -ForegroundColor Yellow
    
    if ($response.payload.submittedAt) {
        Write-Host "[PASS] Has submittedAt: $($response.payload.submittedAt)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Missing submittedAt" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.payload.committedAt) {
        Write-Host "[PASS] Has committedAt: $($response.payload.committedAt)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Missing committedAt" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 4: Validate signatories
    Write-Host ""
    Write-Host "Test 4: Validating signatories..." -ForegroundColor Yellow
    
    if ($response.signatories.Count -eq 2) {
        Write-Host "[PASS] Has 2 signatories (sender + receiver)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Expected 2 signatories, found $($response.signatories.Count)" -ForegroundColor Red
        $testsFailed++
    }
    
} catch {
    Write-Host "[FAIL] Failed to accept contract" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Cleanup
if (Test-Path $contractIdFile) {
    Remove-Item $contractIdFile -Force
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
    Write-Host "[PASS] Accept contract test PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Accept contract test FAILED" -ForegroundColor Red
    exit 1
}

