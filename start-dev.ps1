# Canton Visualizer - Development Mode Startup Script

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Canton Visualizer - Development Mode" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Canton is running
Write-Host "[1/3] Checking Canton network..." -ForegroundColor Yellow
$cantonRunning = docker ps --filter "name=canton" --format "{{.Names}}" | Select-String "canton"
if ($cantonRunning) {
    Write-Host "[OK] Canton is running: $cantonRunning" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Canton is not running!" -ForegroundColor Red
    Write-Host "Starting Canton..." -ForegroundColor Yellow
    docker compose -f infrastructure/docker-compose-simple.yml up -d canton
    Write-Host "Waiting for Canton to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

Write-Host ""
Write-Host "[2/3] Starting Backend (Port 3001)..." -ForegroundColor Yellow

# Start backend in new terminal
$backendCmd = @"
cd '$PWD\backend'
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  Backend Development Server' -ForegroundColor Cyan
Write-Host '  http://localhost:3001' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host "[OK] Backend terminal opened" -ForegroundColor Green
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[3/3] Starting Frontend (Port 5173)..." -ForegroundColor Yellow

# Start frontend in new terminal
$frontendCmd = @"
cd '$PWD\frontend'
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  Frontend Development Server' -ForegroundColor Cyan
Write-Host '  http://localhost:5173' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "[OK] Frontend terminal opened" -ForegroundColor Green

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Development environment ready!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173  (Vite dev server)" -ForegroundColor White
Write-Host "  Backend:   http://localhost:3001  (Express API)" -ForegroundColor White
Write-Host "  Canton:    http://localhost:7011  (Blockchain)" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop" -ForegroundColor Yellow
Write-Host ""
