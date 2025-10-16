# Canton Admin API Investigation Findings

**Date:** October 15, 2025  
**Status:** BREAKTHROUGH - gRPC Admin API Confirmed  
**Next Action:** Install grpcurl and discover API methods

---

## Key Discoveries

### 1. Canton Uses gRPC Admin API ✅

**Evidence:**
```powershell
PS> curl http://localhost:5019
Error: The server committed a protocol violation. Section=ResponseStatusLine
```

**Analysis:**
- Port 5019 IS listening and responding
- But NOT HTTP protocol
- PowerShell curl expects HTTP, got something else
- **Conclusion: This is gRPC**

### 2. Canton Help Output Confirms Admin API

**From `canton --help`:**
```
Command: daemon
Start all nodes automatically and run them without having a console (REPL).
Nodes can be controlled through the admin API.
```

**This confirms:**
- ✅ Daemon mode is designed for Admin API control
- ✅ Console (REPL) is separate from daemon
- ✅ We should be using Admin API, not console

### 3. Canton Supports Bootstrap Scripts

**From help:**
```
--bootstrap <file>       Set a script to run on startup
```

**Potential usage:**
```bash
canton daemon \
  --config /canton/synchronizer.conf \
  --bootstrap /canton/scripts/bootstrap-domain.sc
```

**But:** This only works at startup, not for already-running daemons.

---

## What We Know About The Problem

### Why Console Fails

**The Issue:**
```
docker exec canton-synchronizer /canton/bin/canton -c /canton/synchronizer.conf
→ Tries to START a new Canton instance
→ Attempts to BIND to ports 5018, 5019
→ ERROR: Address already in use (daemon already owns these ports)
```

**Why This Happens:**
Canton console is designed to:
1. Start Canton nodes
2. Provide interactive REPL for management
3. Control the nodes it started

Canton console is NOT designed to:
- Connect to remote/existing daemons
- Manage nodes it didn't start

### The Correct Approach

**Use gRPC Admin API:**
1. Daemon exposes gRPC API on admin ports (5012, 5019, 5022, 5032)
2. Send gRPC calls to running daemon
3. No port conflicts (daemon already listening)
4. This is the intended management method for daemon mode

---

## Admin API Port Mapping

| Node | Admin Port | Ledger Port | Status |
|------|------------|-------------|---------|
| synchronizer | 5019 | 5018 | ✅ gRPC confirmed |
| participant1 | 5012 | 5011 | ✅ Likely gRPC |
| participant2 | 5022 | 5021 | ✅ Likely gRPC |
| participant3 | 5032 | 5031 | ✅ Likely gRPC |

---

## What We Need to Do

### Step 1: Install grpcurl ⏳

**Windows Installation:**
```powershell
# Download latest release:
# https://github.com/fullstorydev/grpcurl/releases

# For Windows:
# Download grpcurl_1.8.9_windows_x86_64.zip
# Extract to C:\tools\grpcurl\
# Add to PATH

# Or via Chocolatey:
choco install grpcurl

# Or via Scoop:
scoop install grpcurl

# Verify:
grpcurl --version
```

### Step 2: Discover Services via Reflection ⏳

**Canton likely has reflection enabled. Test with:**
```powershell
# List all services
grpcurl -plaintext localhost:5019 list

# Expected output (hypothetical):
# com.digitalasset.canton.admin.v1.DomainService
# com.digitalasset.canton.admin.v1.HealthService
# grpc.reflection.v1alpha.ServerReflection
```

### Step 3: Discover Domain Initialization Methods ⏳

```powershell
# List methods for DomainService
grpcurl -plaintext localhost:5019 list com.digitalasset.canton.admin.v1.DomainService

# Describe bootstrap method
grpcurl -plaintext localhost:5019 describe com.digitalasset.canton.admin.v1.DomainService.Bootstrap

# Example call (syntax TBD):
grpcurl -plaintext -d '{}' localhost:5019 \
  com.digitalasset.canton.admin.v1.DomainService/Bootstrap
```

### Step 4: Discover Participant Methods ⏳

```powershell
# Connect to participant Admin API
grpcurl -plaintext localhost:5012 list

# Expected services:
# com.digitalasset.canton.admin.v1.ParticipantService
# com.digitalasset.canton.admin.v1.PartyService
# com.digitalasset.canton.admin.v1.PackageService

# Party creation
grpcurl -plaintext -d '{"name": "TechBank"}' localhost:5012 \
  com.digitalasset.canton.admin.v1.PartyService/Create
```

---

## Alternative: Use Official Documentation

**Canton 2.7.6 Docs:**
- https://docs.daml.com/2.7.6/canton/usermanual/apis.html
- https://docs.daml.com/2.7.6/canton/usermanual/console.html

**What to look for:**
- Admin API gRPC service definitions
- Method signatures for:
  - Domain bootstrap
  - Participant connection
  - Party creation
  - DAR upload

---

## Fallback: Use --bootstrap Flag

**If Admin API is too complex, we can:**

1. **Modify docker-compose.yml:**
```yaml
synchronizer:
  command: daemon --config /canton/synchronizer.conf --bootstrap /canton/scripts/init-sync.sc
```

