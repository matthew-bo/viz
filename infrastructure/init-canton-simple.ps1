# Simple Canton Network Initialization for Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Canton Network Initialization" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Check containers
Write-Host "`nStep 1: Checking Canton containers..." -ForegroundColor Yellow
$running = @(docker ps --filter "name=canton-" --format "{{.Names}}").Count
Write-Host "Found $running running containers" -ForegroundColor Green

if ($running -ne 4) {
    Write-Host "Expected 4 containers, found $running" -ForegroundColor Red
    Write-Host "Please start containers with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Waiting 10 seconds for initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 2: Bootstrap synchronizer domain
Write-Host "`nStep 2: Bootstrapping synchronizer domain..." -ForegroundColor Yellow
docker exec canton-synchronizer bin/canton daemon --config /canton/synchronizer.conf --bootstrap /canton/scripts/bootstrap-domain.sc

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to bootstrap synchronizer (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "This might be OK if domain already bootstrapped" -ForegroundColor Yellow
}

# Step 3: Connect participants to domain
Write-Host "`nStep 3: Connecting participants to domain..." -ForegroundColor Yellow
$participants = @("participant1", "participant2", "participant3")

foreach ($p in $participants) {
    Write-Host "  Connecting $p..." -ForegroundColor White
    docker exec "canton-$p" bin/canton daemon --config "/canton/$p.conf" --bootstrap /canton/scripts/connect-participant.sc
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Warning: Failed to connect $p (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
        Write-Host "  This might be OK if already connected" -ForegroundColor Yellow
    } else {
        Write-Host "  Success: $p connected" -ForegroundColor Green
    }
}

# Step 4: Create parties and extract JSON
Write-Host "`nStep 4: Creating parties and extracting IDs..." -ForegroundColor Yellow

try {
    $partyOutput = docker exec canton-participant1 bin/canton daemon --config /canton/participant1.conf --config /canton/participant2.conf --config /canton/participant3.conf --bootstrap /canton/scripts/create-parties.sc 2>&1
    
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
            break
        }
        if ($capturing) {
            $partyJson += $line.Trim()
        }
    }
    
    # Save to file
    $jsonContent = $partyJson -join "`n"
    $jsonContent | Out-File -FilePath "party-ids.json" -Encoding utf8 -NoNewline
    Write-Host "Success: Party IDs saved to party-ids.json" -ForegroundColor Green
    
    # Display for verification
    Write-Host "`nParty IDs:" -ForegroundColor Cyan
    Get-Content party-ids.json
} catch {
    Write-Host "Error creating parties: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Upload DAR file
Write-Host "`nStep 5: Uploading smart contracts (DAR)..." -ForegroundColor Yellow

$darFile = "..\daml\.daml\dist\payment-demo-0.0.1.dar"
if (-not (Test-Path $darFile)) {
    Write-Host "DAR file not found: $darFile" -ForegroundColor Red
    Write-Host "Please build Daml contracts first: cd daml; daml build" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found DAR file: $darFile" -ForegroundColor Green

# Copy DAR to all containers
$containers = @("canton-synchronizer", "canton-participant1", "canton-participant2", "canton-participant3")
foreach ($container in $containers) {
    Write-Host "  Copying DAR to $container..." -ForegroundColor White
    docker cp $darFile "${container}:/canton/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Success" -ForegroundColor Green
    } else {
        Write-Host "  Warning: Copy failed" -ForegroundColor Yellow
    }
}

# Upload DAR to all participants
Write-Host "`n  Uploading DAR to participants..." -ForegroundColor White
docker exec canton-participant1 bin/canton daemon --config /canton/participant1.conf --config /canton/participant2.conf --config /canton/participant3.conf --bootstrap /canton/scripts/upload-dar.sc

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Success: DAR uploaded to all participants" -ForegroundColor Green
} else {
    Write-Host "  Warning: DAR upload had issues (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Canton Initialization Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Copy party IDs to backend\.env file" -ForegroundColor White
Write-Host "2. Start backend: cd backend; npm install; npm run dev" -ForegroundColor White
Write-Host "3. Start frontend: cd frontend; npm install; npm start" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

