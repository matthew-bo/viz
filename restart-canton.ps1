# Restart Canton containers with updated configuration
Write-Host "Restarting Canton containers..." -ForegroundColor Cyan

Set-Location infrastructure

Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "Starting containers with new configuration..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Waiting for containers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Container status:" -ForegroundColor Cyan
docker ps --filter "name=canton"

Set-Location ..

Write-Host ""
Write-Host "SUCCESS! Canton restarted with JSON API enabled" -ForegroundColor Green
Write-Host "JSON API Ports: 7011, 7021, 7031" -ForegroundColor Cyan

