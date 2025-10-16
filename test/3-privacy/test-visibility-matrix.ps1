# Test 5.3.2: Complete Visibility Matrix Test
# Creates comprehensive privacy test with all party combinations

Write-Host ""
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host "  Test 5.3.2: Complete Visibility Matrix Test" -ForegroundColor Cyan
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$apiBase = "http://localhost:3001"

# Test Scenario: Create transactions for all party pairs
# Then verify visibility matrix matches expected Canton privacy model

Write-Host "Creating test transactions for all party combinations..." -ForegroundColor Yellow
Write-Host ""

$transactions = @(
    @{
        Name = "TX1"
        Sender = "TechBank"
        Receiver = "GlobalCorp"
        Amount = 1000
        Description = "Visibility Matrix Test 1"
    },
    @{
        Name = "TX2"
        Sender = "GlobalCorp"
        Receiver = "RetailFinance"
        Amount = 2000
        Description = "Visibility Matrix Test 2"
    },
    @{
        Name = "TX3"
        Sender = "RetailFinance"
        Receiver = "TechBank"
        Amount = 3000
        Description = "Visibility Matrix Test 3"
    }
)

$submittedContracts = @{}

# Step 1: Submit all transactions
Write-Host "Step 1: Submitting transactions..." -ForegroundColor Yellow

foreach ($tx in $transactions) {
    $body = @{
        sender = $tx.Sender
        receiver = $tx.Receiver
        amount = $tx.Amount
        description = $tx.Description
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$apiBase/api/contracts" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        $submittedContracts[$tx.Name] = @{
            ContractId = $response.contractId
            Sender = $tx.Sender
            Receiver = $tx.Receiver
            Amount = $tx.Amount
        }
        
        Write-Host "[PASS] $($tx.Name): $($tx.Sender) -> $($tx.Receiver), `$$($tx.Amount)" -ForegroundColor Green
        $testsPassed++
    } catch {
        Write-Host "[FAIL] Failed to submit $($tx.Name)" -ForegroundColor Red
        $testsFailed++
    }
}

# Wait for Canton to process
Start-Sleep -Seconds 3

# Step 2: Build visibility matrix
Write-Host ""
Write-Host "Step 2: Building visibility matrix..." -ForegroundColor Yellow
Write-Host ""

$parties = @("TechBank", "GlobalCorp", "RetailFinance")
$visibilityMatrix = @{}

foreach ($party in $parties) {
    try {
        $contracts = Invoke-RestMethod -Uri "$apiBase/api/contracts?party=$party" -Method Get -TimeoutSec 30 -ErrorAction Stop
        $visibilityMatrix[$party] = $contracts
    } catch {
        Write-Host "[FAIL] Failed to query contracts for $party" -ForegroundColor Red
        $testsFailed++
    }
}

# Step 3: Validate visibility matrix
Write-Host "Step 3: Validating visibility matrix..." -ForegroundColor Yellow
Write-Host ""

# Expected visibility matrix:
# TX1 (Tech->Global): Tech [PASS], Global [PASS], Retail [FAIL]
# TX2 (Global->Retail): Tech [FAIL], Global [PASS], Retail [PASS]
# TX3 (Retail->Tech): Tech [PASS], Global [FAIL], Retail [PASS]

$expectedVisibility = @{
    "TX1" = @{
        "TechBank" = $true
        "GlobalCorp" = $true
        "RetailFinance" = $false
    }
    "TX2" = @{
        "TechBank" = $false
        "GlobalCorp" = $true
        "RetailFinance" = $true
    }
    "TX3" = @{
        "TechBank" = $true
        "GlobalCorp" = $false
        "RetailFinance" = $true
    }
}

# Display matrix header
Write-Host "Visibility Matrix:" -ForegroundColor Cyan
Write-Host "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Cyan
Write-Host ("{0,-6} {1,-15} {2,-15} {3,-15}" -f "TX", "TechBank", "GlobalCorp", "RetailFinance") -ForegroundColor Cyan
Write-Host "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Cyan

foreach ($txName in @("TX1", "TX2", "TX3")) {
    $txData = $submittedContracts[$txName]
    $contractId = $txData.ContractId
    
    $row = "{0,-6} " -f $txName
    
    foreach ($party in $parties) {
        $canSee = $visibilityMatrix[$party] | Where-Object { $_.contractId -eq $contractId }
        $expected = $expectedVisibility[$txName][$party]
        
        if ($canSee -and $expected) {
            $row += "{0,-15} " -f "[PASS] (CORRECT)"
            $testsPassed++
        } elseif (-not $canSee -and -not $expected) {
            $row += "{0,-15} " -f "[FAIL] (CORRECT)"
            $testsPassed++
        } elseif ($canSee -and -not $expected) {
            $row += "{0,-15} " -f "[PASS] (VIOLATION!)"
            $testsFailed++
        } else {
            $row += "{0,-15} " -f "[FAIL] (MISSING!)"
            $testsFailed++
        }
    }
    
    Write-Host $row
}

Write-Host "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Cyan
Write-Host ""
Write-Host "Legend:" -ForegroundColor Gray
Write-Host "  [PASS] (CORRECT) = Party can see (as expected)" -ForegroundColor Gray
Write-Host "  [FAIL] (CORRECT) = Party cannot see (as expected)" -ForegroundColor Gray
Write-Host "  [PASS] (VIOLATION!) = Party can see but shouldn't (PRIVACY BUG)" -ForegroundColor Gray
Write-Host "  [FAIL] (MISSING!) = Party should see but can't (VISIBILITY BUG)" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "[PASS] Visibility matrix test PASSED" -ForegroundColor Green
    Write-Host "  Canton privacy model is working correctly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Visibility matrix test FAILED" -ForegroundColor Red
    Write-Host "  Privacy violations detected in visibility matrix" -ForegroundColor Red
    exit 1
}

