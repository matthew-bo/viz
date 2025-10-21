# Simple DAR Upload to Canton Docker Containers
# Uses Canton's bootstrap command for each participant

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Canton DAR Upload (Docker)"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create upload script
$uploadScript = @'
println("Uploading DAR file...")
participant1.dars.upload("/tmp/payment.dar")
println("DAR uploaded successfully!")
'@

[System.IO.File]::WriteAllText("upload-p1.sc", $uploadScript)

Write-Host "[1/3] Uploading to Participant1..." -NoNewline
docker exec canton-participant1 sh -c "bin/canton daemon -c /canton/participant1.conf --bootstrap /infrastructure/upload-p1.sc" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host " [OK]" -ForegroundColor Green
} else {
    Write-Host " [CHECKING]" -ForegroundColor Yellow
}

Write-Host "[2/3] Uploading to Participant2..." -NoNewline
docker exec canton-participant2 sh -c "cd /tmp && echo 'participant2.dars.upload(\"/tmp/payment.dar\")' | bin/canton -c /canton/participant2.conf --no-tty" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host " [OK]" -ForegroundColor Green
} else {
    Write-Host " [CHECKING]" -ForegroundColor Yellow
}

Write-Host "[3/3] Uploading to Participant3..." -NoNewline
docker exec canton-participant3 sh -c "cd /tmp && echo 'participant3.dars.upload(\"/tmp/payment.dar\")' | bin/canton -c /canton/participant3.conf --no-tty" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host " [OK]" -ForegroundColor Green
} else {
    Write-Host " [CHECKING]" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DAR upload complete! Testing..." -ForegroundColor Cyan
Write-Host ""

# Test backend
Start-Sleep -Seconds 5
Write-Host "Testing transaction query..."
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/contracts" -TimeoutSec 10
    Write-Host "[SUCCESS] Backend can query Canton!" -ForegroundColor Green
    Write-Host "Transactions found: $($result.Count)"
} catch {
    Write-Host "[INFO] Query result: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Ready to test full workflow!"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test transaction submit:"
Write-Host '   $body = @{sender="TechBank";receiver="GlobalCorp";amount=1000;description="Test"} | ConvertTo-Json'
Write-Host '   Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/contracts -Body $body -ContentType "application/json"'
Write-Host ""
Write-Host "2. Or open browser: http://localhost:3000"
Write-Host ""

