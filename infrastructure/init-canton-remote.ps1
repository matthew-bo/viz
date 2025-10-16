# Canton Remote Console Initialization Script
# This script connects to running Canton daemons via Admin API and initializes them

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "Canton Network Initialization (Remote Console)" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Check if containers are running
Write-Host "Checking Canton containers..." -ForegroundColor Yellow
$containers = docker ps --filter "name=canton" --format "{{.Names}}" | Measure-Object
if ($containers.Count -ne 4) {
    Write-Host "Error: Expected 4 Canton containers, found $($containers.Count)" -ForegroundColor Red
    Write-Host "Please run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "All 4 Canton containers are running" -ForegroundColor Green
Write-Host ""

# Check if remote configs exist
Write-Host "Checking remote configuration files..." -ForegroundColor Yellow
$remoteConfigs = @(
    "infrastructure/canton/remote-synchronizer.conf",
    "infrastructure/canton/remote-participant1.conf",
    "infrastructure/canton/remote-participant2.conf",
    "infrastructure/canton/remote-participant3.conf"
)

foreach ($config in $remoteConfigs) {
    if (-not (Test-Path $config)) {
        Write-Host "Error: Missing $config" -ForegroundColor Red
        exit 1
    }
}
Write-Host "All remote configuration files found" -ForegroundColor Green
Write-Host ""

# Check if DAR file exists
Write-Host "Checking DAR file..." -ForegroundColor Yellow
if (-not (Test-Path "daml/payment-demo-0.0.1.dar")) {
    Write-Host "Error: DAR file not found" -ForegroundColor Red
    Write-Host "Please run: cd daml; daml build" -ForegroundColor Yellow
    exit 1
}
Write-Host "DAR file found" -ForegroundColor Green
Write-Host ""

# Run initialization via remote console
Write-Host "Starting remote console initialization..." -ForegroundColor Cyan
Write-Host "This will connect to running daemons via Admin API" -ForegroundColor Gray
Write-Host ""

docker run --rm `
  --network infrastructure_default `
  -v ${PWD}/infrastructure/canton:/canton-config `
  -v ${PWD}/daml:/daml:ro `
  digitalasset/canton-open-source:latest `
  run `
  -c /canton-config/remote-synchronizer.conf `
  -c /canton-config/remote-participant1.conf `
  -c /canton-config/remote-participant2.conf `
  -c /canton-config/remote-participant3.conf `
  /canton-config/scripts/init-all.sc

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Green
    Write-Host "Canton Initialization Successful!" -ForegroundColor Green
    Write-Host ("=" * 80) -ForegroundColor Green
    Write-Host ""
    Write-Host "Party IDs saved to: infrastructure/canton/party-ids.json" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Check party IDs: cat infrastructure/canton/party-ids.json" -ForegroundColor White
    Write-Host "  2. Update backend/.env with real party IDs" -ForegroundColor White
    Write-Host "  3. Start Phase 3 (Backend Development)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Red
    Write-Host "Canton Initialization Failed!" -ForegroundColor Red
    Write-Host ("=" * 80) -ForegroundColor Red
    Write-Host ""
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check if containers are healthy: docker ps" -ForegroundColor White
    Write-Host "  2. Check logs: docker logs canton-synchronizer" -ForegroundColor White
    Write-Host "  3. Try interactive console for debugging" -ForegroundColor White
    Write-Host ""
    exit $LASTEXITCODE
}
