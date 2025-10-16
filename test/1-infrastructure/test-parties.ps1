# Test 5.1.3: Party Verification
# Verifies all 3 parties exist with valid Canton party IDs

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test 5.1.3: Party Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Test 1: Check party-ids.json exists
Write-Host "Test 1: Checking party-ids.json file..." -ForegroundColor Yellow

$partyIdsPath = "infrastructure\canton\party-ids.json"

if (Test-Path $partyIdsPath) {
    Write-Host "[PASS] party-ids.json exists" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "[FAIL] party-ids.json not found" -ForegroundColor Red
    $testsFailed++
    Write-Host "   Run: .\infrastructure\init-canton-final.ps1" -ForegroundColor Yellow
    exit 1
}

# Test 2: Parse and validate party IDs
Write-Host ""
Write-Host "Test 2: Validating party IDs..." -ForegroundColor Yellow

try {
    $partyIdsJson = Get-Content $partyIdsPath -Raw | ConvertFrom-Json
    
    $expectedParties = @("TechBank", "GlobalCorp", "RetailFinance")
    
    foreach ($partyName in $expectedParties) {
        $partyId = $partyIdsJson.$partyName
        
        if ($partyId) {
            # Validate format: "PartyName::1220..."
            if ($partyId -match "^${partyName}::1220[0-9a-f]{64}$") {
                Write-Host "[PASS] $partyName has valid party ID" -ForegroundColor Green
                Write-Host "   ID: $partyId" -ForegroundColor Gray
                $testsPassed++
            } else {
                Write-Host "[FAIL] $partyName has invalid party ID format" -ForegroundColor Red
                Write-Host "   ID: $partyId" -ForegroundColor Gray
                $testsFailed++
            }
        } else {
            Write-Host "[FAIL] $partyName not found in party-ids.json" -ForegroundColor Red
            $testsFailed++
        }
    }
} catch {
    Write-Host "[FAIL] Error parsing party-ids.json: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Verify parties exist in backend .env
Write-Host ""
Write-Host "Test 3: Checking backend .env configuration..." -ForegroundColor Yellow

$envPath = "backend\.env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match "TECHBANK_PARTY_ID") {
        Write-Host "[PASS] TECHBANK_PARTY_ID found in .env" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] TECHBANK_PARTY_ID missing from .env" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($envContent -match "GLOBALCORP_PARTY_ID") {
        Write-Host "[PASS] GLOBALCORP_PARTY_ID found in .env" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] GLOBALCORP_PARTY_ID missing from .env" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($envContent -match "RETAILFINANCE_PARTY_ID") {
        Write-Host "[PASS] RETAILFINANCE_PARTY_ID found in .env" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[FAIL] RETAILFINANCE_PARTY_ID missing from .env" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "[INFO]  backend\.env not found (create from .env.example)" -ForegroundColor Yellow
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
    Write-Host "[PASS] All party verification checks PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Some party verification checks FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Re-initialize Canton: .\infrastructure\init-canton-final.ps1"
    Write-Host "2. Update backend .env: copy party IDs from party-ids.json"
    Write-Host "3. Restart backend if .env was updated"
    exit 1
}

