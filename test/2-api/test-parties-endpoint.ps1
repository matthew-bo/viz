# Test 5.2.2: Parties Endpoint
# Verifies GET /api/parties returns all 3 parties with correct structure

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.2.2: Parties Endpoint Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$apiBase = "http://localhost:3001"

# Test 1: Parties endpoint responds
Write-Host "Test 1: GET /api/parties endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$apiBase/api/parties" -Method Get -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "[PASS] Parties endpoint responded" -ForegroundColor Green
    $testsPassed++
    
    # Test 2: Check response is array
    Write-Host ""
    Write-Host "Test 2: Validating response type..." -ForegroundColor Yellow
    
    if ($response -is [Array]) {
        Write-Host "[PASS] Response is an array" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Response is not an array" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 3: Check for 3 parties
    Write-Host ""
    Write-Host "Test 3: Checking party count..." -ForegroundColor Yellow
    
    if ($response.Count -eq 3) {
        Write-Host "[PASS] Found 3 parties" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] Expected 3 parties, found $($response.Count)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 4: Validate party structure
    Write-Host ""
    Write-Host "Test 4: Validating party structure..." -ForegroundColor Yellow
    
    $expectedParties = @("TechBank", "GlobalCorp", "RetailFinance")
    
    foreach ($partyName in $expectedParties) {
        $party = $response | Where-Object { $_.displayName -eq $partyName }
        
        if ($party) {
            Write-Host "[PASS] Found $partyName" -ForegroundColor Green
            
            # Validate fields
            if ($party.partyId -match "^${partyName}::1220[0-9a-f]{64}$") {
                Write-Host "  [PASS] Valid party ID: $($party.partyId)" -ForegroundColor Green
                $testsPassed++
            } else {
                Write-Host "  [FAIL] Invalid party ID format: $($party.partyId)" -ForegroundColor Red
                $testsFailed++
            }
            
            if ($party.ledgerApiUrl) {
                Write-Host "  [PASS] Has ledgerApiUrl: $($party.ledgerApiUrl)" -ForegroundColor Green
                $testsPassed++
            } else {
                Write-Host "  [FAIL] Missing ledgerApiUrl" -ForegroundColor Red
                $testsFailed++
            }
        } else {
            Write-Host "[FAIL] $partyName not found" -ForegroundColor Red
            $testsFailed++
        }
    }
    
} catch {
    Write-Host "[FAIL] Parties endpoint not accessible" -ForegroundColor Red
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
    Write-Host "[PASS] Parties endpoint test PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Parties endpoint test FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check backend logs for errors"
    Write-Host "2. Verify party IDs in backend/.env"
    Write-Host "3. Re-initialize Canton if needed"
    exit 1
}

