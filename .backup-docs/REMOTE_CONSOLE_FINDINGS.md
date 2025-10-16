# Canton Remote Console Findings

**Date:** October 15, 2025  
**Status:** Partial Success - Remote Console Works But Has Limitations

---

## What We Discovered

### ✅ SUCCESS: Remote Console Connects

We successfully connected to running Canton daemons using remote console:

```powershell
docker run --rm \
  --network infrastructure_default \
  -v ${PWD}/infrastructure/canton:/canton-config \
  digitalasset/canton-open-source:latest \
  run \
  -c /canton-config/remote-synchronizer.conf \
  -c /canton-config/remote-participant1.conf \
  ...
  /canton-config/scripts/init-all.sc
```

**Result:** ✅ Canton executed the script without port conflicts!

### ❌ LIMITATION: Cannot Bootstrap Via Remote Console

**Error:**
```
value setup is not a member of com.digitalasset.canton.console.CommunityRemoteDomainReference
  mydomain.setup.bootstrap_domain()
           ^
```

**What This Means:**
- Remote console connects to `RemoteDomainReference`
- This is a **read-only/management** interface
- Cannot call `.setup.bootstrap_domain()` on remote references
- Remote console is for **managing initialized systems**, not initializing them

---

## Canton Console Types

### Local Console (what daemons use internally)
```scala
// Has full access including setup
mydomain.setup.bootstrap_domain()  // ✅ Works
```

### Remote Console (what we're using)
```scala
// Read-only management interface
mydomain.health.status()          // ✅ Works
mydomain.setup.bootstrap_domain() // ❌ Method doesn't exist
```

---

## The Bootstrap Chicken-and-Egg Problem

1. **Canton daemons** run in containers (occupying ports)
2. **Interactive console** needs those same ports (conflict!)
3. **Remote console** avoids port conflict but can't bootstrap
4. **Catch-22:** Can't bootstrap while daemon runs, can't use remote console to bootstrap

---

## Possible Solutions

### Option 1: Bootstrap at Daemon Startup ⭐ RECOMMENDED

**Idea:** Use `--bootstrap` flag when starting daemons

**Modify `docker-compose.yml`:**
```yaml
synchronizer:
  command: daemon --config /canton/synchronizer.conf --bootstrap /canton/scripts/bootstrap-domain.sc
  
participant1:
  command: daemon --config /canton/participant1.conf --bootstrap /canton/scripts/connect-and-init.sc
```

**Pros:**
- ✅ Runs during startup (no port conflict)
- ✅ Automatic initialization
- ✅ Uses familiar Scala console syntax

**Cons:**
- ⚠️ Requires container restart to re-initialize
- ⚠️ With memory storage, data lost on restart anyway
- ⚠️ Need to coordinate bootstrap order (domain first, then participants)

### Option 2: Use gRPC Admin API Directly

**Idea:** Call Admin API methods via grpcurl/HTTP

**Requirements:**
- Install grpcurl
- Discover gRPC service definitions
- Call bootstrap methods directly

**Status:** Not yet attempted (would need grpcurl installed)

**Pros:**
- ✅ Works with running daemons
- ✅ No restart required
- ✅ Scriptable

**Cons:**
- ⚠️ Need to learn API methods
- ⚠️ May require proto files if reflection not enabled
- ⚠️ More complex than console scripts

### Option 3: Stop Daemons, Initialize, Restart

**Idea:** Temporarily stop containers to free ports

**Steps:**
```powershell
# 1. Stop all containers
docker-compose down

# 2. Run initialization in one-shot mode
docker run ... canton run /scripts/init-all.sc

# 3. Restart daemons
docker-compose up -d
```

**Pros:**
- ✅ Simple approach
- ✅ Uses console scripts as-is

**Cons:**
- ❌ Manual multi-step process
- ❌ Defeats purpose of persistent daemons
- ❌ With memory storage, restart loses data anyway

---

## Recommended Immediate Action

**Use Option 1: Bootstrap at Startup**

This is the most pragmatic solution for your use case:

1. Memory storage means data is lost on restart anyway
2. Bootstrap scripts can run automatically
3. No complex API calls needed
4. Aligns with Docker Compose philosophy

### Implementation Steps

1. **Split bootstrap scripts by node type:**
   - `bootstrap-domain.sc` - For synchronizer only
   - `init-participant.sc` - For each participant

2. **Update docker-compose.yml:**
   ```yaml
   synchronizer:
     command: daemon --config /canton/synchronizer.conf --bootstrap /canton/scripts/bootstrap-domain.sc
   
   participant1:
     command: daemon --config /canton/participant1.conf --bootstrap /canton/scripts/init-participant1.sc
     depends_on:
       synchronizer:
         condition: service_healthy  # Wait for sync to bootstrap
   ```

3. **Create startup scripts:**
   - Bootstrap domain on sync
   - Connect to domain + create party + upload DAR on each participant
   - Export party IDs to mounted volume

4. **One-time manual step:**
   - After first startup, copy party-ids.json from container
   - Or have scripts write to mounted volume

### Expected Timeline

- Script creation: 30 minutes
- docker-compose updates: 15 minutes
- Testing: 30 minutes  
- **Total: ~1.5 hours**

---

## What We've Achieved

1. ✅ Confirmed Canton uses gRPC Admin API
2. ✅ Successfully created remote console configs
3. ✅ Can connect to running daemons without port conflicts
4. ✅ Understand limitations of remote console
5. ✅ Identified correct solution path

---

## Next Steps

**Would you like me to:**

A. **Implement Option 1 (Bootstrap at startup)** - Modify docker-compose.yml and create startup scripts

B. **Try Option 2 (gRPC API)** - Install grpcurl and discover API methods

C. **Something else** - Different approach based on your preferences

**My recommendation: Option A** - it's the cleanest solution for your demo/MVP use case.

