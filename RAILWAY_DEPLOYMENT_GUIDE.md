# Railway.app Deployment Guide - Canton Privacy Visualizer

**Date:** October 20, 2025  
**Estimated Time:** 1-2 hours  
**Monthly Cost:** $30-48

---

## 📋 Prerequisites

Before starting:
- [ ] GitHub account
- [ ] Railway.app account (sign up at railway.app)
- [ ] Credit card for Railway billing
- [ ] Git installed locally
- [ ] All code committed to Git

---

## Step 1: Prepare Git Repository (15 minutes)

### 1.1 Create .gitignore additions

Make sure these are NOT committed:
```
.env
party-ids.json
node_modules/
dist/
```

### 1.2 Commit all code

```powershell
cd C:\Users\mbo1\viz
git add .
git commit -m "Phase 6: Railway deployment ready - Dockerfiles and configs"
```

### 1.3 Create GitHub Repository

1. Go to https://github.com/new
2. Name: `canton-privacy-visualizer` (or your choice)
3. Make it **Public** (for portfolio visibility) or Private
4. **Don't** initialize with README (you already have one)
5. Click "Create repository"

### 1.4 Push to GitHub

```powershell
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/canton-privacy-visualizer.git

# Push
git branch -M main
git push -u origin main
```

**Verify:** Check GitHub - all your files should be there

---

## Step 2: Set Up Railway Account (5 minutes)

### 2.1 Sign Up
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email
4. Verify email if needed

### 2.2 Add Payment Method
1. Go to Account Settings
2. Add credit card
3. Railway offers $5 free credit (covers first few hours)

---

## Step 3: Deploy Canton Infrastructure (20 minutes)

Railway doesn't support docker-compose directly, so we'll deploy each service separately.

### 3.1 Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select `canton-privacy-visualizer` repository

### 3.2 Deploy Synchronizer

**In Railway Dashboard:**

1. Click "New Service" → "GitHub Repo"
2. Select your repo
3. **Root Directory:** `infrastructure`
4. **Dockerfile Path:** Leave blank (will detect)
5. Service Name: `canton-synchronizer`

**Configure Service:**
- Click on service → Settings
- **Start Command:** `bin/canton daemon --config /canton/synchronizer.conf`
- **Exposed Port:** 5018, 5019
- **Environment Variables:**
  - (None needed for synchronizer)

### 3.3 Deploy Participant 1

Repeat for each participant:

**Service Name:** `canton-participant1`
**Start Command:** `bin/canton daemon --config /canton/participant1.conf`
**Exposed Ports:** 5011, 5012, 7011

### 3.4 Deploy Participant 2

**Service Name:** `canton-participant2`
**Start Command:** `bin/canton daemon --config /canton/participant2.conf`
**Exposed Ports:** 5021, 5022, 7021

### 3.5 Deploy Participant 3

**Service Name:** `canton-participant3`
**Start Command:** `bin/canton daemon --config /canton/participant3.conf`
**Exposed Ports:** 5031, 5032, 7031

---

## Step 4: Initialize Canton Network (10 minutes)

Once all Canton services are running:

### 4.1 Access Synchronizer Console

Railway provides a shell access:

1. Click on `canton-synchronizer` service
2. Click "Connect" → "Shell"
3. Or use Railway CLI:

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link
```

### 4.2 Run Initialization Script

**Option A: Via Railway Shell**
1. Upload init script via Railway dashboard
2. Run: `./init-canton-final.ps1` or `./init-canton.sh`

**Option B: Use Railway CLI**
```powershell
railway run bash
# Then run init script
```

### 4.3 Extract Party IDs

After initialization:
1. Copy party IDs from output
2. Save them for backend environment variables

---

## Step 5: Deploy Backend (15 minutes)

### 5.1 Create Backend Service

1. Click "New Service" → "GitHub Repo"
2. Select your repo
3. **Root Directory:** `backend`
4. **Dockerfile:** Will auto-detect `Dockerfile`
5. Service Name: `canton-backend`

### 5.2 Configure Backend Environment Variables

**CRITICAL:** Set these in Railway dashboard:

Click service → Variables tab:

```bash
# Canton Participant URLs (use Railway internal DNS)
PARTICIPANT1_LEDGER_API=http://canton-participant1.railway.internal:7011
PARTICIPANT2_LEDGER_API=http://canton-participant2.railway.internal:7021
PARTICIPANT3_LEDGER_API=http://canton-participant3.railway.internal:7031

# Party IDs (from Step 4.3)
TECHBANK_PARTY_ID=TechBank::1220...
GLOBALCORP_PARTY_ID=GlobalCorp::1220...
RETAILFINANCE_PARTY_ID=RetailFinance::1220...

# Server config
PORT=3001
NODE_ENV=production

# JWT Secret (CHANGE THIS!)
JWT_SECRET=<generate-secure-random-string>

# CORS (will set after frontend deployed)
CORS_ORIGIN=*
```

**Generate JWT Secret:**
```powershell
# PowerShell
$bytes = [byte[]]::new(32)
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 5.3 Get Backend URL

After deployment:
1. Click on backend service
2. Go to Settings → Domains
3. Click "Generate Domain"
4. Copy the URL: `https://canton-backend-production.up.railway.app`

---

## Step 6: Deploy Frontend (15 minutes)

### 6.1 Create Frontend Service

1. Click "New Service" → "GitHub Repo"
2. Select your repo
3. **Root Directory:** `frontend`
4. **Dockerfile:** Will auto-detect
5. Service Name: `canton-frontend`

### 6.2 Configure Frontend Build

**Set Build Arguments:**

In Railway settings → Build:
- **Build Args:**
  - `VITE_API_URL=https://canton-backend-production.up.railway.app`

