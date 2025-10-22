# 🚀 Canton Visualizer - Localhost Quick Start

Complete guide to run the redesigned Canton Visualizer on your local machine.

---

## Prerequisites

- ✅ Docker Desktop installed and running
- ✅ Node.js 18+ installed
- ✅ npm installed

---

## Step 1: Start Canton Network (Docker)

The Canton blockchain runs in Docker containers. Start them first:

```bash
# Navigate to project root
cd C:\Users\mbo1\viz

# Start Canton containers
docker compose -f infrastructure/docker-compose-simple.yml up -d

# Verify containers are running
docker ps
```

**Expected Output**: You should see 3 containers running:
- `canton-synchronizer` (port 5008)
- `canton-participant1` (port 5011) - TechBank
- `canton-participant2` (port 5012) - GlobalCorp  
- `canton-participant3` (port 5013) - RetailChain

**Wait ~30 seconds** for Canton to fully initialize.

### Check Canton Health

```bash
# Test synchronizer
curl http://localhost:5008/health

# Test participant nodes
curl http://localhost:5011/health
curl http://localhost:5012/health
curl http://localhost:5013/health
```

All should return `{"status":"healthy",...}`

---

## Step 2: Start Backend Server

Open a **new terminal window**:

```bash
cd C:\Users\mbo1\viz\backend

# Install dependencies (first time only)
npm install

# Start backend in development mode
npm run dev
```

**Expected Output**:
```
═══════════════════════════════════════════════════════════
  Canton Privacy Blockchain Visualizer - Backend Server
═══════════════════════════════════════════════════════════

Mounting API routes...
✓ /api/contracts
✓ /api/parties
✓ /api/events
✓ /api/admin
✓ /health

Server started on port 3001
Backend URL: http://localhost:3001
```

**Backend is now running at**: `http://localhost:3001`

### Test Backend

Open another terminal:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Get parties
curl http://localhost:3001/api/parties

# Get transactions
curl http://localhost:3001/api/contracts
```

---

## Step 3: Start Frontend Development Server

Open a **new terminal window**:

```bash
cd C:\Users\mbo1\viz\frontend

# Install dependencies (first time only)
npm install

# Start frontend dev server
npm run dev
```

**Expected Output**:
```
VITE v5.4.20  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Frontend is now running at**: `http://localhost:5173`

---

## Step 4: Open Application

Open your browser and navigate to:

**🌐 http://localhost:5173**

You should see:
- ✅ Header with "Canton Privacy Blockchain" title
- ✅ "CREATE" button (top right)
- ✅ Health status showing "Live" (green)
- ✅ Business panel (left side) with 3 parties
- ✅ Empty main area (no transactions yet)
- ✅ Synchronizer footer (bottom) showing network topology

---

## Step 5: Generate Demo Data (Optional but Recommended)

To populate the UI with 60+ realistic transactions:

### Option A: Use API Directly

```bash
# Seed 60 demo transactions
curl -X POST http://localhost:3001/api/admin/seed-demo \
  -H "Content-Type: application/json" \
  -d "{\"count\":60}"
```

### Option B: Via Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this JavaScript:

```javascript
fetch('http://localhost:3001/api/admin/seed-demo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ count: 60 })
})
.then(r => r.json())
.then(d => console.log('Demo data created:', d));
```

**This will**:
- Create 60 transactions across all RWA types
- Mix of pending (30%) and committed (70%)
- Diverse amounts appropriate to asset type
- Realistic metadata for each RWA type

**Wait ~30 seconds** for all transactions to be created. You'll see them appear in real-time via SSE!

---

## Step 6: Explore the UI

### Test Each Feature:

#### 1. **CREATE Transaction**
- Click "CREATE" button (top right)
- Fill in form with RWA type
- Submit
- Watch it appear in real-time!

#### 2. **Business Panel Filtering**
- Click on a party card (e.g., TechBank)
- See only transactions involving that party
- Click again to clear filter

#### 3. **View Modes**
- **Grid View** - Card-based layout (default)
- **List View** - Table with sortable columns
- **Flow View** - Visual RWA flow diagram

#### 4. **Transaction Details**
- Click any transaction card
- See detailed drill-down panel slide in
- View RWA details, timeline, blockchain metadata

