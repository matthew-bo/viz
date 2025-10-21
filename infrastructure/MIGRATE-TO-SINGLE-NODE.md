# Migration to Single-Node Canton Setup

**Date:** October 21, 2025  
**Reason:** Multi-node topology management in Canton 2.7.6 causing UNKNOWN_SUBMITTERS errors  
**Solution:** Single-node setup with auto-initialization (demo-appropriate)

---

## ✅ Pre-Migration Checklist

- [ ] Current stack is running (even if broken)
- [ ] You have SSH access to DigitalOcean droplet
- [ ] DAR file exists at `daml/.daml/dist/payment-demo-0.0.1.dar`
- [ ] You have 30-60 minutes for migration

---

## 📋 Step 1: Backup Current State (5 minutes)

```bash
# SSH into droplet
ssh root@45.55.189.150

# Navigate to project
cd ~/viz

# Backup current configuration
cd infrastructure
cp docker-compose.yml docker-compose.yml.BACKUP-multinode
cp -r canton canton.BACKUP-multinode

# Backup current party IDs
cat ../backend/.env | grep PARTY_ID > party-ids-backup.txt

# Create timestamped archive
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  docker-compose.yml.BACKUP-multinode \
  canton.BACKUP-multinode \
  party-ids-backup.txt

echo "✅ Backup complete"
ls -lh backup-*.tar.gz
```

---

## 📋 Step 2: Stop Current Stack (2 minutes)

```bash
# Still in ~/viz/infrastructure
docker compose down

# Verify all containers stopped
docker ps --filter "name=canton" --filter "name=backend" --filter "name=frontend"

# Should show nothing running

echo "✅ Current stack stopped"
```

---

## 📋 Step 3: Verify New Configuration Files (2 minutes)

```bash
# Check that AI created these files
ls -la ~/viz/infrastructure/canton-simple.conf
ls -la ~/viz/infrastructure/canton-init.sc
ls -la ~/viz/infrastructure/docker-compose-simple.yml

# All three should exist
# If not, stop and ask AI to create them again

echo "✅ Configuration files present"
```

---

## 📋 Step 4: Verify DAR File Exists (1 minute)

```bash
cd ~/viz
ls -lh daml/.daml/dist/payment-demo-0.0.1.dar

# Should show a file (around 243 KB)
# If missing, rebuild:
# cd daml && daml build && cd ..

echo "✅ DAR file ready"
```

---

## 📋 Step 5: Start Single-Node Canton (5 minutes)

```bash
cd ~/viz/infrastructure

# Start ONLY Canton first
docker compose -f docker-compose-simple.yml up -d canton

# Watch initialization (CTRL+C to stop watching, won't stop container)
docker logs -f canton-single-node
```

**⚠️ CRITICAL: Watch for this output:**

```
=== PARTY IDs (SAVE THESE TO backend/.env) ===
TECHBANK_PARTY_ID=TechBank::1220abc...
GLOBALCORP_PARTY_ID=GlobalCorp::1220def...
RETAILFINANCE_PARTY_ID=RetailFinance::1220ghi...
=== END PARTY IDs ===
```

**Copy those three lines EXACTLY as shown.**

Once you see "✨ Canton initialization complete!", press CTRL+C to exit log viewing.

---

## 📋 Step 6: Update Backend .env (3 minutes)

```bash
cd ~/viz/backend

# Backup current .env
cp .env .env.BACKUP-multinode

# Edit .env file
nano .env
```

**Replace the three PARTY_ID lines with what you copied from Canton logs:**

```bash
# Before (old multi-node party IDs):
TECHBANK_PARTY_ID=TechBank::1220f8135b39957c1ce3344cc391b41b657be795756db9e6c3e63f5961c484b919ec
GLOBALCORP_PARTY_ID=GlobalCorp::12200e9f82e9a2d06ef6fa10b5785eccd3251eb9fca0f0a23a3c6ea644f6c284e8e7
RETAILFINANCE_PARTY_ID=RetailFinance::122063e334410bd5b0487acd7ceb0874c0c446772d1d5d14406332e2f82e4cbed809

# After (new single-node party IDs - YOUR VALUES WILL BE DIFFERENT):
TECHBANK_PARTY_ID=TechBank::1220NEW_ID_FROM_LOGS_STEP5
GLOBALCORP_PARTY_ID=GlobalCorp::1220NEW_ID_FROM_LOGS_STEP5
RETAILFINANCE_PARTY_ID=RetailFinance::1220NEW_ID_FROM_LOGS_STEP5
```

**Save and exit:** CTRL+X, then Y, then ENTER

**Verify changes:**
```bash
cat .env | grep PARTY_ID
# Should show the NEW party IDs
```

---

## 📋 Step 7: Start Backend and Frontend (3 minutes)

```bash
cd ~/viz/infrastructure

# Start remaining services
docker compose -f docker-compose-simple.yml up -d backend frontend

# Check all services running
docker compose -f docker-compose-simple.yml ps
```

**Expected output:**
```
NAME                STATUS              PORTS
canton-single-node  running (healthy)   0.0.0.0:5011-5012->5011-5012/tcp, 0.0.0.0:5018-5019->5018-5019/tcp, 0.0.0.0:7011->7011/tcp
backend             running             0.0.0.0:3001->3001/tcp
frontend            running             0.0.0.0:3000->80/tcp
```

All should show "running" (and canton should show "healthy")

---

## 📋 Step 8: Verify Backend Connection (2 minutes)

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected: {"status":"healthy","timestamp":"..."}

# Test parties endpoint
curl http://localhost:3001/api/parties | jq

