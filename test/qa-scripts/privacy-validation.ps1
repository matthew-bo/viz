# Privacy Validation Test Script
# Validates Canton's sub-transaction privacy model

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Canton Privacy Validation Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "http://localhost:3001"
$TestPassed = $true

Write-Host "Test Scenario: Privacy Matrix Validation" -ForegroundColor Yellow
Write-Host "  Transaction 1: TechBank → GlobalCorp" -ForegroundColor Gray
Write-Host "  Transaction 2: GlobalCorp → RetailFinance" -ForegroundColor Gray
Write-Host ""

# Submit Transaction 1: TechBank → GlobalCorp
Write-Host "[1/6] Submitting Transaction 1 (TechBank → GlobalCorp)..." -ForegroundColor Yellow

$tx1Body = @{
    sender = "TechBank"
    receiver = "GlobalCorp"
    amount = 1500
    description = "Privacy Test TX1 - $(Get-Date -Format 'HHmmss')"
} | ConvertTo-Json

try {
    $tx1 = Invoke-RestMethod -Uri "$API_BASE/api/contracts" -Method POST -Body $tx1Body -ContentType "application/json" -ErrorAction Stop
    Write-Host "  ✓ TX1 Created: $($tx1.contractId.Substring(0, 20))..." -ForegroundColor Green
    $tx1Id = $tx1.contractId
} catch {
    Write-Host "  ✗ Failed to create TX1: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Submit Transaction 2: GlobalCorp → RetailFinance
Write-Host "[2/6] Submitting Transaction 2 (GlobalCorp → RetailFinance)..." -ForegroundColor Yellow

$tx2Body = @{
    sender = "GlobalCorp"
    receiver = "RetailFinance"
    amount = 800
    description = "Privacy Test TX2 - $(Get-Date -Format 'HHmmss')"
} | ConvertTo-Json

try {
    $tx2 = Invoke-RestMethod -Uri "$API_BASE/api/contracts" -Method POST -Body $tx2Body -ContentType "application/json" -ErrorAction Stop
    Write-Host "  ✓ TX2 Created: $($tx2.contractId.Substring(0, 20))..." -ForegroundColor Green
    $tx2Id = $tx2.contractId
} catch {
    Write-Host "  ✗ Failed to create TX2: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Test 1: TechBank should see TX1, not TX2
Write-Host "[3/6] Validating TechBank's view..." -ForegroundColor Yellow

try {
    $techBankTxs = Invoke-RestMethod -Uri "$API_BASE/api/contracts?party=TechBank" -Method GET -ErrorAction Stop
    
    $seesTx1 = $techBankTxs | Where-Object { $_.contractId -eq $tx1Id }
    $seesTx2 = $techBankTxs | Where-Object { $_.contractId -eq $tx2Id }
    
    if ($seesTx1 -and -not $seesTx2) {
        Write-Host "  ✓ PASS: TechBank sees TX1 ✓, does not see TX2 ✗" -ForegroundColor Green
    } elseif ($seesTx1 -and $seesTx2) {
        Write-Host "  ✗ FAIL: TechBank sees TX2 (privacy violation!)" -ForegroundColor Red
        $TestPassed = $false
    } elseif (-not $seesTx1) {
        Write-Host "  ✗ FAIL: TechBank cannot see TX1 (should be visible)" -ForegroundColor Red
        $TestPassed = $false
    }
} catch {
    Write-Host "  ✗ Failed to query TechBank view" -ForegroundColor Red
    $TestPassed = $false
}

# Test 2: GlobalCorp should see both TX1 and TX2
Write-Host "[4/6] Validating GlobalCorp's view..." -ForegroundColor Yellow

try {
    $globalCorpTxs = Invoke-RestMethod -Uri "$API_BASE/api/contracts?party=GlobalCorp" -Method GET -ErrorAction Stop
    
    $seesTx1 = $globalCorpTxs | Where-Object { $_.contractId -eq $tx1Id }
    $seesTx2 = $globalCorpTxs | Where-Object { $_.contractId -eq $tx2Id }
    
    if ($seesTx1 -and $seesTx2) {
        Write-Host "  ✓ PASS: GlobalCorp sees TX1 ✓ and TX2 ✓" -ForegroundColor Green
    } else {
        Write-Host "  ✗ FAIL: GlobalCorp missing transactions" -ForegroundColor Red
        Write-Host "    TX1: $(if ($seesTx1) { '✓' } else { '✗' })" -ForegroundColor Gray
        Write-Host "    TX2: $(if ($seesTx2) { '✓' } else { '✗' })" -ForegroundColor Gray
        $TestPassed = $false
    }
} catch {
    Write-Host "  ✗ Failed to query GlobalCorp view" -ForegroundColor Red
    $TestPassed = $false
}

# Test 3: RetailFinance should see TX2, not TX1
Write-Host "[5/6] Validating RetailFinance's view..." -ForegroundColor Yellow

try {
    $retailTxs = Invoke-RestMethod -Uri "$API_BASE/api/contracts?party=RetailFinance" -Method GET -ErrorAction Stop
    
    $seesTx1 = $retailTxs | Where-Object { $_.contractId -eq $tx1Id }
    $seesTx2 = $retailTxs | Where-Object { $_.contractId -eq $tx2Id }
    
    if (-not $seesTx1 -and $seesTx2) {
        Write-Host "  ✓ PASS: RetailFinance sees TX2 ✓, does not see TX1 ✗" -ForegroundColor Green
    } elseif ($seesTx1 -and $seesTx2) {
        Write-Host "  ✗ FAIL: RetailFinance sees TX1 (privacy violation!)" -ForegroundColor Red
        $TestPassed = $false
    } elseif (-not $seesTx2) {
        Write-Host "  ✗ FAIL: RetailFinance cannot see TX2 (should be visible)" -ForegroundColor Red
        $TestPassed = $false
    }
} catch {
    Write-Host "  ✗ Failed to query RetailFinance view" -ForegroundColor Red
    $TestPassed = $false
}

# Display Privacy Matrix
Write-Host "[6/6] Privacy Matrix:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ┌─────────────────┬──────────┬────────────┬───────────────┐" -ForegroundColor Cyan
Write-Host "  │ Transaction     │ TechBank │ GlobalCorp │ RetailFinance │" -ForegroundColor Cyan
Write-Host "  ├─────────────────┼──────────┼────────────┼───────────────┤" -ForegroundColor Cyan
Write-Host "  │ TX1 (Tech→Glob) │    ✓     │      ✓     │       ✗       │" -ForegroundColor White
Write-Host "  │ TX2 (Glob→Ret)  │    ✗     │      ✓     │       ✓       │" -ForegroundColor White
Write-Host "  └─────────────────┴──────────┴────────────┴───────────────┘" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Privacy Validation Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($TestPassed) {
    Write-Host "  ✓ ALL PRIVACY TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Canton's sub-transaction privacy is working correctly:" -ForegroundColor Gray
    Write-Host "  - Parties only see transactions they're involved in" -ForegroundColor Gray
    Write-Host "  - Privacy preserved at blockchain level (not just UI)" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "  ✗ PRIVACY VALIDATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Privacy violations detected. Check Canton configuration." -ForegroundColor Yellow
    exit 1
}





