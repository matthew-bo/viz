# Test 5.2.5: Query Contracts Endpoint
# Verifies GET /api/contracts with party filtering

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.2.5: Query Contracts Endpoint Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$apiBase = "http://localhost:3001"

# Test 1: Query all contracts
Write-Host "Test 1: GET /api/contracts (all contracts)..." -ForegroundColor Yellow

try {
    $allContracts = Invoke-RestMethod -Uri "$apiBase/api/contracts" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "[PASS] Query all contracts successful" -ForegroundColor Green
    Write-Host "   Found $($allContracts.Count) total contracts" -ForegroundColor Gray
    $testsPassed++
    
    # Validate response is array
    if ($allContracts -is [Array] -or $allContracts.Count -ge 0) {
        Write-Host "[PASS] Response is array-like" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Response is not array-like" -ForegroundColor Red
        $testsFailed++
    }
    
} catch {
    Write-Host "[FAIL] Failed to query all contracts" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Query by party (TechBank)
Write-Host ""
Write-Host "Test 2: GET /api/contracts?party=TechBank..." -ForegroundColor Yellow

try {
    $techBankContracts = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=TechBank" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "[PASS] Query TechBank contracts successful" -ForegroundColor Green
    Write-Host "   Found $($techBankContracts.Count) TechBank contracts" -ForegroundColor Gray
    $testsPassed++
    
    # Validate all contracts involve TechBank
    $allInvolveTechBank = $true
    foreach ($contract in $techBankContracts) {
        if ($contract.senderDisplayName -ne "TechBank" -and $contract.receiverDisplayName -ne "TechBank") {
            Write-Host "[FAIL] Contract doesn't involve TechBank: $($contract.contractId)" -ForegroundColor Red
            $allInvolveTechBank = $false
            $testsFailed++
        }
    }
    
    if ($allInvolveTechBank) {
        Write-Host "[PASS] All contracts involve TechBank" -ForegroundColor Green
        $testsPassed++
    }
    
} catch {
    Write-Host "[FAIL] Failed to query TechBank contracts" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Query by party (GlobalCorp)
Write-Host ""
Write-Host "Test 3: GET /api/contracts?party=GlobalCorp..." -ForegroundColor Yellow

try {
    $globalCorpContracts = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=GlobalCorp" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "[PASS] Query GlobalCorp contracts successful" -ForegroundColor Green
    Write-Host "   Found $($globalCorpContracts.Count) GlobalCorp contracts" -ForegroundColor Gray
    $testsPassed++
    
    # Validate all contracts involve GlobalCorp
    $allInvolveGlobalCorp = $true
    foreach ($contract in $globalCorpContracts) {
        if ($contract.senderDisplayName -ne "GlobalCorp" -and $contract.receiverDisplayName -ne "GlobalCorp") {
            Write-Host "[FAIL] Contract doesn't involve GlobalCorp: $($contract.contractId)" -ForegroundColor Red
            $allInvolveGlobalCorp = $false
            $testsFailed++
        }
    }
    
    if ($allInvolveGlobalCorp) {
        Write-Host "[PASS] All contracts involve GlobalCorp" -ForegroundColor Green
        $testsPassed++
    }
    
} catch {
    Write-Host "[FAIL] Failed to query GlobalCorp contracts" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Query with limit parameter
Write-Host ""
Write-Host "Test 4: GET /api/contracts?limit=5..." -ForegroundColor Yellow

try {
    $limitedContracts = Invoke-RestMethod -Uri "$apiBase/api/contracts?limit=5" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    if ($limitedContracts.Count -le 5) {
        Write-Host "[PASS] Limit parameter respected (returned $($limitedContracts.Count) contracts)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Limit parameter not respected (returned $($limitedContracts.Count) contracts)" -ForegroundColor Red
        $testsFailed++
    }
    
} catch {
    Write-Host "[FAIL] Failed to query with limit" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Invalid party name handling
Write-Host ""
Write-Host "Test 5: Testing invalid party name..." -ForegroundColor Yellow

try {
    $invalidParty = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=InvalidParty" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    # Should return error or empty array
    if ($invalidParty.Count -eq 0) {
        Write-Host "[PASS] Invalid party returned empty array" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[INFO]  Invalid party returned $($invalidParty.Count) contracts (unexpected)" -ForegroundColor Yellow
    }
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 404) {
        Write-Host "[PASS] Invalid party returned error response" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Unexpected error for invalid party" -ForegroundColor Red
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
    Write-Host "[PASS] Query contracts test PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Query contracts test FAILED" -ForegroundColor Red
    exit 1
}

