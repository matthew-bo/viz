# Setup Environment Files for Canton Privacy Blockchain
# Creates .env files for backend and frontend with correct party IDs

Write-Host ""
Write-Host "================================================================"
Write-Host "  Canton Privacy Blockchain - Environment Setup"
Write-Host "================================================================"
Write-Host ""

# Check if party IDs exist
if (!(Test-Path "infrastructure/canton/party-ids.json")) {
    Write-Host "[ERROR] party-ids.json not found!" -ForegroundColor Red
    Write-Host "Please run: .\infrastructure\init-canton-final.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Load party IDs
Write-Host "Loading Canton party IDs..." -NoNewline
$partyIds = Get-Content "infrastructure/canton/party-ids.json" | ConvertFrom-Json
Write-Host " [OK]" -ForegroundColor Green

# Create backend .env
Write-Host "Creating backend/.env..." -NoNewline

$backendContent = "# Participant Ledger API URLs (Docker - use service names)`n"
$backendContent += "PARTICIPANT1_LEDGER_API=http://canton-participant1:7011`n"
$backendContent += "PARTICIPANT2_LEDGER_API=http://canton-participant2:7021`n"
$backendContent += "PARTICIPANT3_LEDGER_API=http://canton-participant3:7031`n"
$backendContent += "`n"
$backendContent += "# Party IDs (REAL Canton party IDs from infrastructure/canton/party-ids.json)`n"
$backendContent += "TECHBANK_PARTY_ID=$($partyIds.TechBank)`n"
$backendContent += "GLOBALCORP_PARTY_ID=$($partyIds.GlobalCorp)`n"
$backendContent += "RETAILFINANCE_PARTY_ID=$($partyIds.RetailFinance)`n"
$backendContent += "`n"
$backendContent += "# Participant Ledger IDs (must match Canton configuration)`n"
$backendContent += "PARTICIPANT1_LEDGER_ID=participant1`n"
$backendContent += "PARTICIPANT2_LEDGER_ID=participant2`n"
$backendContent += "PARTICIPANT3_LEDGER_ID=participant3`n"
$backendContent += "`n"
$backendContent += "# Server configuration`n"
$backendContent += "PORT=3001`n"
$backendContent += "NODE_ENV=development`n"
$backendContent += "`n"
$backendContent += "# JWT Secret (demo environment - change for production)`n"
$backendContent += "JWT_SECRET=demo-secret-key-canton-privacy-visualizer`n"
$backendContent += "JWT_EXPIRES_IN=24h`n"
$backendContent += "`n"
$backendContent += "# CORS Configuration (allow all for development)`n"
$backendContent += "CORS_ORIGIN=*`n"
$backendContent += "`n"
$backendContent += "# API Configuration`n"
$backendContent += "API_DEFAULT_LIMIT=50`n"
$backendContent += "API_MAX_LIMIT=200`n"
$backendContent += "`n"
$backendContent += "# SSE Configuration`n"
$backendContent += "SSE_MAX_CLIENTS=100`n"
$backendContent += "SSE_KEEPALIVE_MS=30000`n"
$backendContent += "`n"
$backendContent += "# Idempotency Configuration`n"
$backendContent += "IDEMPOTENCY_CACHE_TTL_MS=300000`n"
$backendContent += "`n"
$backendContent += "# Security Configuration`n"
$backendContent += "REQUEST_SIZE_LIMIT=1mb`n"

[System.IO.File]::WriteAllText("backend/.env", $backendContent)
Write-Host " [OK]" -ForegroundColor Green

# Create frontend .env
Write-Host "Creating frontend/.env..." -NoNewline

$frontendContent = "# Backend API URL (local development)`n"
$frontendContent += "VITE_API_URL=http://localhost:3001`n"

[System.IO.File]::WriteAllText("frontend/.env", $frontendContent)
Write-Host " [OK]" -ForegroundColor Green

Write-Host ""
Write-Host "Environment files created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration summary:"
Write-Host "  Backend API:  http://localhost:3001"
Write-Host "  Frontend:     http://localhost:3000"
Write-Host "  TechBank:     $($partyIds.TechBank.Substring(0, 40))..."
Write-Host "  GlobalCorp:   $($partyIds.GlobalCorp.Substring(0, 40))..."
Write-Host "  RetailFinance: $($partyIds.RetailFinance.Substring(0, 40))..."
Write-Host ""
Write-Host "You can now start the Docker stack:" -ForegroundColor Yellow
Write-Host "  cd infrastructure"
Write-Host "  docker-compose up -d"
Write-Host ""