#### 5. **Health Status**
- Click the "Live" indicator (top right)
- View system health dropdown
- See Backend API, Canton Network, SSE Stream status

#### 6. **Accept Transactions**
- Filter by a party (e.g., GlobalCorp)
- Find a pending transaction where GlobalCorp is receiver
- Click "Accept Payment"
- Watch it convert to committed in real-time!

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser: http://localhost:5173                         │
│  ├─ React + Vite + TailwindCSS                          │
│  ├─ Zustand State Management                            │
│  └─ Framer Motion Animations                            │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTP + SSE
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Backend: http://localhost:3001                         │
│  ├─ Express + TypeScript                                │
│  ├─ Canton Ledger API Client                            │
│  └─ Server-Sent Events                                  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ gRPC + JWT
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Canton Network (Docker)                                │
│  ├─ Synchronizer    :5008                               │
│  ├─ Participant 1   :5011  (TechBank)                   │
│  ├─ Participant 2   :5012  (GlobalCorp)                 │
│  └─ Participant 3   :5013  (RetailChain)                │
└─────────────────────────────────────────────────────────┘
```

---

## Useful Commands

### View Logs

```bash
# Backend logs
cd C:\Users\mbo1\viz\backend
npm run dev

# Docker logs
docker logs canton-participant1 -f
docker logs canton-synchronizer -f

# View all container logs
docker compose -f infrastructure/docker-compose-simple.yml logs -f
```

### Restart Services

```bash
# Restart Canton containers
docker compose -f infrastructure/docker-compose-simple.yml restart

# Restart backend (Ctrl+C then npm run dev)

# Restart frontend (Ctrl+C then npm run dev)
```

### Clean Reset

```bash
# Stop and remove containers
docker compose -f infrastructure/docker-compose-simple.yml down

# Remove volumes (clears all blockchain data)
docker compose -f infrastructure/docker-compose-simple.yml down -v

# Start fresh
docker compose -f infrastructure/docker-compose-simple.yml up -d
```

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 3001 | http://localhost:3001 |
| Canton Synchronizer | 5008 | http://localhost:5008 |
| Canton Participant 1 | 5011 | http://localhost:5011 |
| Canton Participant 2 | 5012 | http://localhost:5012 |
| Canton Participant 3 | 5013 | http://localhost:5013 |

---

## Troubleshooting

### Issue: "Connection Failed" in UI

**Cause**: Backend not running or can't connect to Canton

**Fix**:
```bash
# Check backend is running
curl http://localhost:3001/health

# Check Canton is running
docker ps

# Restart Canton if needed
docker compose -f infrastructure/docker-compose-simple.yml restart
```

---

### Issue: "Cannot find module" errors

**Cause**: Dependencies not installed

**Fix**:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

### Issue: Docker containers won't start

**Cause**: Port conflicts or Docker not running

**Fix**:
```bash
# Check what's using the ports
netstat -ano | findstr :5008
netstat -ano | findstr :5011

# Restart Docker Desktop

# Try starting containers again
docker compose -f infrastructure/docker-compose-simple.yml up -d
```

---

### Issue: No transactions appearing

**Cause**: SSE connection not established

**Fix**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for SSE connection to `/api/events`
4. Verify backend logs show "SSE client connected"

---

### Issue: Transactions not real-time updating

**Cause**: SSE connection dropped

**Fix**: Refresh the page - SSE will reconnect automatically

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Vite HMR - instant updates on file save
- **Backend**: ts-node-dev - auto-restart on file save

Just save your changes and see them instantly!

### Debug Mode

Enable verbose logging:

```bash
# Backend
cd backend
DEBUG=* npm run dev

# Frontend - check browser console
# All state changes logged to console
```

---

## Next Steps

1. ✅ Get everything running locally
2. ✅ Generate demo data (60 transactions)
3. ✅ Explore all UI features
4. ✅ Test creating and accepting transactions
5. ✅ Try different view modes
6. ✅ Test filtering and drill-down
7. 🚀 Deploy to production when ready!

---

## Need Help?

Check the logs:
- Backend: Terminal running `npm run dev`
- Frontend: Browser DevTools Console
- Canton: `docker logs canton-participant1 -f`

---

**Enjoy your privacy-preserving blockchain visualizer! 🎉**

