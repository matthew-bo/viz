# Quick Production Update Script
# Updates your live Digital Ocean deployment with latest GitHub code

$DROPLET_IP = "45.55.189.150"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Updating Canton Visualizer Production" -ForegroundColor Cyan
Write-Host "  Droplet: $DROPLET_IP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Commands to run on your droplet:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 1. Connect to droplet" -ForegroundColor Green
Write-Host "ssh root@$DROPLET_IP"
Write-Host ""
Write-Host "# 2. Navigate to project" -ForegroundColor Green
Write-Host "cd /root/viz"
Write-Host ""
Write-Host "# 3. Pull latest code from GitHub" -ForegroundColor Green
Write-Host "git pull origin main"
Write-Host ""
Write-Host "# 4. Rebuild and restart containers" -ForegroundColor Green
Write-Host "cd infrastructure"
Write-Host "docker compose down"
Write-Host "docker compose up -d --build"
Write-Host ""
Write-Host "# 5. Wait for Canton to initialize (60 seconds)" -ForegroundColor Green
Write-Host "sleep 60"
Write-Host ""
Write-Host "# 6. Verify all services running" -ForegroundColor Green
Write-Host "docker compose ps"
Write-Host ""
Write-Host "# 7. Check backend health" -ForegroundColor Green
Write-Host "curl http://localhost:3001/health"
Write-Host ""
Write-Host "# 8. View recent logs" -ForegroundColor Green
Write-Host "docker compose logs --tail=50 backend"
Write-Host "docker compose logs --tail=50 frontend"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Your live site: http://$DROPLET_IP`:3000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

