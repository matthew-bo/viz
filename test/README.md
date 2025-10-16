# Phase 5: Integration Testing Suite

**Status:** Complete Testing Framework  
**Last Updated:** October 16, 2025  
**Test Coverage:** Infrastructure, API, Privacy, E2E, Performance

---

## 📋 Test Directory Structure

```
test/
├── README.md                          # This file
├── run-all-tests.ps1                  # Master test runner
├── test-report-template.md            # Results documentation
│
├── 1-infrastructure/                  # Canton health checks
│   ├── test-containers.ps1
│   ├── test-domain.ps1
│   ├── test-parties.ps1
│   └── test-dar-upload.ps1
│
├── 2-api/                             # API endpoint tests
│   ├── test-health.ps1
│   ├── test-parties-endpoint.ps1
│   ├── test-contracts-submit.ps1
│   ├── test-contracts-query.ps1
│   ├── test-contracts-accept.ps1
│   └── test-sse.ps1
│
├── 3-privacy/                         # Privacy validation
│   ├── test-two-party-privacy.ps1
│   ├── test-multi-party-privacy.ps1
│   ├── test-visibility-matrix.ps1
│   └── test-pending-vs-committed.ps1
│
├── 4-e2e/                             # End-to-end UI tests
│   ├── test-full-workflow.md         # Manual test checklist
│   ├── test-multi-window.md
│   ├── test-form-validation.md
│   └── test-edge-cases.md
│
├── 5-performance/                     # Performance benchmarks
│   ├── test-sse-latency.ps1
│   ├── test-query-performance.ps1
│   └── test-concurrent-transactions.ps1
│
└── utils/                             # Test utilities
    ├── test-data.json                 # Sample test data
    ├── cleanup.ps1                    # Reset test environment
    ├── verify-backend.ps1             # Backend health check
    └── measure-latency.ps1            # Performance measurement
```

---

## 🚀 Quick Start

### Run All Tests

```powershell
# From project root
.\test\run-all-tests.ps1
```

### Run Specific Test Category

```powershell
# Infrastructure only
.\test\1-infrastructure\test-containers.ps1

# API tests only
.\test\2-api\test-health.ps1

# Privacy tests only
.\test\3-privacy\test-two-party-privacy.ps1
```

---

## ✅ Test Success Criteria

### Phase 5 Complete When:

- [X] All 4 Canton containers healthy
- [ ] All participants connected to domain
- [ ] All parties exist with correct IDs
- [ ] DAR uploaded successfully
- [ ] All 6 API endpoints respond correctly
- [ ] Privacy filtering works at Canton level
- [ ] SSE updates within <100ms
- [ ] Query performance <200ms
- [ ] No critical bugs
- [ ] UI workflow completes successfully

---

## 📊 Expected Test Results

### Infrastructure Tests
- **Containers:** All 4 running, uptime >1 hour
- **Domain:** `mydomain` active, participants connected
- **Parties:** 3 parties with valid Canton IDs
- **DAR:** payment-demo-0.0.1 uploaded to all participants

### API Tests
- **GET /health:** 200 OK, JSON response with status
- **GET /api/parties:** 200 OK, array of 3 parties
- **GET /api/contracts:** 200 OK, array of transactions
- **POST /api/contracts:** 201 Created, returns pending PaymentRequest
- **POST /api/contracts/:id/accept:** 200 OK, returns committed Payment
- **GET /api/events:** SSE connection, keepalive messages

### Privacy Tests
- **TechBank → GlobalCorp:** Both parties see, RetailFinance doesn't
- **Multi-party:** Each party sees only their transactions
- **Visibility Matrix:** Matches expected Canton privacy model
- **Pending vs Committed:** Status changes reflected correctly

### Performance Tests
- **SSE Latency:** <100ms from submit to UI update
- **Query Performance:** <200ms for party-filtered queries
- **Concurrent Transactions:** No race conditions, correct ordering

---

## 🔧 Test Utilities

### Cleanup Test Environment

```powershell
.\test\utils\cleanup.ps1
```

Resets Canton (restarts containers, re-runs initialization).

### Verify Backend Running

```powershell
.\test\utils\verify-backend.ps1
```

Checks backend health and connectivity.

---

## 📝 Reporting Test Results

After running tests, document results in:
- `test-results-YYYY-MM-DD.md`
- Update IMPLEMENTATION_PLAN.md Phase 5 checklist
- Note any failures in issue tracker

---

## 🐛 Troubleshooting

### Tests Failing?

1. **Verify Prerequisites:**
   ```powershell
   docker ps --filter "name=canton-"    # All 4 containers running
   curl http://localhost:3001/health    # Backend responding
   ```

2. **Check Party IDs:**
   ```powershell
   Get-Content infrastructure\canton\party-ids.json
   ```

3. **Re-initialize Canton (if needed):**
   ```powershell
   .\infrastructure\init-canton-final.ps1
   ```

4. **Restart Backend:**
   ```powershell
   cd backend
   npm run dev
   ```

---

## 🎯 Testing Philosophy

**This test suite is designed for:**
- ✅ **Comprehensive coverage** - All critical paths tested
- ✅ **Repeatability** - Can run multiple times with same results
- ✅ **Maintainability** - Easy to update as app grows
- ✅ **Documentation** - Tests serve as examples for future development
- ✅ **Extensibility** - Easy to add new tests

**Future Expansion:**
- Tests can be converted to automated Jest/Mocha suites
- Performance benchmarks can track regression over time
- Privacy tests can validate new contract templates
- API tests can verify backward compatibility

---

**END OF TEST SUITE README**

