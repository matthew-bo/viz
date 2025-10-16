# Test 5.3.1: Two-Party Privacy Test
# Verifies that a transaction between two parties is not visible to a third party

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.3.1: Two-Party Privacy Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$apiBase = "http://localhost:3001"

# Test Scenario: TechBank -> GlobalCorp transaction
# Expected: TechBank sees it, GlobalCorp sees it, RetailFinance does NOT see it

Write-Host "Scenario: TechBank sends `$5000 to GlobalCorp" -ForegroundColor Yellow
Write-Host "Expected Privacy: TechBank [PASS], GlobalCorp [PASS], RetailFinance [FAIL]" -ForegroundColor Yellow
Write-Host ""

# Step 1: Submit transaction
Write-Host "Step 1: Submitting transaction..." -ForegroundColor Yellow

$testTransaction = @{
    sender = "TechBank"
    receiver = "GlobalCorp"
    amount = 5000
    description = "Privacy Test - Two Party"
} | ConvertTo-Json

try {
    $submitResponse = Invoke-RestMethod -Uri "$apiBase/api/contracts" `
        -Method Post `
        -Body $testTransaction `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $contractId = $submitResponse.contractId
    Write-Host "[PASS] Transaction submitted: $contractId" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "[FAIL] Failed to submit transaction" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Wait for Canton to process
Start-Sleep -Seconds 2

# Step 2: Verify TechBank can see it
Write-Host ""
Write-Host "Step 2: Checking TechBank visibility..." -ForegroundColor Yellow

try {
    $techBankView = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=TechBank" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    $techBankSees = $techBankView | Where-Object { $_.contractId -eq $contractId }
    
    if ($techBankSees) {
        Write-Host "[PASS] TechBank can see the transaction (CORRECT - sender)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] TechBank cannot see the transaction (INCORRECT - should see as sender)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "[FAIL] Failed to query TechBank view" -ForegroundColor Red
    $testsFailed++
}

# Step 3: Verify GlobalCorp can see it
Write-Host ""
Write-Host "Step 3: Checking GlobalCorp visibility..." -ForegroundColor Yellow

try {
    $globalCorpView = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=GlobalCorp" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    $globalCorpSees = $globalCorpView | Where-Object { $_.contractId -eq $contractId }
    
    if ($globalCorpSees) {
        Write-Host "[PASS] GlobalCorp can see the transaction (CORRECT - receiver)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] GlobalCorp cannot see the transaction (INCORRECT - should see as receiver)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "[FAIL] Failed to query GlobalCorp view" -ForegroundColor Red
    $testsFailed++
}

# Step 4: Verify RetailFinance CANNOT see it (CRITICAL PRIVACY TEST)
Write-Host ""
Write-Host "Step 4: Checking RetailFinance visibility (CRITICAL)..." -ForegroundColor Yellow

try {
    $retailFinanceView = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=RetailFinance" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    $retailFinanceSees = $retailFinanceView | Where-Object { $_.contractId -eq $contractId }
    
    if ($retailFinanceSees) {
        Write-Host "[FAIL] RetailFinance CAN see the transaction (PRIVACY VIOLATION!)" -ForegroundColor Red
        Write-Host "   This indicates Canton privacy is NOT working correctly" -ForegroundColor Red
        $testsFailed++
    } else {
        Write-Host "[PASS] RetailFinance CANNOT see the transaction (CORRECT - privacy enforced)" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "[FAIL] Failed to query RetailFinance view" -ForegroundColor Red
    $testsFailed++
}

# Step 5: Accept the transaction and verify privacy persists
Write-Host ""
Write-Host "Step 5: Accepting transaction and re-checking privacy..." -ForegroundColor Yellow

$acceptBody = @{
    receiver = "GlobalCorp"
} | ConvertTo-Json

try {
    $acceptResponse = Invoke-RestMethod -Uri "$apiBase/api/contracts/$contractId/accept" `
        -Method Post `
        -Body $acceptBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "[PASS] Transaction accepted (now committed)" -ForegroundColor Green
    $testsPassed++
    
    # Wait for Canton to process
    Start-Sleep -Seconds 2
    
    # Re-check RetailFinance visibility for committed transaction
    $retailFinanceViewCommitted = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=RetailFinance" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    $retailFinanceSeesCommitted = $retailFinanceViewCommitted | Where-Object { 
        $_.payload.sender -match "TechBank" -and 
        $_.payload.receiver -match "GlobalCorp" -and 
        $_.payload.amount -eq "5000"
    }
    
    if ($retailFinanceSeesCommitted) {
        Write-Host "[FAIL] RetailFinance CAN see committed Payment (PRIVACY VIOLATION!)" -ForegroundColor Red
        $testsFailed++
    } else {
        Write-Host "[PASS] RetailFinance still CANNOT see committed Payment (CORRECT)" -ForegroundColor Green
        $testsPassed++
    }
    
} catch {
    Write-Host "[FAIL] Failed to accept transaction or verify privacy" -ForegroundColor Red
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
    Write-Host "[PASS] Two-party privacy test PASSED" -ForegroundColor Green
    Write-Host "  Canton privacy is working correctly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Two-party privacy test FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "CRITICAL: Privacy violation detected!" -ForegroundColor Red
    Write-Host "This indicates Canton ledger is not enforcing privacy correctly." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify party IDs are correct in backend/.env"
    Write-Host "2. Check Canton participant logs for errors"
    Write-Host "3. Re-initialize Canton network"
    exit 1
}

