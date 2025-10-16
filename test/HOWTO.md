# How to Use the Phase 5 Test Suite

**Quick Reference Guide for Running Tests**

---

## 🚀 Quick Start (3 Steps)

```powershell
# 1. Verify everything is running
.\test\utils\verify-backend.ps1

# 2. Run all automated tests
.\test\run-all-tests.ps1

# 3. Complete manual E2E testing
# Open: test/4-e2e/test-full-workflow.md
```

---

## 📋 Before You Begin

### Prerequisites Checklist

- [ ] Canton containers running (4/4)
- [ ] Backend running on port 3001
- [ ] Frontend running (for E2E tests)
- [ ] Party IDs initialized in party-ids.json

### Quick Verification

```powershell
# Check Canton
docker ps --filter "name=canton-"  # Should show 4 containers

# Check backend
curl http://localhost:3001/health  # Should return {"status":"healthy"}

# Check party IDs
Get-Content infrastructure\canton\party-ids.json  # Should have 3 parties
```

---

## 🧪 Running Tests

### Option 1: Run All Tests (Recommended)

```powershell
.\test\run-all-tests.ps1
```

**What it does:**
- Pre-flight checks (backend health)
- Infrastructure tests (Canton health)
- API tests (all 6 endpoints)
- Privacy tests (CRITICAL)
- Generates test report log
- Shows pass/fail summary

**Expected time:** 30-60 seconds

---

### Option 2: Run Specific Test Category

#### Infrastructure Tests Only
```powershell
cd test\1-infrastructure
.\test-containers.ps1  # Verify Canton containers
.\test-domain.ps1      # Verify domain
.\test-parties.ps1     # Verify party IDs
.\test-dar-upload.ps1  # Verify DAR deployment
```

#### API Tests Only
```powershell
cd test\2-api
.\test-health.ps1              # GET /health
.\test-parties-endpoint.ps1    # GET /api/parties
.\test-contracts-submit.ps1    # POST /api/contracts
.\test-contracts-accept.ps1    # POST /api/contracts/:id/accept
.\test-contracts-query.ps1     # GET /api/contracts
.\test-sse.ps1                 # GET /api/events
```

#### Privacy Tests Only (**CRITICAL**)
```powershell
cd test\3-privacy
.\test-two-party-privacy.ps1   # Verify third party CANNOT see
.\test-visibility-matrix.ps1   # Complete visibility testing
```

---

## 🔍 Understanding Test Results

### Pass/Fail Indicators

```
[PASS] Test Name (0.5s)  ← Test passed
[FAIL] Test Name (1.2s)  ← Test failed
[ERROR] Test Name        ← Test crashed
```

### Reading the Summary

```
Total Tests: 12
Passed: 12
Failed: 0
Pass Rate: 100%
```

**90%+ = Excellent** ✅  
**75-89% = Good** ⚠️  
**<75% = Needs Work** ❌

---

## 🐛 What to Do When Tests Fail

### Step 1: Identify the Failed Test

```powershell
# Check the log file
Get-Content test\test-results-*.log | Select-String "FAIL"
```

### Step 2: Run That Test Individually

```powershell
# Example: If privacy test failed
.\test\3-privacy\test-two-party-privacy.ps1
```

### Step 3: Common Fixes

#### "Backend not accessible"
```powershell
cd backend
npm run dev
```

#### "Canton containers not running"
```powershell
cd infrastructure
docker-compose up -d
Start-Sleep -Seconds 60
```

#### "Party IDs not found"
```powershell
.\infrastructure\init-canton-final.ps1
```

#### "Privacy violation detected" (CRITICAL!)
```powershell
# 1. Verify party IDs in backend/.env match party-ids.json
Get-Content infrastructure\canton\party-ids.json
Get-Content backend\.env | Select-String "PARTY_ID"

# 2. Restart backend after fixing .env
cd backend
npm run dev

# 3. Re-run privacy tests
.\test\3-privacy\test-two-party-privacy.ps1
```

---

## 🔄 Resetting the Test Environment

### When to Reset
- Tests are inconsistent
- Too many old transactions
- Canton was restarted (in-memory storage cleared)
- Party IDs changed

### How to Reset
```powershell
.\test\utils\cleanup.ps1
```

