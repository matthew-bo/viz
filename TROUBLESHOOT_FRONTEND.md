# 🔧 Frontend Troubleshooting Steps

## The Issue
Browser shows "Connection Refused" but backend is actually running.

## Solution: Hard Refresh

The browser has **cached the connection errors** from when the backend was down.

### Windows/Linux:
```
Ctrl + Shift + R
or
Ctrl + F5
```

### Mac:
```
Cmd + Shift + R
```

## Alternative: Clear Cache
1. Press F12 (Developer Tools)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## If Still Not Working

### Check Backend is Running:
In a new PowerShell terminal:
```powershell
curl http://localhost:3001/api/parties -UseBasicParsing | ConvertFrom-Json
```

Should show 3 parties.

### Check Frontend .env:
```powershell
cd C:\Users\mbo1\viz\frontend
Get-Content .env
```

Should show:
```
VITE_API_URL=http://localhost:3001
```

