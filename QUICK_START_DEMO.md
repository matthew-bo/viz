# 🚀 Quick Start - Run the Demo

This guide will get your Canton Privacy Blockchain Visualizer running locally in 3 steps.

---

## ✅ Prerequisites

Make sure you have:
- ✅ Canton containers running (`docker-compose up`)
- ✅ Backend initialized and running
- ✅ Node.js installed (v18+)

---

## 📦 Step 1: Install Frontend Dependencies

Open a **new terminal** in the project root:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install
```

**What this does**: Installs React, Vite, TailwindCSS, and all frontend dependencies.

---

## 🎨 Step 2: Start the Frontend Dev Server

In the same terminal:

```powershell
# Start Vite dev server
npm run dev
```

**Expected output**:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

The frontend will be available at: **http://localhost:5173/**

---

## 🏃 Step 3: Open in Browser

Open your browser and navigate to:

**http://localhost:5173/**

You should see:
- ✅ Canton Privacy Blockchain header
- ✅ Connection status (green "Live" indicator)
- ✅ Submit Payment Request form
- ✅ Privacy Filter sidebar
- ✅ Transaction cards (if any exist)

---

## 🧪 Test the New Features

### Test Toast Notifications
1. **Submit a payment** → See green success toast
2. **Disconnect backend** → See red error toast
3. **Reconnect** → See green connection toast

### Test Accessibility
1. Press `Tab` to navigate through all interactive elements
2. All buttons and inputs should have visible focus rings
3. Screen readers will announce all labels properly

### Test Error Boundary
1. Open browser DevTools console
2. In React DevTools, force an error in a component
3. See the error boundary fallback UI

### Test Performance
1. Open React DevTools Profiler
2. Submit multiple transactions
3. Change privacy filters
4. Verify components don't re-render unnecessarily (React.memo working)

---

## 🖥️ Full System Running

You should now have 3 terminals running:

### Terminal 1: Docker/Canton
```powershell
# In infrastructure/
docker-compose up
```
**Status**: Canton synchronizer + 3 participants running

### Terminal 2: Backend
```powershell
# In backend/
npm run dev
```
**Status**: Backend API running on port 3001

### Terminal 3: Frontend
```powershell
# In frontend/
npm run dev
```
**Status**: Frontend dev server running on port 5173

---

## 🎯 Demo Flow

Follow this sequence to demonstrate all features:

### 1. **Privacy Demonstration**
- Select "All Parties" in Privacy Filter
- Note all transactions are visible
- Select "TechBank" → Only TechBank transactions visible
- Select "GlobalCorp" → Only GlobalCorp transactions visible
- **Key Point**: Canton enforces privacy at blockchain level

### 2. **Submit Payment Request**
- From: **TechBank**
- To: **GlobalCorp**
- Amount: **1000**
- Description: "Q4 Invoice Payment"
- Click **Submit to Canton Network**
- ✅ See success toast notification
- ✅ See new card appear with "Pending" status
- ✅ Notice green "Visibility" indicators

### 3. **Accept Payment (Two-Party Signature)**
- Switch Privacy Filter to **GlobalCorp**
- Find the pending payment
- Click **Accept Payment** button
- ✅ See success toast
- ✅ Watch status change to "Committed"
- ✅ See "Committed" timestamp appear

### 4. **Real-Time Updates**
- Open browser in two windows side-by-side
- Submit payment in window 1
- ✅ See it appear instantly in window 2 (via SSE)
- Accept in window 2
- ✅ See status update instantly in window 1

### 5. **Canton Metadata**
- Click "Canton Metadata" on any transaction card
- ✅ See Transaction ID, Contract ID, Ledger Offset
- ✅ See Signatories (party IDs)
- **Key Point**: Full blockchain transparency

### 6. **Accessibility Features**
- Press `Tab` repeatedly to navigate
- ✅ All elements have visible focus
- ✅ All buttons are keyboard accessible
- Use screen reader (optional)
- ✅ All labels are properly announced

---

## 🐛 Troubleshooting

### Frontend won't start
```powershell
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Connection Failed" in UI
- ✅ Check backend is running on port 3001
- ✅ Check `.env` has `VITE_API_URL=http://localhost:3001`
- ✅ Check CORS is enabled in backend

### No transactions showing
- ✅ Check Canton containers are running: `docker ps`
- ✅ Check backend logs for errors
- ✅ Try submitting a new transaction
- ✅ Check Privacy Filter isn't hiding transactions

### Toast notifications not appearing
- ✅ Check browser console for errors
- ✅ Verify `App.tsx` imports `useToast` and `ToastContainer`
- ✅ Clear browser cache and hard refresh

---

## 🎨 UI/UX Highlights

### Design Features
- **Gradient backgrounds**: Professional, modern look
- **Smooth animations**: Fade-in, slide-up effects
- **Color-coded status**: Green (committed), Amber (pending), Red (rejected)
- **Hover effects**: Shadow elevation on cards
- **Responsive grid**: Adapts to screen size
- **Sticky header**: Always visible navigation

### Accessibility Features
- **ARIA labels**: Full screen reader support
- **Focus indicators**: Visible keyboard navigation
- **Semantic HTML**: Proper document structure
- **Live regions**: Dynamic content announcements
- **Form validation**: Clear error messages

### Performance Features
- **React.memo**: Prevents unnecessary re-renders
- **Optimized state**: Efficient updates
- **SSE auto-reconnect**: Resilient connection
- **Lazy rendering**: Only visible content

---

## 📸 Screenshot Checklist

For your portfolio/demo, capture these screens:

1. ✅ **Full dashboard** - All parties view with multiple transactions
2. ✅ **Privacy filter in action** - Side-by-side comparison
3. ✅ **Submit payment form** - Clean, professional UI
4. ✅ **Transaction card** - With metadata expanded
5. ✅ **Toast notifications** - Success message visible
6. ✅ **Pending acceptance** - Show green "Accept Payment" button
7. ✅ **Mobile view** - Responsive design

---

## 🚀 Production Build (Optional)

When ready to deploy:

```powershell
# In frontend/
npm run build

# Output will be in frontend/dist/
# Serve with any static file server
npm run preview  # Test production build locally
```

---

## 📞 Need Help?

- **Frontend not connecting**: Check `.env` file
- **Backend errors**: Check `backend/dist` and restart
- **Canton issues**: Check Docker logs: `docker-compose logs`
- **Styling issues**: Check TailwindCSS config

---

## ✨ You're Ready!

Your Canton Privacy Blockchain Visualizer is now running with:
- ✅ Professional toast notifications
- ✅ React error boundary
- ✅ Full accessibility support
- ✅ Performance optimizations
- ✅ Real-time updates via SSE
- ✅ Privacy-preserving multi-party transactions

**Enjoy your demo! 🎉**

