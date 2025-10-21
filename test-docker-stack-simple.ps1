# Canton Privacy Blockchain - Docker Stack Test
# Simple version without complex syntax

Write-Host ""
Write-Host "=========================================="
Write-Host " Canton Docker Stack Test"
Write-Host "=========================================="
Write-Host ""

$passed = 0
$failed = 0

# Check Docker
Write-Host "[1/10] Checking Docker..." -NoNewline
try {
    docker info | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " PASS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

# Check party IDs
Write-Host "[2/10] Checking party IDs..." -NoNewline
if (Test-Path "infrastructure/canton/party-ids.json") {
    Write-Host " PASS" -ForegroundColor Green
    $passed++
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

# Check backend .env
Write-Host "[3/10] Checking backend .env..." -NoNewline
if (Test-Path "backend/.env") {
    Write-Host " PASS" -ForegroundColor Green
    $passed++
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

# Check frontend .env
Write-Host "[4/10] Checking frontend .env..." -NoNewline
if (Test-Path "frontend/.env") {
    Write-Host " PASS" -ForegroundColor Green
    $passed++
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

Write-Host ""
Write-Host "Starting Docker stack..."
Push-Location infrastructure
docker-compose down 2>&1 | Out-Null
Write-Host "Building and starting containers (this takes 2-3 minutes)..."
docker-compose up -d --build

Write-Host "Waiting 60 seconds for containers to stabilize..."
Start-Sleep -Seconds 60

# Check containers running
Write-Host ""
Write-Host "[5/10] Checking containers..." -NoNewline
$containers = docker-compose ps -q
if ($containers.Count -ge 5) {
    Write-Host " PASS" -ForegroundColor Green
    $passed++
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

Pop-Location

# Test backend health
Write-Host "[6/10] Testing backend health..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    if ($response.status -eq "healthy") {
        Write-Host " PASS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

# Test parties endpoint
Write-Host "[7/10] Testing parties endpoint..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/parties" -TimeoutSec 5
    if ($response.Count -eq 3) {
        Write-Host " PASS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

# Test frontend
Write-Host "[8/10] Testing frontend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " PASS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

# Submit test transaction
Write-Host "[9/10] Testing transaction submit..." -NoNewline
try {
    $body = @{
        sender = "TechBank"
        receiver = "GlobalCorp"
        amount = 1000
        description = "Test payment"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/contracts" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
    
    if ($response.status -eq "pending") {
        Write-Host " PASS" -ForegroundColor Green
        $passed++
        $script:testContractId = $response.contractId
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAIL - " $_  -ForegroundColor Red
    $failed++
}

# Test privacy filtering
Write-Host "[10/10] Testing privacy filtering..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/contracts?party=RetailFinance" -TimeoutSec 5
    $found = $response | Where-Object { $_.contractId -eq $script:testContractId }
    
    if ($found -eq $null) {
        Write-Host " PASS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " FAIL" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $failed++
}

Write-Host ""
Write-Host "=========================================="
Write-Host " Results: $passed/10 passed, $failed/10 failed"
Write-Host "=========================================="
Write-Host ""

if ($failed -eq 0) {
    Write-Host "SUCCESS! All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Open browser: http://localhost:3000"
    Write-Host ""
} else {
    Write-Host "Some tests failed. Check logs:" -ForegroundColor Yellow
    Write-Host "  cd infrastructure"
    Write-Host "  docker-compose logs backend"
    Write-Host ""
}

exit $failed

