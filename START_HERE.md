# 🚀 Quick Start - Canton Visualizer (Localhost)

## Step-by-Step Manual Startup

Follow these steps in order. Each step should be run in a **separate terminal/PowerShell window**.

---

## Terminal 1: Backend

```powershell
cd C:\Users\mbo1\viz\backend
npm run dev
```

**Expected output:**
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

**If you see errors**, stop here and let me know what error you see.

**Test it works:**
Open browser to `http://localhost:3001/health` - should show `{"status":"healthy",...}`

---

## Terminal 2: Frontend

```powershell
cd C:\Users\mbo1\viz\frontend
npm run dev
```

**Expected output:**
```
VITE v5.4.20  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Test it works:**
Open browser to `http://localhost:5173` - should show the Canton Visualizer UI

---

## If Frontend Says "Cannot GET /"

This usually means Vite isn't starting. Check for these issues:

### Issue 1: Missing dependencies
```powershell
cd C:\Users\mbo1\viz\frontend
npm install
```

### Issue 2: Port already in use
```powershell
# Check what's using port 5173
netstat -ano | findstr :5173

# If something is using it, change the port:
# Edit frontend/vite.config.ts and change port
```

### Issue 3: Build errors
```powershell
cd C:\Users\mbo1\viz\frontend
npm run build
```

If build fails, tell me the error message.

---

## Alternative: Use Production Docker Setup

If dev mode isn't working, you can use the production Docker containers:

```powershell
cd C:\Users\mbo1\viz

# Stop any running containers
docker stop backend frontend canton-single-node

# Start everything
docker compose -f infrastructure/docker-compose-simple.yml up -d

# Wait 30 seconds
Start-Sleep -Seconds 30

# Open browser to:
# http://localhost:3000
```

---

## Quick Diagnostics

Run these to check what's happening:

```powershell
# Check Canton is running
docker ps

# Check backend port
netstat -ano | findstr :3001

# Check frontend port
netstat -ano | findstr :5173

# Test backend
curl http://localhost:3001/health

# Check Docker logs
docker logs canton-single-node --tail 50
```

---

## What to Do Right Now

1. **Open Terminal 1**, run the backend command above
2. Wait for "Server started on port 3001"
3. **Open Terminal 2**, run the frontend command above  
4. Wait for "Local: http://localhost:5173"
5. **Open browser** to `http://localhost:5173`

If any step fails, **copy the error message** and let me know!

