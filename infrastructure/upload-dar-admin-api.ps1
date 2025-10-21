# Upload DAR to Canton Participants via Admin API

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Canton DAR Upload via Admin API"
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$darFile = "C:\Users\mbo1\viz\daml\payment-demo-0.0.1.dar"

if (!(Test-Path $darFile)) {
    Write-Host "[ERROR] DAR file not found: $darFile" -ForegroundColor Red
    exit 1
}

Write-Host "DAR File: $darFile"
Write-Host "File Size: $((Get-Item $darFile).Length / 1KB) KB"
Write-Host ""

# Read DAR file as bytes
$darBytes = [System.IO.File]::ReadAllBytes($darFile)
$darBase64 = [Convert]::ToBase64String($darBytes)

# Function to upload DAR via Admin API
function Upload-DAR {
    param(
        [string]$participantName,
        [int]$adminPort
    )
    
    Write-Host "Uploading DAR to $participantName (port $adminPort)..." -NoNewline
    
    try {
        $body = @{
            dar_file = $darBase64
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod `
            -Uri "http://localhost:$adminPort/v1/dars" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 30
        
        Write-Host " [OK]" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Yellow
        return $false
    }
}

# Upload to all 3 participants
$results = @{
    "Participant1 (TechBank)" = Upload-DAR "Participant1" 5012
    "Participant2 (GlobalCorp)" = Upload-DAR "Participant2" 5022
    "Participant3 (RetailFinance)" = Upload-DAR "Participant3" 5032
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Upload Summary"
Write-Host "=====================================" -ForegroundColor Cyan
foreach ($key in $results.Keys) {
    $status = if ($results[$key]) { "[OK]" } else { "[FAIL]" }
    $color = if ($results[$key]) { "Green" } else { "Red" }
    Write-Host "$key : $status" -ForegroundColor $color
}

$successCount = ($results.Values | Where-Object { $_ -eq $true }).Count
Write-Host ""
if ($successCount -eq 3) {
    Write-Host "SUCCESS! All 3 participants have the DAR deployed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now test transactions:" -ForegroundColor Yellow
    Write-Host '  $body = @{sender="TechBank";receiver="GlobalCorp";amount=1000;description="Test"} | ConvertTo-Json'
    Write-Host '  Invoke-RestMethod -Uri http://localhost:3001/api/contracts -Method Post -Body $body -ContentType "application/json"'
} else {
    Write-Host "Some uploads failed. Check Canton Admin API logs." -ForegroundColor Yellow
}
Write-Host ""

