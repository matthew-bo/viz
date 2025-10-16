# Create backend .env file with correct configuration
Write-Host "Creating backend/.env file..." -ForegroundColor Cyan

# Read party IDs from Canton's party-ids.json
$partyIdsFile = "infrastructure\canton\party-ids.json"
if (Test-Path $partyIdsFile) {
    $partyIds = Get-Content $partyIdsFile | ConvertFrom-Json
    $techBankId = $partyIds.TechBank
    $globalCorpId = $partyIds.GlobalCorp
    $retailFinanceId = $partyIds.RetailFinance
    Write-Host "  Loaded party IDs from $partyIdsFile" -ForegroundColor Green
} else {
    Write-Host "  ERROR: $partyIdsFile not found!" -ForegroundColor Red
    exit 1
}

$envContent = @"
# Participant HTTP JSON API URLs (localhost - backend runs on host, not in Docker)
# NOTE: URLs must end with / for Daml Ledger API
PARTICIPANT1_LEDGER_API=http://localhost:7011/
PARTICIPANT2_LEDGER_API=http://localhost:7021/
PARTICIPANT3_LEDGER_API=http://localhost:7031/

# Party IDs (auto-loaded from infrastructure/canton/party-ids.json)
TECHBANK_PARTY_ID=$techBankId
GLOBALCORP_PARTY_ID=$globalCorpId
RETAILFINANCE_PARTY_ID=$retailFinanceId

# Server configuration
PORT=3001

# JWT Secret (demo only - use secure secret in production)
JWT_SECRET=demo-secret-key-canton-privacy-visualizer
"@

$envContent | Out-File -FilePath "backend\.env" -Encoding UTF8 -NoNewline

Write-Host "SUCCESS: backend/.env created!" -ForegroundColor Green
Write-Host "  TechBank: $techBankId" -ForegroundColor Cyan
Write-Host "  GlobalCorp: $globalCorpId" -ForegroundColor Cyan
Write-Host "  RetailFinance: $retailFinanceId" -ForegroundColor Cyan
