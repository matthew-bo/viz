# Canton Initialization Script - Working Version
# Uses remote console to initialize running Canton daemons

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "Canton Network Initialization" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

Write-Host "Running initialization script..." -ForegroundColor Yellow
Write-Host ""

docker run --rm `
  --network infrastructure_canton-network `
  -v ${PWD}/infrastructure/canton:/canton-config `
  -v ${PWD}/daml/.daml/dist:/dars:ro `
  digitalasset/canton-open-source:latest `
  run `
  -c /canton-config/remote-synchronizer.conf `
  -c /canton-config/remote-participant1.conf `
  -c /canton-config/remote-participant2.conf `
  -c /canton-config/remote-participant3.conf `
  /canton-config/scripts/complete-init.sc

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Green
    Write-Host "SUCCESS! Canton Initialized" -ForegroundColor Green
    Write-Host ("=" * 80) -ForegroundColor Green
    Write-Host ""
    
    # Extract full party IDs
    Write-Host "Extracting full party IDs..." -ForegroundColor Yellow
    docker run --rm `
      --network infrastructure_canton-network `
      -v ${PWD}/infrastructure/canton:/canton-config `
      digitalasset/canton-open-source:latest `
      run `
      -c /canton-config/remote-participant1.conf `
      -c /canton-config/remote-participant2.conf `
      -c /canton-config/remote-participant3.conf `
      /canton-config/scripts/get-full-ids.sc 2>&1 | `
      Select-String "{|TechBank|GlobalCorp|RetailFinance|}" | `
      Out-File -FilePath infrastructure/canton/party-ids-temp.txt -Encoding UTF8
    
    # Clean up and save
    $content = Get-Content infrastructure/canton/party-ids-temp.txt -Raw
    $content = $content -replace "`r`n", "" -replace "\s+", " "
    $content | Out-File -FilePath infrastructure/canton/party-ids.json -Encoding UTF8 -NoNewline
    Remove-Item infrastructure/canton/party-ids-temp.txt
    
    Write-Host ""
    Write-Host "Party IDs saved to: infrastructure/canton/party-ids.json" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Party IDs:" -ForegroundColor Cyan
    Get-Content infrastructure/canton/party-ids.json | ConvertFrom-Json | Format-List
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Update backend/.env with these party IDs" -ForegroundColor White
    Write-Host "  2. Start Phase 3 (Backend Development)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Red
    Write-Host "FAILED! Initialization Error" -ForegroundColor Red
    Write-Host ("=" * 80) -ForegroundColor Red
    Write-Host ""
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