# Expected: Array of 3 parties with display names
```

**If you see errors about party IDs:**
- Double-check you copied the party IDs correctly from Canton logs
- Restart backend: `docker compose -f docker-compose-simple.yml restart backend`

---

## 📋 Step 9: Test Transaction Submission (5 minutes)

This is the CRITICAL test - this should NO LONGER show UNKNOWN_SUBMITTERS:

```bash
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 1000,
    "description": "Migration test payment"
  }' | jq
```

**✅ SUCCESS if you see:**
```json
{
  "contractId": "...",
  "templateId": "Payment:PaymentRequest",
  "status": "pending",
  ...
}
```

**❌ FAILURE if you see:**
```json
{
  "error": "UNKNOWN_SUBMITTERS"
}
```

If failure, check:
1. Party IDs in backend/.env match Canton output EXACTLY
2. Backend restarted after .env change
3. Canton logs don't show topology errors: `docker logs canton-single-node | grep -i error`

---

## 📋 Step 10: Test Frontend (2 minutes)

```bash
# Test frontend loads
curl http://localhost:3000

# Should return HTML

# From your local machine, open browser:
# http://45.55.189.150:3000
```

**Expected:** Frontend loads, shows 3 parties, connection indicator green

**Test full workflow:**
1. Submit payment: TechBank → GlobalCorp $1500
2. Transaction appears with "Pending Acceptance" badge
3. Switch to "View As: GlobalCorp"
4. Click "Accept Payment"
5. Status changes to "Committed" (green)

---

## 📋 Step 11: Verify Privacy Model (3 minutes)

```bash
# Submit another transaction
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 500,
    "description": "Privacy test"
  }' | jq

# Query as TechBank (should see it)
curl "http://localhost:3001/api/contracts?party=TechBank" | jq '. | length'
# Expected: 2 (both transactions)

# Query as RetailFinance (should NOT see it)
curl "http://localhost:3001/api/contracts?party=RetailFinance" | jq '. | length'
# Expected: 0 (no transactions visible)
```

**✅ Privacy working if RetailFinance sees 0 transactions**

---

## 🎉 Success Criteria

| Test | Expected | Status |
|------|----------|--------|
| Docker containers | 3 running (canton, backend, frontend) | ☐ |
| Canton health | Service healthy | ☐ |
| Backend health | Returns 200 OK | ☐ |
| Parties endpoint | Returns 3 parties | ☐ |
| Submit transaction | Returns 200, **NOT** UNKNOWN_SUBMITTERS | ☐ |
| Frontend loads | Shows UI | ☐ |
| Accept workflow | Status changes to committed | ☐ |
| Privacy test | RetailFinance sees 0 transactions | ☐ |

**If all checkboxes pass: Migration successful! 🎉**

---

## 🔄 Rollback Plan (if migration fails)

```bash
# Stop new setup
cd ~/viz/infrastructure
docker compose -f docker-compose-simple.yml down

# Restore old configuration
cp docker-compose.yml.BACKUP-multinode docker-compose.yml
cp -r canton.BACKUP-multinode/* canton/

# Restore backend .env
cd ../backend
cp .env.BACKUP-multinode .env

# Start old setup
cd ../infrastructure
docker compose up -d

# You're back to where you started (even if it was broken)
```

---

## 📊 What Changed?

| Component | Before (Multi-Node) | After (Single-Node) |
|-----------|-------------------|-------------------|
| Canton containers | 4 (1 domain + 3 participants) | 1 (domain + participant in same process) |
| Topology management | Manual gRPC authorization | Auto-managed (same namespace) |
| Initialization | Multiple scripts, error-prone | Single `--bootstrap` script |
| Party IDs | Complex cross-node auth | Simple `parties.enable()` |
| Backend connections | 3 different HTTP JSON APIs | 1 HTTP JSON API |
| Debugging | Check 4 container logs | Check 1 container log |
| Startup time | 60+ seconds | 20-30 seconds |

---

## 🐛 Troubleshooting

### Issue: Canton container fails to start

**Check logs:**
```bash
docker logs canton-single-node
```

**Common causes:**
- DAR file missing: Check `daml/.daml/dist/payment-demo-0.0.1.dar` exists
- Port conflict: Check nothing else using 5011, 5012, 5018, 5019, 7011
- Config syntax error: Check `canton-simple.conf` for typos

### Issue: Backend shows "Cannot connect to Canton"

**Check:**
```bash
# Is Canton healthy?
docker ps | grep canton

# Can backend reach Canton?
docker exec backend ping -c 3 canton

# Are party IDs correct?
docker exec backend cat .env | grep PARTY_ID
```

### Issue: UNKNOWN_SUBMITTERS still appearing

**This means party-to-participant mapping is missing. Check:**
```bash
# View Canton topology
docker exec canton-single-node sh -c \
  'echo "participant1.topology.party_to_participant_mappings.list()" | \
   canton daemon --config /canton/canton-simple.conf'

# Should show all 3 parties
# If empty, re-run initialization:
docker exec canton-single-node sh -c \
  'cat /canton/canton-init.sc | \
   canton daemon --config /canton/canton-simple.conf --bootstrap'
```

### Issue: Frontend doesn't load

**Check:**
```bash
# Is frontend container running?
docker ps | grep frontend

# Check frontend logs
docker logs frontend

# Test from droplet
curl -I http://localhost:3000
```

---

## 📚 References

- Canton 2.7.x Simple Topology: https://docs.daml.com/canton/tutorials/getting_started.html
- Canton Configuration: https://docs.daml.com/canton/usermanual/static_conf.html
- Docker Hub Image: https://hub.docker.com/r/digitalasset/canton-open-source/tags (using 2.7.8)

---

**Next Steps After Successful Migration:**
1. Update README.md with new single-node architecture
2. Create DEMO.md with updated demo script
3. Test with recruiters
4. Consider adding persistent storage (Postgres) for production


