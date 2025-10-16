# 🚀 Quick Start - Frontend

## ⚡ 3-Minute Setup

```powershell
# Step 1: Navigate to frontend
cd frontend

# Step 2: Install dependencies (takes 30-60 seconds)
npm install

# Step 3: Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Step 4: Start development server
npm run dev
```

**Open:** http://localhost:3000

**Expected:** Green "Live" indicator in top-right corner

---

## ✅ Quick Test

1. **Submit Payment**
   - From: TechBank
   - To: GlobalCorp
   - Amount: 1000
   - Click "Submit to Canton Network"
   - ✅ Transaction appears immediately

2. **Test Privacy**
   - Click "View As: RetailFinance"
   - ✅ Transaction disappears

3. **Accept Payment**
   - Click "View As: GlobalCorp"
   - Click "Accept Payment" button
   - ✅ Status changes to green "Committed"

**Total Time:** 2 minutes

---

## 🐛 Quick Fixes

### Backend not running?
```powershell
cd ..\backend
npm run dev
```

### Port 3000 in use?
```powershell
# Kill process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or change port in vite.config.ts
```

### Dependencies not installing?
```powershell
# Clear cache and retry
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📸 Demo Screenshot Checklist

✅ Full page with transaction cards  
✅ Privacy filter sidebar highlighted  
✅ Accept button visible on pending transaction  
✅ Canton explainer modal open  
✅ Mobile responsive view (320px width)  

---

## 🎬 5-Second Pitch

> "Real-time privacy-preserving blockchain transactions with Canton Network. 
> Watch how parties only see their own transactions - privacy enforced at the blockchain level."

---

**That's it! You're ready to demo. 🚀**

