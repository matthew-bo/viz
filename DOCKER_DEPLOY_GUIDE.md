# Docker Deployment Guide - Canton Privacy Visualizer

## Local Docker Stack Testing

### Prerequisites
- Docker Desktop installed and running
- Canton containers previously initialized (party IDs exist)

### Step 1: Build and Start All Services

```powershell
cd infrastructure
docker-compose up --build -d
```

This will start:
- 4 Canton containers (synchronizer + 3 participants)
- 1 Backend container (Node.js API on port 3001)
- 1 Frontend container (Nginx on port 3000)

**Total: 6 containers**

### Step 2: Wait for Initialization

```powershell
# Wait ~60 seconds for Canton to initialize
timeout /t 60

# Initialize Canton (creates parties, uploads DAR)
.\init-canton-final.ps1
```

### Step 3: Verify Services

```powershell
# Check all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Should show:
# - canton-synchronizer  (healthy)
# - canton-participant1  (healthy)
# - canton-participant2  (healthy)
# - canton-participant3  (healthy)
# - canton-backend       (healthy)
# - canton-frontend      (healthy)
```

### Step 4: Test Application

**Backend API:**
```powershell
curl http://localhost:3001/health
# Expected: {"status":"healthy","timestamp":"..."}

curl http://localhost:3001/api/parties
# Expected: Array of 3 parties with Canton IDs
```

**Frontend:**
Open browser to: http://localhost:3000

Expected:
- ✅ Green "Live" connection indicator
- ✅ System Status shows all green
- ✅ 3 parties loaded (TechBank, GlobalCorp, RetailFinance)
- ✅ Can submit transactions
- ✅ Real-time updates working

### Step 5: View Logs

```powershell
# Backend logs
docker logs canton-backend

# Frontend logs  
docker logs canton-frontend

# Canton logs
docker logs canton-participant1
```

### Troubleshooting

**Issue: Backend can't connect to Canton**
```powershell
# Check backend .env file has correct URLs
# Should use container names: canton-participant1:7011
cat backend\.env | findstr PARTICIPANT
```

**Issue: Frontend can't connect to backend**
```powershell
# Check frontend was built with correct API URL
docker logs canton-frontend | findstr VITE_API_URL
```

**Issue: Port already in use**
```powershell
# Stop all containers
docker-compose down

# Check what's using the port
netstat -ano | findstr :3001
netstat -ano | findstr :3000
```

---

## Cloud Deployment Options

### Option 1: Railway.app (RECOMMENDED - Easiest)

**Cost:** ~$20-30/month  
**Pros:** Automatic builds from Git, built-in monitoring, simple setup  
**Cons:** Requires credit card

**Steps:**

1. **Push to GitHub:**
```powershell
git add .
git commit -m "Phase 6: Docker deployment ready"
git push origin main
```

2. **Install Railway CLI:**
```powershell
npm install -g @railway/cli
railway login
```

3. **Create Railway Project:**
```powershell
railway init
```

4. **Deploy Services:**

Each service gets its own Railway deployment:

```powershell
# Deploy Canton infrastructure (4 containers)
cd infrastructure
railway up

# Deploy backend
cd ../backend
railway up

# Deploy frontend (with build arg for backend URL)
cd ../frontend
railway up
```

5. **Set Environment Variables:**

In Railway dashboard:
- Backend: Set party IDs from party-ids.json
- Frontend: Set VITE_API_URL to backend's Railway URL
- Canton: Network configuration

6. **Initialize Canton:**
```powershell
# SSH into Railway container
railway run bash
./init-canton-final.ps1
```

### Option 2: Fly.io

**Cost:** ~$25-35/month  
**Pros:** Global edge network, more control  
**Cons:** More complex setup

**Steps:**

1. **Install Fly CLI:**
```powershell
curl -L https://fly.io/install.sh | sh
flyctl auth login
```

2. **Create fly.toml for each service:**

```powershell
# Backend
cd backend
flyctl launch --no-deploy
# Edit fly.toml as needed

# Frontend
cd frontend
flyctl launch --no-deploy
# Edit fly.toml as needed
```

3. **Set Secrets:**
```powershell
flyctl secrets set TECHBANK_PARTY_ID="..." -a backend-app
flyctl secrets set GLOBALCORP_PARTY_ID="..." -a backend-app
flyctl secrets set RETAILFINANCE_PARTY_ID="..." -a backend-app
```

4. **Deploy:**
```powershell
flyctl deploy
```

### Option 3: DigitalOcean/Linode VPS

**Cost:** ~$6-12/month  
**Pros:** Cheapest, full control  
**Cons:** Requires server management, SSH, etc.

**Steps:**

1. Create VPS with Docker installed
2. Copy docker-compose.yml to server
3. SSH and run: `docker-compose up -d`
4. Set up reverse proxy (Nginx/Caddy) for HTTPS
5. Point domain to server IP

---

## Production Checklist

Before deploying to production:

### Security
- [ ] Change JWT_SECRET to strong random value (backend/.env)
- [ ] Set CORS_ORIGIN to actual frontend URL (backend/.env)
- [ ] Enable HTTPS (use Caddy/Nginx/Railway automatic HTTPS)
- [ ] Review Canton participant configurations for security

### Performance
- [ ] Test with multiple concurrent users
- [ ] Verify SSE connections don't leak
- [ ] Monitor memory usage (Canton can be heavy)
- [ ] Set appropriate Docker resource limits

### Monitoring
- [ ] Set up health check monitoring (UptimeRobot, Pingdom)
- [ ] Configure log aggregation (if needed)
- [ ] Set up alerts for container crashes

### Documentation
- [ ] Update README with deployment URL
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Add deployment diagram

---

## Cost Comparison

| Platform | Monthly Cost | Complexity | Uptime SLA |
|----------|-------------|------------|------------|
| **Local Only** | $0 | Low | N/A |
| **Railway** | $20-30 | ⭐ Low | 99.9% |
| **Fly.io** | $25-35 | ⭐⭐ Medium | 99.99% |
| **VPS (DigitalOcean)** | $6-12 | ⭐⭐⭐ High | 99.99% |
| **AWS/GCP** | $30-50+ | ⭐⭐⭐⭐ Very High | 99.99% |

**Recommendation for Portfolio:**
- **Budget Priority:** Local + recorded video demo ($0)
- **Best Impression:** Railway ($20-30/month)
- **Learning Opportunity:** VPS ($6-12/month)

---

## Next Steps

1. **Test local Docker stack** (this guide)
2. **Choose deployment platform** (Railway recommended)
3. **Deploy to cloud**
4. **Update README** with live URL
5. **Take screenshots** for portfolio
6. **Share with recruiters!** 🚀

---

**Questions?** Check the troubleshooting section or review the main PHASE6_DEPLOYMENT_PLAN.md