**This will:**
1. Stop all Canton containers
2. Restart containers (clears in-memory data)
3. Re-initialize Canton with new party IDs
4. Update party-ids.json

**Then update backend:**
```powershell
# Copy new party IDs to backend/.env
.\create-backend-env.ps1

# Restart backend
cd backend
npm run dev
```

---

## 📊 Manual Testing

### E2E Workflow Test

**File:** `test/4-e2e/test-full-workflow.md`

**What it covers:**
- Complete user journey (50+ steps)
- Privacy filtering validation
- Accept workflow
- Real-time updates
- Performance measurements

**How to use:**
1. Open the file
2. Follow each step
3. Check off completed steps
4. Document any issues found
5. Record performance metrics

---

## 📈 Performance Benchmarking

### Measure SSE Latency

1. Open browser to frontend
2. Open DevTools → Network → Filter "events"
3. Submit a transaction
4. Measure time between:
   - Request finish
   - SSE message received
5. Should be **<100ms**

### Measure Query Performance

```powershell
# Use PowerShell's Measure-Command
Measure-Command { curl http://localhost:3001/api/contracts }
```

Should be **<200ms**

---

## 📝 Documenting Test Results

### After Running Tests

1. **Check the log file:**
   ```powershell
   Get-Content test\test-results-*.log
   ```

2. **Fill out test report:**
   - Open `test/test-report-template.md`
   - Copy to `test/test-report-YYYY-MM-DD.md`
   - Fill in all sections
   - Document any bugs found

3. **Update IMPLEMENTATION_PLAN.md:**
   - Mark Phase 5 checklist items
   - Note any issues

---

## 🎯 Success Criteria

### Minimum Requirements for Phase 5 Pass

- [ ] All infrastructure tests passing (4/4)
- [ ] All API tests passing (6/6)
- [ ] **All privacy tests passing (2/2)** ⚠️ CRITICAL
- [ ] E2E workflow completes successfully (50/50 steps)
- [ ] SSE latency <100ms
- [ ] Query performance <200ms
- [ ] No P0 (critical) bugs

### What "PASS" Means

✅ **Infrastructure:** Canton is healthy and operational  
✅ **API:** All endpoints work correctly  
✅ **Privacy:** Canton enforces privacy at ledger level  
✅ **E2E:** Full user workflow works smoothly  
✅ **Performance:** Meets target metrics  

**Result:** **READY FOR DEPLOYMENT (Phase 6)**

---

## 🚨 Critical Tests (DO NOT SKIP)

### Privacy Tests Are Non-Negotiable

**If privacy tests fail, DO NOT DEPLOY.**

Privacy is the core value proposition. If a third party can see transactions they shouldn't:
- The entire privacy model is broken
- This is a **security vulnerability**
- Canton configuration is wrong

**Fix immediately before proceeding.**

---

## 💡 Tips & Best Practices

### 1. Run Tests After Every Change

```powershell
# Quick smoke test after code changes
.\test\run-all-tests.ps1
```

### 2. Test Privacy First

```powershell
# Privacy is most critical
.\test\3-privacy\test-two-party-privacy.ps1
```

### 3. Keep Test Environment Clean

```powershell
# Reset periodically
.\test\utils\cleanup.ps1
```

### 4. Document Failures

- Take screenshots
- Save error messages
- Note steps to reproduce
- File in test report

### 5. Performance Baseline

- Record metrics on fresh environment
- Use as baseline for regression testing
- Track over time

---

## 📚 Additional Resources

- **Test Suite README:** `test/README.md`
- **Test Report Template:** `test/test-report-template.md`
- **E2E Workflow:** `test/4-e2e/test-full-workflow.md`
- **Phase 5 Summary:** `PHASE5_TESTING_COMPLETE.md`
- **Implementation Plan:** `IMPLEMENTATION_PLAN.md` (Phase 5 section)

---

## 🆘 Getting Help

### Test Failures?

1. Check `test/README.md` → Troubleshooting section
2. Run `.\test\utils\verify-backend.ps1`
3. Check logs: `docker logs canton-participant1`
4. Review test output for specific errors

### Still Stuck?

- Review `PHASE5_TESTING_COMPLETE.md` for design rationale
- Check `IMPLEMENTATION_PLAN.md` Phase 5 section
- Inspect individual test scripts for what they're checking

---

**Happy Testing! 🧪✅**


