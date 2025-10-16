# PowerShell version of init-canton.sh for Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Canton Network Initialization" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Wait for all containers to be healthy
Write-Host "`nWaiting for Canton services to be healthy..." -ForegroundColor Yellow
$maxWait = 60
for ($i = 1; $i -le $maxWait; $i++) {
    $healthy = (docker ps --filter "name=canton-" --filter "health=healthy" --format "{{.Names}}").Count
    if ($healthy -eq 4) {
        Write-Host "✓ All 4 services healthy" -ForegroundColor Green
        break
    }
    Write-Host "Waiting... ($i/$maxWait) - $healthy/4 services healthy"
    Start-Sleep -Seconds 2
}

if ($healthy -ne 4) {
    Write-Host "❌ Services failed to become healthy" -ForegroundColor Red
    exit 1
}

# Step 2: Bootstrap synchronizer domain
Write-Host "`nStep 2/5: Bootstrapping synchronizer domain..." -ForegroundColor Yellow
docker exec canton-synchronizer canton daemon `
    --config /canton/synchronizer.conf `
    --bootstrap /canton/scripts/bootstrap-domain.sc

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to bootstrap synchronizer" -ForegroundColor Red
    exit 1
}

# Step 3: Connect participants to domain
Write-Host "`nStep 3/5: Connecting participants to domain..." -ForegroundColor Yellow
$participants = @("participant1", "participant2", "participant3")

foreach ($p in $participants) {
    Write-Host "Connecting $p..."
    docker exec canton-$p canton daemon `
        --config /canton/$p.conf `
        --bootstrap /canton/scripts/connect-participant.sc
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to connect $p" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Create parties and extract JSON
Write-Host "`nStep 4/5: Creating parties and extracting IDs..." -ForegroundColor Yellow

$partyOutput = docker exec canton-participant1 canton daemon `
    --config /canton/participant1.conf `
    --config /canton/participant2.conf `
    --config /canton/participant3.conf `
    --bootstrap /canton/scripts/create-parties.sc

# Extract JSON between markers
$lines = $partyOutput -split "`n"
$capturing = $false
$partyJson = @()

foreach ($line in $lines) {
    if ($line -match "=== PARTY IDS JSON ===") {
        $capturing = $true
        continue
    }
    if ($line -match "=== END PARTY IDS ===") {
        $capturing = $false
        continue
    }
    if ($capturing) {
        $partyJson += $line
    }
}

# Save to file
$partyJson -join "`n" | Out-File -FilePath "party-ids.json" -Encoding utf8
Write-Host "✓ Party IDs saved to party-ids.json" -ForegroundColor Green

# Display for verification
Write-Host "`nParty IDs:" -ForegroundColor Cyan
Get-Content party-ids.json | ConvertFrom-Json | ConvertTo-Json

# Step 5: Copy and upload DAR file (will be done after Daml build)
Write-Host "`nStep 5/5: Ready to upload smart contracts..." -ForegroundColor Yellow
Write-Host "NOTE: DAR upload will be completed after Daml contracts are built" -ForegroundColor Yellow

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "✓ Initial Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Build Daml contracts: cd daml, then daml build"
Write-Host "2. Run DAR upload separately after building contracts"
Write-Host "3. Copy party IDs to backend/.env"
Write-Host "==========================================" -ForegroundColor Cyan

