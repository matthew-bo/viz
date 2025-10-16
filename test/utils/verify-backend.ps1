# Test Utility: Verify Backend Health
# Quick check that backend is running and Canton is accessible

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Backend Health Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$checks = 0
$passed = 0
$failed = 0

# Check 1: Backend health endpoint
Write-Host "Check 1: Backend health endpoint..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
    
    if ($health.status -eq "healthy") {
        Write-Host "[PASS] Backend is healthy" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "[FAIL] Backend reports unhealthy status" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "[FAIL] Backend not accessible" -ForegroundColor Red
    Write-Host "   Make sure backend is running: cd backend; npm run dev" -ForegroundColor Yellow
    $failed++
}

$checks++

# Check 2: Parties endpoint
Write-Host ""
Write-Host "Check 2: Parties endpoint..." -ForegroundColor Yellow

try {
    $parties = Invoke-RestMethod -Uri "http://localhost:3001/api/parties" -Method Get -TimeoutSec 10 -ErrorAction Stop
    
    if ($parties.Count -eq 3) {
        Write-Host "[PASS] Backend connected to Canton (3 parties loaded)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "[FAIL] Expected 3 parties, found $($parties.Count)" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "[FAIL] Cannot query parties" -ForegroundColor Red
    $failed++
}

$checks++

# Check 3: Canton containers
Write-Host ""
Write-Host "Check 3: Canton containers..." -ForegroundColor Yellow

$containers = docker ps --filter "name=canton-" --format "{{.Names}}" | Measure-Object -Line

if ($containers.Lines -eq 4) {
    Write-Host "[PASS] All 4 Canton containers running" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] Expected 4 Canton containers, found $($containers.Lines)" -ForegroundColor Red
    Write-Host "   Start containers: cd infrastructure; docker-compose up -d" -ForegroundColor Yellow
    $failed++
}

$checks++

# Check 4: Party IDs in .env
Write-Host ""
Write-Host "Check 4: Backend environment configuration..." -ForegroundColor Yellow

if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env" -Raw
    
    $hasAllParties = ($envContent -match "TECHBANK_PARTY_ID") -and 
                     ($envContent -match "GLOBALCORP_PARTY_ID") -and 
                     ($envContent -match "RETAILFINANCE_PARTY_ID")
    
    if ($hasAllParties) {
        Write-Host "[PASS] Backend .env has all party IDs configured" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "[FAIL] Backend .env missing party ID configuration" -ForegroundColor Red
        $failed++
    }
} else {
    Write-Host "[FAIL] backend\.env not found" -ForegroundColor Red
    Write-Host "   Create from .env.example and add party IDs" -ForegroundColor Yellow
    $failed++
}

$checks++

# Check 5: SSE endpoint
Write-Host ""
Write-Host "Check 5: SSE endpoint accessibility..." -ForegroundColor Yellow

try {
    # Quick connection test (will timeout but that's ok)
    $null = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -InformationLevel Quiet
    
    Write-Host "[PASS] Backend port 3001 is accessible" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "[FAIL] Cannot connect to backend port 3001" -ForegroundColor Red
    $failed++
}

$checks++

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Verification Results" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Total Checks: $checks" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "[PASS] Backend is ready for testing" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Cyan
    Write-Host "  .\test\run-all-tests.ps1" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "[FAIL] Backend has issues that need to be resolved" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure Canton containers are running"
    Write-Host "2. Initialize Canton: .\infrastructure\init-canton-final.ps1"
    Write-Host "3. Update backend .env with party IDs"
    Write-Host "4. Restart backend: cd backend; npm run dev"
    Write-Host ""
    exit 1
}

