# Canton Privacy Blockchain Demo Script

**Duration:** 5 minutes | **Audience:** Technical recruiters  
**Last Updated:** October 15, 2025

## Pre-Demo Setup (Done Before Call)

### 1. Start Canton Infrastructure

```powershell
# Start all Canton containers
cd infrastructure
docker-compose up -d

# Wait for containers to be healthy (~30 seconds)
docker ps --filter "name=canton"
```

### 2. Initialize Canton Network

```powershell
# From project root
.\infrastructure\init-canton-final.ps1

# Verify initialization
Get-Content infrastructure/canton/party-ids.json
```

**Expected:** Real party IDs for TechBank, GlobalCorp, and RetailFinance.

### 3. Start Application Services

```powershell
# Backend (Phase 3 - not yet implemented)
cd backend
npm run dev

# Frontend (Phase 4 - not yet implemented)
cd frontend
npm run dev
```

### 4. Verify System Ready

1. Open browser to `http://localhost:3000`
2. Verify connection indicator shows "Live" (green dot)
3. Clear any existing transactions (optional fresh start)

## Demo Flow

*To be completed in Phase 6*

---

**Status:** Prerequisites updated with Canton initialization - Demo flow pending Phase 6

