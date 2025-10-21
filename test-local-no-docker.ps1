# Test Local Stack (Canton + Backend + Frontend without full Docker)
# This tests that the system works before dealing with Docker build issues

Write-Host ""
Write-Host "=========================================="
Write-Host " Canton Local Stack Test (No Backend Docker)"
Write-Host "=========================================="
Write-Host ""

Write-Host "This script will:"
Write-Host "  1. Start Canton containers (4 containers)"
Write-Host "  2. Run backend locally (npm)"
Write-Host "  3. Run frontend locally (npm)"  
Write-Host "  4. Test end-to-end workflow"
Write-Host ""
Write-Host "Prerequisites:"
Write-Host "  - Docker Desktop running"
Write-Host "  - Node.js installed"
Write-Host "  - .env files created (run setup-env-files.ps1)"
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Aborted"
    exit 0
}

Write-Host ""
Write-Host "Step 1: Starting Canton containers..."
Write-Host ""

Push-Location infrastructure
docker-compose up -d synchronizer participant1 participant2 participant3

Write-Host ""
Write-Host "Waiting 60 seconds for Canton to initialize..."
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "Canton containers status:"
docker-compose ps

Pop-Location

Write-Host ""
Write-Host "Step 2: Starting backend locally..."
Write-Host ""

$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\mbo1\viz\backend"
    npm run dev
}

Write-Host "Backend starting in background (Job ID: $($backendJob.Id))"
Write-Host "Waiting 10 seconds for backend to start..."
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Step 3: Testing backend..."
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "[SUCCESS] Backend health: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Backend not responding: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend logs:"
    Receive-Job $backendJob
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

try {
    $parties = Invoke-RestMethod -Uri "http://localhost:3001/api/parties" -TimeoutSec 5
    Write-Host "[SUCCESS] Parties loaded: $($parties.Count) parties" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Parties endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Starting frontend..."
Write-Host ""
Write-Host "You can now start the frontend manually:"
Write-Host "  cd frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open: http://localhost:3000"
Write-Host ""
Write-Host "Press Enter to stop backend and Canton..."
Read-Host

Write-Host "Stopping backend..."
Stop-Job $backendJob
Remove-Job $backendJob

Write-Host "Stopping Canton..."
Push-Location infrastructure
docker-compose down
Pop-Location

Write-Host "Done!"