2. **Create initialization scripts that run at startup:**
```scala
// /canton/scripts/init-sync.sc
println("Bootstrapping domain...")
mydomain.setup.bootstrap_domain()
println("Domain ready!")
```

**Pros:**
- Uses familiar Scala console syntax
- Automatic on startup

**Cons:**
- Only runs at container startup
- With memory storage, need to restart containers to re-init
- Can't re-initialize without restart

---

## Recommended Next Steps

### Immediate (15 minutes):
1. ✅ **Install grpcurl** on Windows
2. ✅ **Run reflection query**: `grpcurl -plaintext localhost:5019 list`
3. ✅ **Discover services**: Identify DomainService, PartyService, etc.

### Short-term (1-2 hours):
4. ✅ **Call bootstrap method** via grpcurl
5. ✅ **Call connect method** for participants
6. ✅ **Call create party** methods
7. ✅ **Call upload DAR** methods
8. ✅ **Save party IDs** to party-ids.json

### Medium-term (2-4 hours):
9. ✅ **Script it**: Create PowerShell script using grpcurl
10. ✅ **Test backend**: Verify ledger API works with real IDs
11. ✅ **Document**: Update guides with working method

---

## Expected Timeline

**Best Case (grpcurl + reflection works):**
- Install grpcurl: 15 min
- Discover API: 30 min
- Test calls: 1 hour
- Script + verify: 1 hour
- **Total: 2.5 hours** ✅

**Medium Case (need proto files):**
- Find proto definitions: 1 hour
- Use protoset: 30 min
- Test + script: 1.5 hours
- **Total: 3 hours**

**Worst Case (Admin API doesn't support our needs):**
- Fall back to --bootstrap method
- Modify docker-compose: 1 hour
- Test restart flow: 1 hour
- **Total: 2 hours** (but less ideal solution)

---

## Success Criteria

**After completing this, you should be able to run:**

```powershell
# Script: initialize-canton.ps1

# 1. Bootstrap domain
grpcurl -plaintext -d '{}' localhost:5019 \
  com.digitalasset.canton.admin.v1.DomainService/Bootstrap

# 2. Connect participant1
grpcurl -plaintext -d '{"alias":"mydomain","url":"http://synchronizer:5018"}' \
  localhost:5012 \
  com.digitalasset.canton.admin.v1.ParticipantService/ConnectDomain

# 3. Create TechBank party
$response = grpcurl -plaintext -d '{"name":"TechBank"}' \
  localhost:5012 \
  com.digitalasset.canton.admin.v1.PartyService/Create
  
# 4. Extract party ID and save to party-ids.json
# ... (parse JSON response)

# 5. Upload DAR
grpcurl -plaintext -d '{"path":"/canton/payment-demo-0.0.1.dar"}' \
  localhost:5012 \
  com.digitalasset.canton.admin.v1.PackageService/Upload

echo "✅ Canton initialized successfully!"
```

**Then test backend:**
```typescript
await ledger.create(PaymentRequest, {...})
// ✅ Success - real Canton transaction!
```

---

## Questions Still to Answer

1. **Does Canton 2.7.6 have reflection enabled?**
   - Test: `grpcurl -plaintext localhost:5019 list`
   - If no: Need proto files or protoset

2. **What are the exact service/method names?**
   - Hypothetical: `com.digitalasset.canton.admin.v1.DomainService`
   - Need to discover actual names

3. **What are the message structures?**
   - Example: `{"alias": "mydomain", "url": "..."}`
   - Need to see proto definitions or examples

4. **Does Canton 2.7.6 Admin API support all operations?**
   - Bootstrap domain ✓ (likely)
   - Connect participants ✓ (likely)
   - Create parties ✓ (likely)
   - Upload DAR ? (need to verify)

---

## Resources

**grpcurl:**
- GitHub: https://github.com/fullstorydev/grpcurl
- Releases: https://github.com/fullstorydev/grpcurl/releases

**Canton Docs:**
- API Configuration: https://docs.daml.com/2.7.6/canton/usermanual/apis.html
- Console Manual: https://docs.daml.com/2.7.6/canton/usermanual/console.html
- Troubleshooting: https://docs.daml.com/2.7.6/canton/usermanual/troubleshooting_guide.html

**gRPC Resources:**
- Understanding gRPC: https://grpc.io/docs/what-is-grpc/introduction/
- Server Reflection: https://github.com/grpc/grpc/blob/master/doc/server-reflection.md

---

## Next Immediate Action

**USER SHOULD:**

1. **Install grpcurl:**
   ```powershell
   # Download from https://github.com/fullstorydev/grpcurl/releases
   # Get: grpcurl_1.8.9_windows_x86_64.zip
   # Extract and add to PATH
   ```

2. **Run discovery:**
   ```powershell
   grpcurl -plaintext localhost:5019 list
   ```

3. **Share output** so I can provide exact initialization commands

**OR**

If you want me to continue investigating via web search and documentation, I can research Canton 2.7.6 Admin API specifics without grpcurl first.

**Which would you prefer?**