Replace with your actual backend URL from Step 5.3

### 6.3 Generate Public URL

1. Click on frontend service
2. Go to Settings → Networking
3. Click "Generate Domain"
4. Copy URL: `https://canton-frontend-production.up.railway.app`

**This is your public application URL!** 🎉

---

## Step 7: Update CORS Settings (5 minutes)

### 7.1 Update Backend CORS

Go back to backend service → Variables:

Change:
```bash
CORS_ORIGIN=*
```

To:
```bash
CORS_ORIGIN=https://canton-frontend-production.up.railway.app
```

Replace with your actual frontend URL.

### 7.2 Redeploy Backend

After changing environment variables, backend will auto-redeploy.

---

## Step 8: Verification (10 minutes)

### 8.1 Test Backend API

```powershell
curl https://canton-backend-production.up.railway.app/health
```

Expected:
```json
{"status":"healthy","timestamp":"..."}
```

### 8.2 Test Frontend

Open in browser:
```
https://canton-frontend-production.up.railway.app
```

Expected:
- ✅ Application loads
- ✅ Green "Live" connection indicator
- ✅ 3 parties displayed
- ✅ Can submit transactions
- ✅ Can accept transactions
- ✅ Privacy filtering works

### 8.3 Check All Services

In Railway dashboard:
- ✅ 6 services all showing "Active"
- ✅ No crash loops
- ✅ Logs show healthy output

---

## Step 9: Cost Management

### 9.1 Monitor Usage

Railway Dashboard → Usage:
- Check monthly spending
- Set up alerts
- Monitor resource usage per service

### 9.2 Optimize Costs (Optional)

**Reduce costs by:**
- Using smaller RAM limits (if services allow)
- Pausing services when not demoing
- Using shared CPU instead of dedicated

### 9.3 Pause Services

When not in use:
```powershell
# Via CLI
railway down
```

Or in Dashboard:
- Click each service → Settings → "Sleep Service"

**Resume before demo:**
```powershell
railway up
```

---

## Step 10: Update Documentation (10 minutes)

### 10.1 Update README.md

Add at the top:

```markdown
# Canton Privacy Blockchain Visualizer

## 🚀 Live Demo

**Application URL:** https://canton-frontend-production.up.railway.app
**Backend API:** https://canton-backend-production.up.railway.app
**Status:** ✅ Deployed and operational

## Technology Stack
- Canton 2.7.6 Blockchain (3 participants + synchronizer)
- Daml Smart Contracts
- Node.js + TypeScript Backend
- React + Vite Frontend
- Docker Containerization
- Railway.app Hosting
```

### 10.2 Update IMPLEMENTATION_PLAN.md

Mark Phase 6 as complete with Railway URLs.

### 10.3 Take Screenshots

For portfolio:
1. Main application view
2. Transaction submission
3. Privacy filtering
4. Accept workflow
5. Railway dashboard showing all services

---

## 🎯 Success Criteria

Phase 6 is complete when:

- [X] All 6 services deployed to Railway
- [X] All services showing "Active" status
- [X] Canton network initialized with real party IDs
- [X] Backend API responding to health checks
- [X] Frontend loads and displays correctly
- [X] Can submit and accept transactions
- [X] Privacy filtering works
- [X] Public URLs documented in README
- [X] Screenshots taken for portfolio

---

## 🐛 Troubleshooting

### Issue: Service crashes on startup

**Check logs:**
1. Click service → Logs tab
2. Look for error messages

**Common causes:**
- Missing environment variables
- Incorrect Canton URLs
- Memory limits too low

**Fix:**
- Add missing variables
- Increase memory limit (Settings → Resources)

### Issue: Backend can't connect to Canton

**Check internal DNS:**
```bash
# Services should use Railway internal DNS:
canton-participant1.railway.internal:7011
```

Not:
```bash
# Don't use external URLs
https://canton-participant1-production.up.railway.app
```

### Issue: Frontend shows network errors

**Check CORS:**
- Backend `CORS_ORIGIN` must match frontend URL exactly
- Include `https://` protocol
- No trailing slash

### Issue: Costs higher than expected

**Check:**
1. Resource usage per service
2. Any services in crash loop (wasting resources)
3. Unnecessary exposed ports

**Optimize:**
- Set memory limits explicitly
- Sleep services when not in use
- Share networking where possible

---

## 📊 Expected Costs Breakdown

| Service | Memory | CPU | Est. Cost |
|---------|--------|-----|-----------|
| Synchronizer | 800MB | Shared | $6-8/mo |
| Participant 1 | 600MB | Shared | $5-7/mo |
| Participant 2 | 600MB | Shared | $5-7/mo |
| Participant 3 | 600MB | Shared | $5-7/mo |
| Backend | 256MB | Shared | $5-7/mo |
| Frontend | 128MB | Shared | $5-7/mo |
| **TOTAL** | ~3GB | - | **$31-43/mo** |

---

## 🎉 You're Done!

**Your Canton Privacy Visualizer is now live!**

**Share these URLs:**
- **Demo:** https://canton-frontend-production.up.railway.app
- **GitHub:** https://github.com/YOUR_USERNAME/canton-privacy-visualizer
- **Portfolio:** Add to resume/LinkedIn with screenshots

**For Recruiters:**
> "I built and deployed a privacy-preserving blockchain application using Canton Network,
> featuring 3 independent blockchain participants, real-time Server-Sent Events,
> multi-party transaction workflows, and ledger-level privacy enforcement.
> The full stack is containerized and deployed to Railway with 6 services."

---

**Questions during deployment?** Check logs first, then Railway documentation at docs.railway.app

