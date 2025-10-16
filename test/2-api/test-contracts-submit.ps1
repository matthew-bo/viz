# Test 5.2.3: Submit Contract Endpoint
# Verifies POST /api/contracts creates PaymentRequest correctly

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.2.3: Submit Contract Endpoint Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$apiBase = "http://localhost:3001"

# Test data
$testTransaction = @{
    sender = "TechBank"
    receiver = "GlobalCorp"
    amount = 1000
    description = "API Test - Submit Contract"
} | ConvertTo-Json

# Test 1: Submit transaction
Write-Host "Test 1: POST /api/contracts..." -ForegroundColor Yellow
Write-Host "   Sending: TechBank -> GlobalCorp, `$1000" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$apiBase/api/contracts" `
        -Method Post `
        -Body $testTransaction `
        -ContentType "application/json" `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "[PASS] Contract submitted successfully" -ForegroundColor Green
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
    
    if ($response.templateId -eq "Payment:PaymentRequest") {
        Write-Host "[PASS] Correct templateId: Payment:PaymentRequest" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong templateId: $($response.templateId)" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.status -eq "pending") {
        Write-Host "[PASS] Status: pending" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong status: $($response.status)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 3: Validate payload
    Write-Host ""
    Write-Host "Test 3: Validating payload..." -ForegroundColor Yellow
    
    if ($response.payload.amount -eq "1000") {
        Write-Host "[PASS] Amount: 1000" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong amount: $($response.payload.amount)" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.payload.currency -eq "USD") {
        Write-Host "[PASS] Currency: USD" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong currency: $($response.payload.currency)" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.payload.description -eq "API Test - Submit Contract") {
        Write-Host "[PASS] Description: API Test - Submit Contract" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong description: $($response.payload.description)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 4: Validate display names
    Write-Host ""
    Write-Host "Test 4: Validating display names..." -ForegroundColor Yellow
    
    if ($response.senderDisplayName -eq "TechBank") {
        Write-Host "[PASS] Sender display name: TechBank" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong sender: $($response.senderDisplayName)" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($response.receiverDisplayName -eq "GlobalCorp") {
        Write-Host "[PASS] Receiver display name: GlobalCorp" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong receiver: $($response.receiverDisplayName)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Store contract ID for accept test
    $response.contractId | Out-File -FilePath "test/.last-contract-id.txt" -NoNewline
    Write-Host ""
    Write-Host "Saved contract ID for accept test: $($response.contractId)" -ForegroundColor Gray
    
} catch {
    Write-Host "[FAIL] Failed to submit contract" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Validate error handling (invalid data)
Write-Host ""
Write-Host "Test 5: Testing input validation..." -ForegroundColor Yellow

# Test invalid amount
$invalidTransaction = @{
    sender = "TechBank"
    receiver = "GlobalCorp"
    amount = -100
    description = "Invalid test"
} | ConvertTo-Json

try {
    $errorResponse = Invoke-RestMethod -Uri "$apiBase/api/contracts" `
        -Method Post `
        -Body $invalidTransaction `
        -ContentType "application/json" `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "[FAIL] Should have rejected negative amount" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[PASS] Correctly rejected negative amount (400 Bad Request)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $testsFailed++
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
    Write-Host "[PASS] Submit contract test PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Submit contract test FAILED" -ForegroundColor Red
    exit 1
}

