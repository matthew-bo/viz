# Test Utility: Cleanup Test Environment
# Resets Canton network to clean state for fresh testing

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Environment Cleanup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Stop all Canton containers" -ForegroundColor Yellow
Write-Host "2. Remove in-memory data (all transactions will be lost)" -ForegroundColor Yellow
Write-Host "3. Restart containers" -ForegroundColor Yellow
Write-Host "4. Re-initialize Canton with new party IDs" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 1: Stop containers
Write-Host ""
Write-Host "Step 1: Stopping Canton containers..." -ForegroundColor Yellow

try {
    Set-Location infrastructure
    docker-compose down
    Write-Host "[PASS] Containers stopped" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Failed to stop containers: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Start-Sleep -Seconds 2

# Step 2: Start containers
Write-Host ""
Write-Host "Step 2: Starting Canton containers..." -ForegroundColor Yellow

try {
    docker-compose up -d
    Write-Host "[PASS] Containers started" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Failed to start containers: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Step 3: Wait for containers to be ready
Write-Host ""
Write-Host "Step 3: Waiting for containers to initialize (60 seconds)..." -ForegroundColor Yellow

$waited = 0
$maxWait = 60

while ($waited -lt $maxWait) {
    $running = (docker ps --filter "name=canton-" --format "{{.Names}}" | Measure-Object -Line).Lines
    
    if ($running -eq 4) {
        Write-Host "[PASS] All 4 containers running" -ForegroundColor Green
        break
    }
    
    Write-Host "  Waiting... ($waited/$maxWait seconds, $running/4 containers)" -ForegroundColor Gray
    Start-Sleep -Seconds 5
    $waited += 5
}

if ($waited -ge $maxWait) {
    Write-Host "[INFO]  Timeout waiting for containers" -ForegroundColor Yellow
}

Start-Sleep -Seconds 5

# Step 4: Re-initialize Canton
Write-Host ""
Write-Host "Step 4: Re-initializing Canton network..." -ForegroundColor Yellow

try {
    & .\infrastructure\init-canton-final.ps1
    Write-Host "[PASS] Canton re-initialized" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Failed to re-initialize Canton: $_" -ForegroundColor Red
    Write-Host "   You may need to run manually: .\infrastructure\init-canton-final.ps1" -ForegroundColor Yellow
}

# Step 5: Verify party IDs
Write-Host ""
Write-Host "Step 5: Verifying new party IDs..." -ForegroundColor Yellow

if (Test-Path "infrastructure\canton\party-ids.json") {
    $partyIds = Get-Content "infrastructure\canton\party-ids.json" -Raw | ConvertFrom-Json
    
    Write-Host "[PASS] New party IDs generated:" -ForegroundColor Green
    Write-Host "  TechBank: $($partyIds.TechBank)" -ForegroundColor Gray
    Write-Host "  GlobalCorp: $($partyIds.GlobalCorp)" -ForegroundColor Gray
    Write-Host "  RetailFinance: $($partyIds.RetailFinance)" -ForegroundColor Gray
} else {
    Write-Host "[FAIL] party-ids.json not found" -ForegroundColor Red
}

# Step 6: Update backend .env (optional)
Write-Host ""
Write-Host "Step 6: Backend .env update..." -ForegroundColor Yellow
Write-Host "[INFO]  Remember to update backend/.env with new party IDs" -ForegroundColor Yellow
Write-Host "   Or run: .\create-backend-env.ps1" -ForegroundColor Yellow

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Cleanup Complete" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update backend/.env with new party IDs"
Write-Host "2. Restart backend: cd backend; npm run dev"
Write-Host "3. Run tests again"
Write-Host ""

