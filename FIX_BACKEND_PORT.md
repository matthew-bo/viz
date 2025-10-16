# 🔧 Fix Backend Port Already in Use

## The Problem
Port 3001 is already being used by another process.

## Quick Fix

Run these commands in PowerShell:

```powershell
# Find what's using port 3001
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Get-Process -Id $_ }

# Kill the process using port 3001
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Now start the backend again
cd C:\Users\mbo1\viz\backend
npm run dev
```

## Alternative: Use Task Manager

1. Open Task Manager (Ctrl+Shift+Esc)
2. Find any `node.exe` processes
3. End the one using port 3001
4. Restart backend with `npm run dev`

