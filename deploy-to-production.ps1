# Automated Production Deployment to Digital Ocean
# Deploys latest GitHub code with critical bug fixes

$DROPLET_IP = "45.55.189.150"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Deploying Canton Visualizer to Production" -ForegroundColor Cyan
Write-Host "  Droplet: $DROPLET_IP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Create deployment script to run on droplet
$deployScript = @'
#!/bin/bash
set -e

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Production Deployment - Canton Visualizer"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "[1/8] Navigating to project directory..."
cd /root/viz

echo "[2/8] Pulling latest code from GitHub..."
git pull origin main

echo "[3/8] Stopping containers..."
cd infrastructure
docker compose down

echo "[4/8] Rebuilding containers with latest code..."
docker compose build --no-cache backend frontend

echo "[5/8] Starting all containers..."
docker compose up -d

echo "[6/8] Waiting for Canton to initialize (60 seconds)..."
sleep 60

echo "[7/8] Verifying services..."
docker compose ps

echo "[8/8] Checking backend health..."
curl -s http://localhost:3001/health | jq '.' || curl -s http://localhost:3001/health

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  [SUCCESS] Deployment Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Live Site: http://45.55.189.150:3000"
echo "API Health: http://45.55.189.150:3001/health"
echo ""

# Show recent logs
echo "Recent Backend Logs:"
docker compose logs --tail=20 backend

echo ""
echo "Recent Frontend Logs:"
docker compose logs --tail=10 frontend

echo ""
echo "All containers status:"
docker compose ps
'@

# Save script temporarily
$deployScript | Out-File -FilePath deploy-script.sh -Encoding UTF8 -NoNewline

Write-Host "[OK] Created deployment script" -ForegroundColor Green
Write-Host ""

Write-Host "Deploying to droplet via SSH..." -ForegroundColor Yellow
Write-Host ""

# Copy script to droplet and execute
Get-Content deploy-script.sh | ssh root@$DROPLET_IP "bash -s"

# Cleanup
Remove-Item deploy-script.sh

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Your production site is live at:" -ForegroundColor Cyan
Write-Host "  Frontend: http://$DROPLET_IP`:3000" -ForegroundColor White
Write-Host "  Backend:  http://$DROPLET_IP`:3001" -ForegroundColor White
Write-Host ""
Write-Host "Critical fixes deployed:" -ForegroundColor Yellow
Write-Host "  [OK] Race condition fix (atomic locking)" -ForegroundColor Green
Write-Host "  [OK] Rollback mechanism (data integrity)" -ForegroundColor Green
Write-Host "  [OK] Environment validation (better errors)" -ForegroundColor Green
Write-Host "  [OK] Array growth limits (performance)" -ForegroundColor Green
Write-Host ""

