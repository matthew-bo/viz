# Test 5.4.1: Full End-to-End Workflow Test

**Test Type:** Manual UI Test  
**Estimated Time:** 10 minutes  
**Prerequisites:** Backend running, Frontend running, Canton initialized

---

## Test Objective

Verify complete payment workflow from submission through acceptance with real-time UI updates and privacy filtering.

---

## Setup

1. Ensure all services are running:
   ```powershell
   docker ps --filter "name=canton-"  # All 4 containers running
   # Backend: http://localhost:3001
   # Frontend: http://localhost:3000 (or Vite port)
   ```

2. Open browser to frontend URL

3. Open browser DevTools (F12) → Network tab → Filter: "events"

---

## Test Steps

### Part 1: Initial State

- [ ] **1.1** Frontend loads without errors
- [ ] **1.2** Connection indicator shows green "Live" status
- [ ] **1.3** SSE connection established (visible in Network tab)
- [ ] **1.4** All 3 parties visible in Privacy Filter

**Pass Criteria:** All UI elements render correctly, no console errors

---

### Part 2: Submit Payment Request

- [ ] **2.1** Click "Submit Payment" form
- [ ] **2.2** Select **From:** TechBank
- [ ] **2.3** Select **To:** GlobalCorp
- [ ] **2.4** Enter **Amount:** $1500
- [ ] **2.5** Enter **Description:** "E2E Workflow Test"
- [ ] **2.6** Click "Submit to Canton Network"
- [ ] **2.7** Green success toast appears
- [ ] **2.8** Transaction appears in grid within <100ms
- [ ] **2.9** Status badge shows "Pending Acceptance" (yellow)
- [ ] **2.10** Sender shows "TechBank → GlobalCorp"

**Pass Criteria:** Transaction submits successfully and appears immediately

**Actual Latency (measure in DevTools):** _________ ms

---

### Part 3: Privacy Filtering - Sender View

- [ ] **3.1** "All Parties" filter is initially selected
- [ ] **3.2** Click "View As: TechBank"
- [ ] **3.3** Transaction remains visible (TechBank is sender)
- [ ] **3.4** Transaction card shows full details
- [ ] **3.5** No "Accept Payment" button visible (sender cannot accept own request)

**Pass Criteria:** Sender can see their own transaction

---

### Part 4: Privacy Filtering - Receiver View

- [ ] **4.1** Click "View As: GlobalCorp"
- [ ] **4.2** Transaction remains visible (GlobalCorp is receiver)
- [ ] **4.3** "Accept Payment" button IS visible
- [ ] **4.4** Button is green and enabled
- [ ] **4.5** Hover shows button is clickable

**Pass Criteria:** Receiver sees transaction and can accept

---

### Part 5: Privacy Filtering - Third Party View

- [ ] **5.1** Click "View As: RetailFinance"
- [ ] **5.2** Transaction DISAPPEARS from grid
- [ ] **5.3** Grid shows "No transactions visible to RetailFinance" (or empty)
- [ ] **5.4** Click back to "All Parties" → transaction reappears

**Pass Criteria:** Third party CANNOT see transaction (privacy enforced)

**CRITICAL:** If RetailFinance can see the transaction, **PRIVACY VIOLATION** - stop test and investigate

---

### Part 6: Accept Payment

- [ ] **6.1** Switch to "View As: GlobalCorp"
- [ ] **6.2** Click "Accept Payment" button
- [ ] **6.3** Green success toast appears
- [ ] **6.4** Status badge changes to "Committed" (green)
- [ ] **6.5** "Accept Payment" button disappears
- [ ] **6.6** "Committed At" timestamp appears
- [ ] **6.7** Update happens within <100ms

**Pass Criteria:** Transaction transitions from pending to committed smoothly

**Actual Latency (measure in DevTools):** _________ ms

---

### Part 7: Post-Accept Privacy Verification

- [ ] **7.1** Click "View As: TechBank"
- [ ] **7.2** Transaction shows as "Committed"
- [ ] **7.3** Both timestamps visible (Submitted + Committed)
- [ ] **7.4** Click "View As: RetailFinance"
- [ ] **7.5** Transaction STILL NOT VISIBLE
- [ ] **7.6** Privacy persists after commitment

**Pass Criteria:** Privacy enforcement continues after transaction is committed

---

### Part 8: Canton Metadata Verification

- [ ] **8.1** Expand transaction card (click to show details)
- [ ] **8.2** **Contract ID** is displayed (hex string)
- [ ] **8.3** **Transaction ID** is displayed
- [ ] **8.4** **Offset** is displayed (ledger position)
- [ ] **8.5** **Signatories** shows 2 parties (sender + receiver)
- [ ] **8.6** **Record Time** is valid timestamp

**Pass Criteria:** All Canton blockchain metadata is accessible

---

### Part 9: Form Validation

- [ ] **9.1** Try to submit with empty sender → validation error
- [ ] **9.2** Try to submit with empty receiver → validation error
- [ ] **9.3** Try to submit with sender = receiver → validation error
- [ ] **9.4** Try to submit with amount = 0 → validation error
- [ ] **9.5** Try to submit with negative amount → validation error

**Pass Criteria:** Form validates all inputs correctly

---

### Part 10: Page Refresh Persistence

- [ ] **10.1** Refresh browser page (F5)
- [ ] **10.2** Page reloads without errors
- [ ] **10.3** All committed transactions reload from Canton
- [ ] **10.4** Connection indicator re-establishes (green)
- [ ] **10.5** Privacy filters work after reload

**Pass Criteria:** State persists across page refreshes (loads from Canton)

---

## Test Results

**Total Test Steps:** 50+  
**Passed:** _____ / 50  
**Failed:** _____ / 50  
**Pass Rate:** _____%

**Critical Failures (if any):**
- [ ] Privacy violation detected
- [ ] SSE not working
- [ ] Transactions not persisting
- [ ] UI errors or crashes

---

## Performance Measurements

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Submit → SSE Event | <100ms | _____ ms | [ ] |
| Accept → Status Change | <100ms | _____ ms | [ ] |
| Page Load Time | <2s | _____ s | [ ] |
| Query Response Time | <200ms | _____ ms | [ ] |

---

## Notes

*Document any issues, bugs, or unexpected behavior:*

---

## Sign-Off

**Tester:** _______________  
**Date:** _______________  
**Result:** [ ] PASS  [ ] FAIL  [ ] PASS WITH ISSUES


