# API Smoke Test Script
# Quick validation of all API endpoints

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  API Smoke Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "http://localhost:3001"
$PassedTests = 0
$FailedTests = 0
$TestResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $params = @{
            Uri = "$API_BASE$Endpoint"
            Method = $Method
            TimeoutSec = 10
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params -StatusCodeVariable statusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host " ✓ PASS" -ForegroundColor Green
            $script:PassedTests++
            $script:TestResults += [PSCustomObject]@{
                Test = $Name
                Status = "PASS"
                StatusCode = $statusCode
            }
            return $response
        } else {
            Write-Host " ✗ FAIL (Expected $ExpectedStatus, got $statusCode)" -ForegroundColor Red
            $script:FailedTests++
            $script:TestResults += [PSCustomObject]@{
                Test = $Name
                Status = "FAIL"
                StatusCode = $statusCode
            }
            return $null
        }
    } catch {
        Write-Host " ✗ FAIL ($_)" -ForegroundColor Red
        $script:FailedTests++
        $script:TestResults += [PSCustomObject]@{
            Test = $Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
        return $null
    }
}

# Test 1: Health check
Test-Endpoint -Name "Health Check" -Method "GET" -Endpoint "/health" | Out-Null

# Test 2: Get parties
$parties = Test-Endpoint -Name "Get Parties" -Method "GET" -Endpoint "/api/parties"

if ($parties -and $parties.Count -eq 3) {
    Write-Host "  Found 3 parties: $($parties.displayName -join ', ')" -ForegroundColor Gray
}

# Test 3: Get all transactions
$transactions = Test-Endpoint -Name "Get All Transactions" -Method "GET" -Endpoint "/api/contracts?limit=10"

if ($transactions) {
    Write-Host "  Retrieved $($transactions.Count) transactions" -ForegroundColor Gray
}

# Test 4: Get transactions by party
Test-Endpoint -Name "Get TechBank Transactions" -Method "GET" -Endpoint "/api/contracts?party=TechBank" | Out-Null

# Test 5: Submit payment request
$testPayment = @{
    sender = "TechBank"
    receiver = "GlobalCorp"
    amount = 100
    description = "API Smoke Test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

$submittedTx = Test-Endpoint -Name "Submit Payment Request" -Method "POST" -Endpoint "/api/contracts" -Body $testPayment -ExpectedStatus 201

if ($submittedTx) {
    Write-Host "  Contract ID: $($submittedTx.contractId.Substring(0, 20))..." -ForegroundColor Gray
    
    # Test 6: Accept payment request
    Start-Sleep -Seconds 2 # Wait for Canton to process
    
    $acceptBody = @{
        receiver = "GlobalCorp"
    }
    
    Test-Endpoint -Name "Accept Payment Request" -Method "POST" -Endpoint "/api/contracts/$($submittedTx.contractId)/accept" -Body $acceptBody | Out-Null
}

# Test 7: Get metrics
$metrics = Test-Endpoint -Name "Get Metrics" -Method "GET" -Endpoint "/api/admin/metrics"

if ($metrics) {
    Write-Host "  Total transactions: $($metrics.total.transactions)" -ForegroundColor Gray
}

# Test 8: Get inventory
Test-Endpoint -Name "Get All Inventories" -Method "GET" -Endpoint "/api/inventory" | Out-Null

# Test 9: Get exchanges
Test-Endpoint -Name "Get All Exchanges" -Method "GET" -Endpoint "/api/exchanges" | Out-Null

# Test 10: Invalid party name (should fail)
$invalidPayment = @{
    sender = "InvalidBank"
    receiver = "GlobalCorp"
    amount = 100
    description = "Should fail"
}

Test-Endpoint -Name "Invalid Party Validation" -Method "POST" -Endpoint "/api/contracts" -Body $invalidPayment -ExpectedStatus 400 | Out-Null

# Test 11: Negative amount validation (should fail)
$negativePayment = @{
    sender = "TechBank"
    receiver = "GlobalCorp"
    amount = -100
    description = "Should fail"
}

Test-Endpoint -Name "Negative Amount Validation" -Method "POST" -Endpoint "/api/contracts" -Body $negativePayment -ExpectedStatus 400 | Out-Null

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$TestResults | Format-Table -AutoSize

Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Passed: $PassedTests" -ForegroundColor Green
Write-Host "  Failed: $FailedTests" -ForegroundColor Red
Write-Host "  Total:  $($PassedTests + $FailedTests)" -ForegroundColor Cyan

if ($FailedTests -eq 0) {
    Write-Host ""
    Write-Host "✓ ALL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}





