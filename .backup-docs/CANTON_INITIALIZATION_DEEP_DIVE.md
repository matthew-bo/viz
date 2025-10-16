# Canton Initialization Deep Dive: Complete Context & Problem Analysis

**Document Purpose:** Comprehensive briefing for technical problem-solving  
**Created:** October 15, 2025  
**Status:** Active Investigation  
**Severity:** BLOCKING - Cannot proceed with real blockchain integration

---

## Table of Contents

1. [Product Context](#product-context)
2. [Technical Architecture](#technical-architecture)
3. [What We've Built So Far](#what-weve-built-so-far)
4. [The Problem: Canton Initialization Failure](#the-problem-canton-initialization-failure)
5. [Root Cause Analysis](#root-cause-analysis)
6. [Solutions Attempted & Why They Failed](#solutions-attempted--why-they-failed)
7. [Current Investigation Strategy](#current-investigation-strategy)
8. [Critical Questions That Need Answers](#critical-questions-that-need-answers)
9. [Technical Specifications](#technical-specifications)
10. [Success Criteria](#success-criteria)

---

## 1. Product Context

### What We're Building

**Project Name:** Canton Privacy Blockchain Visualizer  
**Goal:** Privacy-preserving payment request system using Daml smart contracts on Canton blockchain

**Product Vision:**
A demonstration application that showcases Canton's privacy features by allowing three financial institutions to:
- Submit payment requests to each other
- Accept or reject requests via blockchain smart contracts
- Maintain privacy (only sender and receiver see the transaction)
- Provide real-time visualization of the blockchain state

**User Flow:**
1. User selects sender institution (TechBank, GlobalCorp, or RetailFinance)
2. User creates payment request (amount, receiver, description)
3. Payment request is submitted as Daml smart contract to Canton
4. Receiver sees pending request and can Accept/Reject
5. Upon acceptance, Payment contract is created (signed by both parties)
6. UI visualizes the contract lifecycle and blockchain state

**Key Product Requirements:**
- **Privacy:** Only parties involved in a transaction can see it
- **Multi-Party Signatures:** Payment requires both sender and receiver signatures
- **Immutability:** Blockchain-backed transaction history
- **Real-time Updates:** SSE streaming of contract changes
- **Visual Demo:** Interactive UI for showcasing Canton features

**Why This Matters:**
This is NOT just a demo - it's a proof-of-concept for Canton's value proposition:
- Traditional blockchains: Everyone sees everything
- Canton: Selective disclosure, privacy by design
- Use case: Financial institutions need privacy + auditability

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Blockchain Layer:**
- **Canton 2.7.6** (privacy-preserving blockchain network)
- **Daml 2.7.6** (smart contract language)
- **Synchronizer** (domain/sequencer for consensus)
- **3 Participant Nodes** (one per institution)

**Backend:**
- **Node.js 22.13.1** (server runtime)
- **TypeScript** (type-safe development)
- **Express.js** (REST API framework)
- **@daml/ledger** (Canton Ledger API client)
- **JWT** (authentication tokens)

**Frontend:**
- **React 18.x** (UI framework)
- **TypeScript** (type-safe UI components)
- **Vite** (build tool)
- **Server-Sent Events** (real-time updates)

**Infrastructure:**
- **Docker Compose** (container orchestration)
- **4 Canton Containers** (1 sync + 3 participants)
- **Windows PowerShell** (scripting)

### 2.2 Canton Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Canton Synchronizer                       │
│                      (mydomain)                              │
│                                                              │
│  Ports: 5018 (Public API), 5019 (Admin API)                │
│  Role: Consensus, sequencing, domain management            │
└────────────┬──────────────┬──────────────┬─────────────────┘
             │              │              │
     ┌───────┴───────┐ ┌───┴──────┐ ┌────┴────────┐
     │  Participant1  │ │Participant2│ │Participant3 │
     │   (TechBank)   │ │(GlobalCorp)│ │(RetailFin)  │
     │                │ │            │ │             │
     │ Ledger: 5011   │ │Ledger: 5021│ │Ledger: 5031 │
     │ Admin:  5012   │ │Admin:  5022│ │Admin:  5032 │
     └────────────────┘ └────────────┘ └─────────────┘
```

**How Canton Works:**
1. **Synchronizer (Domain):** Central coordination point for consensus
2. **Participants:** Hold ledgers for their parties, enforce Daml contracts
3. **Parties:** Identities created on participants (e.g., "TechBank")
4. **Contracts:** Daml templates deployed via DAR files

**Privacy Model:**
- Participant1 only sees contracts where TechBank is signatory/observer
- Participant2 only sees contracts where GlobalCorp is involved
- Synchronizer coordinates but doesn't see contract contents (encryption)

### 2.3 Data Flow

**Contract Creation Flow:**
```
Frontend (React)
    ↓ POST /api/payments/submit
Backend (Node.js + @daml/ledger)
    ↓ ledger.create(PaymentRequest, {...})
Canton Participant1 (TechBank node)
    ↓ Submit transaction to domain
Canton Synchronizer
    ↓ Sequence and broadcast
Canton Participant2 (GlobalCorp node)
    ↓ Receive, verify, apply to ledger
    ↓ Notify observers
Backend SSE Stream
    ↓ Push update
Frontend
    ↓ Update UI
```

---

## 3. What We've Built So Far

### 3.1 Phase 0-1: Infrastructure (COMPLETE ✅)

**Files Created:**

#### Docker Compose Configuration
**File:** `infrastructure/docker-compose.yml` (41 lines)
```yaml
version: '3.8'

services:
  synchronizer:
    image: digitalasset/canton-open-source:latest  # 2.7.6
    container_name: canton-synchronizer
    ports:
      - "5018:5018"  # Public API
      - "5019:5019"  # Admin API
    volumes:
      - ./canton/synchronizer.conf:/canton/synchronizer.conf:ro
      - ./canton/scripts:/canton/scripts:ro
    command: daemon --config /canton/synchronizer.conf --log-level-root=INFO
    restart: unless-stopped

  participant1:
    image: digitalasset/canton-open-source:latest
    container_name: canton-participant1
    ports:
      - "5011:5011"  # Ledger API
      - "5012:5012"  # Admin API
    volumes:
      - ./canton/participant1.conf:/canton/participant1.conf:ro
      - ./canton/scripts:/canton/scripts:ro
    command: daemon --config /canton/participant1.conf --log-level-root=INFO
    depends_on:
      - synchronizer
    restart: unless-stopped

  # ... participant2, participant3 (similar structure)
```

**Key Points:**
- Uses `digitalasset/canton-open-source:latest` → **Canton 2.7.6** (not 2.9.0 as originally planned)
- **Runs as daemons** (background processes, not one-shot)
- Ports exposed to host for API access
- Volumes mount configs as read-only
- **THIS IS THE SOURCE OF OUR PROBLEM** (more on this later)

#### Canton Configuration Files

**File:** `infrastructure/canton/synchronizer.conf`
```hocon
canton {
  domains {                    # ← 2.7.6 syntax (not "synchronizers")
    mydomain {
      storage {
        type = memory          # ← In-memory H2 database (lost on restart)
      }
      
      public-api {
        address = "0.0.0.0"    # ← Binds to all interfaces
        port = 5018
      }
      
      admin-api {
        address = "0.0.0.0"
        port = 5019
      }
    }
  }
}
```

**File:** `infrastructure/canton/participant1.conf`
```hocon
canton {
  participants {
    participant1 {
      storage {
        type = memory          # ← In-memory (lost on restart)
      }
      
      ledger-api {
        address = "0.0.0.0"
        port = 5011            # ← Backend connects here
      }
      
      admin-api {
        address = "0.0.0.0"
        port = 5012            # ← For management
      }
    }
  }
}
```

**Files:** `participant2.conf`, `participant3.conf` (similar structure, different ports)

**Important Configuration Details:**
- **`storage.type = memory`:** Data is **volatile** - lost on container restart
  - This is intentional for demo purposes
  - Means initialization must happen after every `docker-compose up`
  - Production would use PostgreSQL
- **`address = "0.0.0.0"`:** Binds to all network interfaces (allows host access)
- **No TLS:** Simplified for local development (production would require TLS)

**Current State:**
```powershell
PS> docker ps --filter "name=canton"
NAMES                 STATUS       UPTIME
canton-synchronizer   Up          2+ hours
canton-participant1   Up          2+ hours
canton-participant2   Up          2+ hours
canton-participant3   Up          2+ hours
```
✅ All containers running successfully

### 3.2 Phase 2: Daml Smart Contracts (COMPLETE ✅)

**File:** `daml/daml.yaml`
```yaml
sdk-version: 2.7.6              # ← MUST match Canton version
name: payment-demo
version: 0.0.1
source: .
dependencies:
  - daml-prim
  - daml-stdlib
build-options:
  - --target=1.15               # ← Daml-LF version compatible with 2.7.6
```

**File:** `daml/Payment.daml` (54 lines)
```daml
module Payment where

-- Request for payment (sender creates, receiver sees)
template PaymentRequest
  with
    sender: Party              -- Who is sending money
    receiver: Party            -- Who should receive money
    amount: Decimal            -- How much
    currency: Text             -- USD, EUR, etc.
    description: Text          -- Purpose of payment
    submittedAt: Time          -- When created
  where
    signatory sender           -- Sender signs (creates contract)
    observer receiver          -- Receiver can see it
    
    -- Receiver can accept, creating Payment contract
    choice Accept : ContractId Payment
      controller receiver      -- Only receiver can accept
      do
        now <- getTime
        create Payment with
          sender = sender
          receiver = receiver
          amount = amount
          currency = currency
          description = description
          submittedAt = submittedAt
          committedAt = now    -- Record acceptance time
    
    -- Receiver can reject (archives request)
    choice Reject : ()
      controller receiver
      do
        return ()              -- Just archive, no new contract

-- Confirmed payment (both parties signed)
template Payment
  with
    sender: Party
    receiver: Party
    amount: Decimal
    currency: Text
    description: Text
    submittedAt: Time          -- Original request time
    committedAt: Time          -- Acceptance time
  where
    signatory sender, receiver -- BOTH parties sign
```

**Smart Contract Design (Why Two Templates?):**

1. **PaymentRequest:**
   - **Signatory:** Sender (only sender signs initially)
   - **Observer:** Receiver (can see it, but hasn't signed)
   - **Purpose:** Represent pending payment request
   - **Privacy:** Only sender and receiver see this contract

2. **Payment:**
   - **Signatories:** Sender AND receiver (both signed)
   - **Purpose:** Represent confirmed payment
   - **Creation:** Via `Accept` choice (receiver signs when accepting)
   - **Privacy:** Still only visible to sender and receiver

**Why This Design?**
- Canton's privacy model requires explicit signatory/observer
- Can't add signatory after contract creation
- Two-template pattern enables "request → approval" workflow
- Each party has authority over their own choices

**DAR Build:**
```powershell
PS> cd daml
PS> daml build
Building payment-demo-0.0.1.dar
✓ Created .daml/dist/payment-demo-0.0.1.dar (243 KB)
```

✅ DAR file built successfully and copied to containers:
```powershell
PS> docker cp daml/payment-demo-0.0.1.dar canton-participant1:/canton/
PS> docker cp daml/payment-demo-0.0.1.dar canton-participant2:/canton/
PS> docker cp daml/payment-demo-0.0.1.dar canton-participant3:/canton/
```

### 3.3 Phase 2.5: Canton Initialization (BLOCKED ❌)

**This is where we're stuck.**

**What Needs to Happen:**

1. **Bootstrap Domain:**
   ```scala
   // In synchronizer Canton console
   mydomain.setup.bootstrap_domain()
   ```
   - Creates the domain infrastructure
   - Enables participants to connect
   - **Status:** ❌ NOT DONE

2. **Connect Participants:**
   ```scala
   // In each participant console
   participant1.domains.connect_local(
     sequencerConnection = SequencerConnection.Grpc(
       "http://synchronizer:5018",
       transportSecurity = false
     ),
     alias = "mydomain"
   )
   // Repeat for participant2, participant3
   ```
   - **Status:** ❌ NOT DONE

3. **Create Parties:**
   ```scala
   // On participant1
   val techBankParty = participant1.parties.enable("TechBank")
   // Output: TechBank::122089abcdef1234567890...
   
   // On participant2
   val globalCorpParty = participant2.parties.enable("GlobalCorp")
   // Output: GlobalCorp::12208fedcba0987654321...
   
   // On participant3
   val retailParty = participant3.parties.enable("RetailFinance")
   // Output: RetailFinance::122012345678...
   ```
   - **Status:** ❌ NOT DONE (using mock IDs instead)

4. **Upload DAR:**
   ```scala
   participant1.dars.upload("/canton/payment-demo-0.0.1.dar")
   participant2.dars.upload("/canton/payment-demo-0.0.1.dar")
   participant3.dars.upload("/canton/payment-demo-0.0.1.dar")
   ```
   - **Status:** ❌ NOT DONE (DAR copied but not uploaded to ledgers)

**Current Workaround (Temporary):**

**File:** `infrastructure/party-ids.json`
```json
{
  "TechBank": "TechBank::1220abcdef1234567890",
  "GlobalCorp": "GlobalCorp::1220fedcba0987654321",
  "RetailFinance": "RetailFinance::12201234567890abcdef"
}
```

⚠️ **These are FAKE party IDs** - Canton doesn't know about them.
- Allows backend development to proceed
- But **cannot actually submit transactions** to Canton
- Backend would need to mock the Canton API entirely

---

## 4. The Problem: Canton Initialization Failure

### 4.1 Problem Statement

**What's Broken:**
- Canton network is **running** but **not initialized**
- Cannot execute the 4 initialization steps listed above
- Every attempt to initialize results in error

**Impact:**
```typescript
// This code WILL NOT WORK without initialization:
import { Ledger } from '@daml/ledger';

const ledger = new Ledger({
  token: jwt.sign({ 
    party: 'TechBank::1220abcdef1234567890'  // ❌ Canton doesn't recognize
  }),
  httpBaseUrl: 'http://localhost:5011'
});

await ledger.create(PaymentRequest, {
  sender: 'TechBank::1220abcdef1234567890',
  receiver: 'GlobalCorp::1220fedcba0987654321',
  amount: 1000,
  currency: 'USD',
  description: 'Test payment'
});

// RESULT: Error 500 - Party not found on ledger
```

**Without initialization:**
- ❌ Backend cannot connect to Canton Ledger API
- ❌ Cannot create contracts
- ❌ Cannot query contracts
- ❌ Cannot exercise choices (Accept/Reject)
- ❌ Real-time updates don't work
- ✅ Only UI mockups would work (fake blockchain)

### 4.2 The Error We Keep Hitting

**Error Message:**
```
ERROR com.digitalasset.canton.environment.Environment - Failed to create domain 'mydomain'
java.net.BindException: Address already in use
  at sun.nio.ch.Net.bind0(Native Method)
  at sun.nio.ch.Net.bind(Net.java:459)
  at sun.nio.ch.ServerSocketImpl.bind(ServerSocketImpl.java:227)
  ...
```

**Where This Happens:**
Every time we try to:
1. Start interactive Canton console
2. Run initialization scripts
3. Execute any command that starts a Canton process

**Example Failure:**
```powershell
PS> docker exec -it canton-synchronizer /canton/bin/canton -c /canton/synchronizer.conf

# Output:
# Initializing canton...
# Starting domain 'mydomain'...
# ERROR: Address already in use (port 5018, 5019)
# Canton console exits
```

---

## 5. Root Cause Analysis

### 5.1 The Fundamental Problem

**Canton Has Two Operating Modes:**

#### Mode 1: Daemon (Background Service)
```bash
# What docker-compose runs:
bin/canton daemon --config /canton/synchronizer.conf

# Behavior:
# - Starts Canton as background process
# - Binds to ports (5018, 5019) IMMEDIATELY
# - Runs forever (until stopped)
# - Does NOT auto-initialize domain
# - Waits for admin commands via API or console
```

#### Mode 2: Interactive Console (Shell/REPL)
```bash
# What we're trying to run:
bin/canton -c /canton/synchronizer.conf

# Behavior:
# - Starts Canton console (REPL)
# - Tries to bind to ports (5018, 5019)
# - ❌ FAILS if ports already in use
# - Would allow interactive commands
# - Used for manual administration
```

**The Conflict:**
```
Docker Compose (running):
  └─> bin/canton daemon → OCCUPIES ports 5018, 5019

Our initialization attempt:
  └─> docker exec ... bin/canton → TRIES to bind 5018, 5019
        └─> ERROR: Address already in use
```

**Visual Representation:**
```
Port 5018 Status:
┌────────────────────────────────────┐
│  OCCUPIED by daemon process        │
│  PID: 1 (init process in container)│
│  Command: bin/canton daemon        │
│  Status: Listening for connections │
└────────────────────────────────────┘
        ↑
        │
        │ (trying to bind)
        │
┌───────┴────────────────────────────┐
│  Interactive console attempt       │
│  Command: bin/canton -c ...        │
│  ❌ FAILS: Port already bound      │
└────────────────────────────────────┘
```

### 5.2 Why This Architecture Exists

**Docker Compose Design Philosophy:**
- Services should run as **long-lived daemons**
- Container lifecycle = service lifecycle
- `docker-compose up` → services start automatically
- `docker-compose down` → services stop

**Our `docker-compose.yml` follows this:**
```yaml
services:
  synchronizer:
    command: daemon --config /canton/synchronizer.conf
    restart: unless-stopped
```

**Why "daemon" mode:**
- ✅ Container stays running (doesn't exit immediately)
- ✅ Docker can manage lifecycle (health checks, restarts)
- ✅ Services available immediately on `docker-compose up`
- ❌ But doesn't auto-initialize (requires separate step)

### 5.3 Why We Must Face This Problem

**Option A: Don't use daemons**
```yaml
# Run Canton in one-shot mode
command: run-script /canton/scripts/init.sc
```

**Problems:**
- Container exits after script completes
- Canton not available for backend to connect
- Would need separate "run" step after init
- Complex multi-stage Docker setup

**Option B: Use daemons (current approach)**
```yaml
# Canton runs continuously
command: daemon --config ...
```

**Problems:**
- Must initialize separately (can't bind to same ports)
- This is the problem we're solving now

**Why Option B is Correct:**
- Matches production Canton deployment patterns
- Canton should run 24/7 (like a database)
- Backend needs persistent Canton connection
- Initialization is a one-time setup (except with memory storage)

**The Real Issue:**
- **Docker daemons are correct architecture**
- **But we don't know how to initialize a running daemon**
- This is a **knowledge gap**, not a design flaw

---

## 6. Solutions Attempted & Why They Failed

### Attempt 1: Automated Initialization Scripts (FAILED ❌)

**Created Files:**
- `infrastructure/canton/scripts/bootstrap-domain.sc`
- `infrastructure/canton/scripts/connect-participant.sc`
- `infrastructure/canton/scripts/create-parties.sc`
- `infrastructure/canton/scripts/upload-dar.sc`

**Example Script:** `bootstrap-domain.sc`
```scala
// Intended to bootstrap the domain
println("Bootstrapping domain 'mydomain'...")

mydomain.setup.bootstrap_domain(
  Seq()  // No additional participants
)

println("Domain bootstrapped successfully")
```

**Execution Attempts:**

**Attempt 1a: Via init script**
```bash
# infrastructure/init-canton.sh
docker exec canton-synchronizer \
  bin/canton \
  -c /canton/synchronizer.conf \
  -c /canton/scripts/bootstrap-domain.sc
```

**Result:** ❌ Address already in use

**Why It Failed:**
- `bin/canton -c config.conf` starts a NEW Canton instance
- Tries to bind to ports 5018, 5019
- Daemon already using those ports
- Script never executes

**Attempt 1b: Using --command flag**
```bash
docker exec canton-synchronizer \
  bin/canton \
  --config /canton/synchronizer.conf \
  --command "mydomain.setup.bootstrap_domain(); exit"
```

**Result:** ❌ Same error (Address already in use)

**Why It Failed:**
- Still starts a new Canton instance
- `--command` flag doesn't connect to running daemon
- Same port conflict

### Attempt 2: Interactive Console (FAILED ❌)

**Theory:** Connect console to running daemon

**Command Tried:**
```powershell
docker exec -it canton-synchronizer /canton/bin/canton -c /canton/synchronizer.conf
```

**Expected Behavior:**
- Canton console opens (REPL prompt)
- Can type commands: `mydomain.setup.bootstrap_domain()`
- Commands execute on running daemon

**Actual Result:**
```
Initializing Canton...
Starting domain 'mydomain'...
ERROR: java.net.BindException: Address already in use
```

**Why It Failed:**
- Interactive console ALSO tries to start a new instance
- No "connect to running daemon" mode in console
- Canton console architecture assumes it controls the ports

### Attempt 3: Health Check First (FAILED ❌)

**Theory:** Maybe containers weren't ready

**Script Added:**
```bash
# Wait for health checks
echo "Waiting for Canton to be ready..."
sleep 60

# Then try initialization
```

**Result:** ❌ Same error after 60 seconds

**Why It Failed:**
- Containers were already healthy (running for hours)
- Problem isn't timing - it's port binding architecture
- Waiting doesn't resolve port conflicts

### Attempt 4: Different Executable Path (FAILED ❌)

**Error We Saw:**
```
exec: "bin/canton": stat bin/canton: no such file or directory
```

**Attempts:**
```bash
# Try 1:
bin/canton          # ❌ Not found

# Try 2:
/bin/canton         # ❌ Not found

# Try 3:
/canton/bin/canton  # ✅ Found, but...
```

**Result:** ❌ Found executable, but still "Address already in use"

**Why It Failed:**
- Fixed the path issue
- But underlying port conflict still exists
- Canton binary found, but can't start because daemon running

### Attempt 5: Docker Run (One-Shot Container) (FAILED ❌)

**Theory:** Start a new container just for initialization

**Command:**
```powershell
docker run --rm \
  --network viz_default \
  -v ${PWD}/infrastructure/canton:/canton \
  digitalasset/canton-open-source:latest \
  /canton/bin/canton \
  -c /canton/synchronizer.conf \
  --command "mydomain.setup.bootstrap_domain(); exit"
```

**Expected:**
- New container starts
- Connects to network
- Runs initialization command
- Exits

**Result:** ❌ Error: Canton instance not found

**Why It Failed:**
- New container doesn't have access to running daemon's state
- Can't interact with daemon in different container
- Canton architecture doesn't support this pattern

### Attempt 6: PowerShell Script Refinement (FAILED ❌)

**File:** `infrastructure/init-canton.ps1`

**Attempted Fixes:**
- Fixed PowerShell syntax errors
- Added proper error handling
- Improved health checks

**Result:** ❌ Script syntax fixed, but same initialization error

**Why It Failed:**
- PowerShell syntax wasn't the problem
- Underlying Canton port conflict remains
- Scripting improvements don't solve architectural issue

### Attempt 7: Mock Party IDs Workaround (SUCCESS ✅, BUT NOT REAL SOLUTION)

**What We Did:**
```powershell
# Manually created party-ids.json
@"
{
  "TechBank": "TechBank::1220abcdef1234567890",
  "GlobalCorp": "GlobalCorp::1220fedcba0987654321",
  "RetailFinance": "RetailFinance::12201234567890abcdef"
}
"@ | Out-File -FilePath infrastructure/party-ids.json -Encoding UTF8
```

**Result:** ✅ File created, backend development unblocked

**But:**
- ❌ These IDs don't exist in Canton
- ❌ Backend can't actually connect to Canton
- ❌ Would need to mock entire Canton API
- ✅ UI development can proceed
- ⚠️ Not a real solution - just a workaround

---

## 7. Current Investigation Strategy

### 7.1 What We Need to Find

**Core Question:**
> How do you interact with a **running Canton daemon** without starting a new instance?

**Sub-Questions:**
1. Does Canton 2.7.6 expose an HTTP Admin API?
2. What are the API endpoints for initialization tasks?
3. Can Canton console connect remotely to a daemon?
4. Is there a `--remote` or `--connect` flag we're missing?
5. Does Canton support gRPC admin commands?

### 7.2 Knowledge Gaps

**Gap 1: Canton Admin API Documentation**

**What We Know:**
- Admin API ports are exposed: 5012, 5019, 5022, 5032
- Config says `admin-api { address = "0.0.0.0", port = 5019 }`
- Ports are listening (confirmed via `docker ps`)

**What We Don't Know:**
- Is this HTTP REST, gRPC, or both?
- What are the API endpoints?
- How to authenticate (if required)?
- Canton 2.7.6 specific API documentation

**Attempts to Research:**
- Web search for "Canton 2.7.6 Admin API" → Generic troubleshooting, no API docs
- Web search for "Canton daemon remote console" → No specific results
- `docker exec canton-synchronizer /canton/bin/canton --help` → Interrupted (tried to start)

**What Would Help:**
- Official Canton 2.7.6 API reference
- Example curl/HTTP requests for bootstrapping
- Canton console documentation for remote connections
- Community forum posts about daemon initialization

**Gap 2: Canton Console Modes**

**What We Know:**
- Console has interactive mode (REPL)
- Console can take `-c script.sc` argument
- Console tries to bind to ports (causing our error)

**What We Don't Know:**
- Is there a "connect to existing daemon" mode?
- Does `--remote` or `--connect-to` flag exist?
- Can console use Admin API instead of direct port binding?
- How do production Canton deployments handle this?

**What Would Help:**
- Complete Canton console command-line options
- Documentation on remote administration
- Examples of post-deployment initialization

**Gap 3: Canton 2.7.6 vs 2.9.0 API Differences**

**What We Know:**
- Our scripts were written for 2.9.0 syntax
- We're running Canton 2.7.6 (image limitation)
- Config syntax changed: `synchronizers` → `domains`
- Some APIs may not exist in 2.7.6

**Specific API Concerns:**

**In `connect-participant.sc`:**
```scala
// This is 2.9.0 syntax - does it work in 2.7.6?
import com.digitalasset.canton.sequencing.GrpcSequencerConnection

participant.domains.connect(
  alias = "mydomain",
  connection = GrpcSequencerConnection.tryCreate(
    "http://synchronizer:5018"
  ),
  priority = PositiveInt.tryCreate(0)
)
```

**Questions:**
- Does `GrpcSequencerConnection.tryCreate()` exist in 2.7.6?
- What's the correct 2.7.6 syntax for `domains.connect()`?
- Are there API changes between 2.7.6 and 2.9.0?

**In `create-parties.sc`:**
```scala
// Does this work in 2.7.6?
val party = participant1.parties.enable("TechBank")
```

**Questions:**
- Is `parties.enable()` the correct 2.7.6 method?
- Does it return a party ID we can extract?
- What's the exact return type?

**What Would Help:**
- Canton 2.7.6 specific Scala API docs
- Migration guide from 2.7.x to 2.9.x (to identify differences)
- Working examples for 2.7.6

### 7.3 Potential Solutions to Explore

**Solution Path 1: HTTP Admin API**

**Theory:** Running daemons expose REST API for administration

**What to Research:**
```bash
# Try to discover API endpoints
curl http://localhost:5019/health
curl http://localhost:5019/api/version
curl http://localhost:5019/swagger
curl http://localhost:5019/openapi.json

# Try bootstrap via API
curl -X POST http://localhost:5019/api/domain/bootstrap \
  -H "Content-Type: application/json" \
  -d '{}'

# Try party creation via API
curl -X POST http://localhost:5012/api/parties/create \
  -H "Content-Type: application/json" \
  -d '{"name": "TechBank"}'
```

**If This Works:**
- ✅ Can script initialization via curl/PowerShell
- ✅ No port conflicts (uses running daemon)
- ✅ Repeatable and automatable

**If This Fails:**
- Need to find correct endpoints (may not be RESTful)
- May need gRPC instead

**Solution Path 2: gRPC Admin API**

**Theory:** Admin ports expose gRPC, not HTTP

**What to Research:**
- Canton gRPC proto definitions
- Tools: `grpcurl`, `evans` (gRPC clients)
- Admin API service names and methods

**Test Commands:**
```bash
# List available services
grpcurl -plaintext localhost:5019 list

# Describe service
grpcurl -plaintext localhost:5019 describe com.digitalasset.canton.DomainService

# Call bootstrap method
grpcurl -plaintext -d '{}' localhost:5019 com.digitalasset.canton.DomainService/Bootstrap
```

**If This Works:**
- ✅ Can use grpcurl for scripting
- ✅ Interact with running daemon
- ⚠️ More complex than HTTP (need proto files)

**Solution Path 3: Canton Remote Console**

**Theory:** Console can connect to remote daemon

**What to Research:**
- Canton console `--help` output (need to capture without starting)
- Look for flags like:
  - `--remote <host:port>`
  - `--connect-to <url>`
  - `--admin-api <url>`
  - `--no-bind` (don't bind ports)

**Test Approach:**
```bash
# Try to extract help without starting
docker exec canton-synchronizer /canton/bin/canton --help 2>&1 | head -50

# Try potential remote flag
docker exec canton-synchronizer /canton/bin/canton \
  --remote localhost:5019 \
  --command "mydomain.health.status(); exit"
```

**If This Works:**
- ✅ Can use familiar console commands
- ✅ Interactive debugging possible
- ✅ Existing scripts may work with minimal changes

**Solution Path 4: Docker Architecture Redesign**

**Theory:** Separate initialization from runtime

**Approach:**
```yaml
# docker-compose.yml
services:
  # One-shot initialization container
  canton-init:
    image: digitalasset/canton-open-source:latest
    container_name: canton-init
    volumes:
      - ./canton:/canton
      - ./init-state:/init-state
    command: |
      /canton/bin/canton -c /canton/all-configs.conf --command "
        mydomain.setup.bootstrap_domain();
        participant1.domains.connect_local(...);
        val techBank = participant1.parties.enable('TechBank');
        // Save party IDs to file
        exit
      "
    depends_on:
      - synchronizer
      - participant1
      - participant2
      - participant3
  
  # Then regular daemons start
  synchronizer:
    command: daemon --config /canton/synchronizer.conf
    depends_on:
      canton-init:
        condition: service_completed_successfully
```

**Challenges:**
- Complex dependency management
- Need to export party IDs from init container
- Canton state management (memory vs persistent)
- Might require 4-8 hours to perfect

**If This Works:**
- ✅ Fully automated initialization
- ✅ No manual steps
- ✅ Repeatable on every `docker-compose up`
- ⚠️ Complex to maintain

### 7.4 Current Best Guess

**Most Likely Solution: HTTP/gRPC Admin API**

**Reasoning:**
1. Admin API ports are exposed and documented
2. Canton is designed for production use (must have remote admin)
3. Daemon mode implies API-based management
4. Other blockchain systems (Ethereum, Fabric) use this pattern

**What We Need:**
- Find the API documentation for Canton 2.7.6
- Identify exact endpoints/methods
- Test with curl/grpcurl
- Script the initialization

**Time Estimate:**
- Research: 1-2 hours
- Testing: 1-2 hours
- Scripting: 1 hour
- **Total: 3-5 hours** (if documentation exists)

**Risk:**
- API may not exist or be undocumented
- May need to reverse-engineer from Canton source code
- Could hit dead ends

---

## 8. Critical Questions That Need Answers

### High Priority (Blocking Progress)

**Q1: How does Canton 2.7.6 Admin API work?**
- Does it use HTTP REST, gRPC, or both?
- What are the endpoints for domain bootstrap?
- How to create parties via API?
- How to upload DARs via API?
- Is authentication required? (tokens, mTLS?)

**Q2: Can Canton console connect to a running daemon remotely?**
- What command-line flags does Canton console accept?
- Is there a `--remote`, `--connect`, or `--admin-api` flag?
- Can we run console commands without binding ports?

**Q3: What is the correct Canton 2.7.6 Scala API syntax?**
- Syntax for `domains.connect()` in 2.7.6
- Syntax for `parties.enable()` in 2.7.6
- Are our scripts using 2.9.0 APIs that don't exist in 2.7.6?

### Medium Priority (Optimization)

**Q4: How do production Canton deployments handle initialization?**
- Best practices for Canton daemon management
- Recommended initialization workflows
- Common patterns in Canton documentation

**Q5: Can we query Admin API to verify initialization state?**
- Endpoint to check if domain is bootstrapped
- Endpoint to list connected participants
- Endpoint to list parties
- Endpoint to list uploaded DARs

### Low Priority (Nice to Have)

**Q6: What logging/debugging can help diagnose?**
- Canton logs location in container
- How to enable debug-level logging
- How to trace API calls

**Q7: Is there a Canton CLI tool separate from console?**
- Does Canton provide `canton-admin` or similar?
- Command-line tools for one-off operations

---

## 9. Technical Specifications

### 9.1 Environment Details

**Host System:**
- OS: Windows 10 (Build 22631)
- Shell: PowerShell 5.1
- Docker: 28.3.2
- Docker Compose: 2.39.1

**Canton Containers:**
- Image: `digitalasset/canton-open-source:latest`
- Tag resolves to: Canton 2.7.6
- Base image: Debian (likely)
- Java version: OpenJDK 11 (assumed)

**Network:**
- Docker network: `viz_default` (bridge mode)
- Containers can resolve each other by name
- Host can access via `localhost:<port>`

### 9.2 Port Mappings

| Container | Service | Internal Port | Host Port | Protocol | Purpose |
|-----------|---------|---------------|-----------|----------|---------|
| synchronizer | Public API | 5018 | 5018 | gRPC | Domain consensus |
| synchronizer | Admin API | 5019 | 5019 | HTTP/gRPC? | Management |
| participant1 | Ledger API | 5011 | 5011 | gRPC | Backend connects here |
| participant1 | Admin API | 5012 | 5012 | HTTP/gRPC? | Management |
| participant2 | Ledger API | 5021 | 5021 | gRPC | Backend connects here |
| participant2 | Admin API | 5022 | 5022 | HTTP/gRPC? | Management |
| participant3 | Ledger API | 5031 | 5031 | gRPC | Backend connects here |
| participant3 | Admin API | 5032 | 5032 | HTTP/gRPC? | Management |

**Verification:**
```powershell
PS> netstat -an | Select-String "5018|5019|5011|5012|5021|5022|5031|5032"
# All ports show LISTENING
```

### 9.3 File Locations in Containers

**Canton Installation:**
```
/canton/
  ├── bin/
  │   └── canton              # Main executable
  ├── lib/                    # JARs
  ├── synchronizer.conf       # Mounted from host
  ├── participant1.conf       # Mounted from host
  ├── participant2.conf       # Mounted from host
  ├── participant3.conf       # Mounted from host
  ├── scripts/                # Mounted from host
  │   ├── bootstrap-domain.sc
  │   ├── connect-participant.sc
  │   ├── create-parties.sc
  │   └── upload-dar.sc
  └── payment-demo-0.0.1.dar  # Copied manually
```

**Verification:**
```powershell
PS> docker exec canton-synchronizer ls -la /canton/
# Shows all files above
```

### 9.4 Current Canton State

**Can Verify:**
```powershell
# Containers running
PS> docker ps --filter "name=canton" --format "{{.Names}}: {{.Status}}"
# All show "Up X hours"

# Ports listening
PS> docker exec canton-synchronizer netstat -tln | grep 5018
# Shows LISTEN on 0.0.0.0:5018

# Files present
PS> docker exec canton-participant1 ls -lh /canton/*.dar
# Shows payment-demo-0.0.1.dar (243K)
```

**Cannot Verify (Need API/Console):**
- Is domain bootstrapped?
- Are participants connected?
- Do parties exist?
- Is DAR uploaded to ledgers?

---

## 10. Success Criteria

### 10.1 Minimum Viable Initialization

**What Must Work:**

1. **Domain Bootstrapped:**
   ```scala
   mydomain.health.status()
   // Output: Domain is healthy, X transactions processed
   ```

2. **All Participants Connected:**
   ```scala
   participant1.domains.list_connected()
   // Output: mydomain (connected)
   
   participant2.domains.list_connected()
   // Output: mydomain (connected)
   
   participant3.domains.list_connected()
   // Output: mydomain (connected)
   ```

3. **Three Parties Created:**
   ```scala
   participant1.parties.list()
   // Output: TechBank::122089abc...
   
   participant2.parties.list()
   // Output: GlobalCorp::12208def...
   
   participant3.parties.list()
   // Output: RetailFinance::122012345...
   ```

4. **DAR Uploaded:**
   ```scala
   participant1.dars.list()
   // Output: payment-demo-0.0.1
   
   participant2.dars.list()
   // Output: payment-demo-0.0.1
   
   participant3.dars.list()
   // Output: payment-demo-0.0.1
   ```

5. **Party IDs Saved:**
   ```json
   // infrastructure/party-ids.json
   {
     "TechBank": "TechBank::122089abc[real ID from Canton]",
     "GlobalCorp": "GlobalCorp::12208def[real ID from Canton]",
     "RetailFinance": "RetailFinance::122012345[real ID from Canton]"
   }
   ```

### 10.2 Backend Integration Test

**After initialization, this code must work:**

```typescript
// backend/src/test-canton.ts
import { Ledger } from '@daml/ledger';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

// Load real party IDs
const partyIds = JSON.parse(
  readFileSync('infrastructure/party-ids.json', 'utf-8')
);

// Connect as TechBank
const token = jwt.sign(
  { 
    party: partyIds.TechBank,
    ledgerId: 'participant1'
  },
  'test-secret'
);

const ledger = new Ledger({
  token,
  httpBaseUrl: 'http://localhost:5011'
});

// Test 1: Create PaymentRequest
console.log('Test 1: Creating PaymentRequest...');
const contract = await ledger.create('Payment:PaymentRequest', {
  sender: partyIds.TechBank,
  receiver: partyIds.GlobalCorp,
  amount: '1000.00',
  currency: 'USD',
  description: 'Test payment',
  submittedAt: new Date().toISOString()
});
console.log('✅ Contract created:', contract.contractId);

// Test 2: Query contracts
console.log('Test 2: Querying PaymentRequest...');
const contracts = await ledger.query('Payment:PaymentRequest');
console.log('✅ Found', contracts.length, 'contracts');

// Test 3: Exercise Accept choice (as GlobalCorp)
const globalCorpLedger = new Ledger({
  token: jwt.sign(
    { party: partyIds.GlobalCorp },
    'test-secret'
  ),
  httpBaseUrl: 'http://localhost:5021'
});

console.log('Test 3: Accepting payment...');
const payment = await globalCorpLedger.exercise(
  'Payment:PaymentRequest',
  'Accept',
  contract.contractId,
  {}
);
console.log('✅ Payment created:', payment.contractId);

console.log('\n🎉 All tests passed! Canton is working!');
```

**Expected Output:**
```
Test 1: Creating PaymentRequest...
✅ Contract created: 00abc123def456...

Test 2: Querying PaymentRequest...
✅ Found 1 contracts

Test 3: Accepting payment...
✅ Payment created: 00def789abc012...

🎉 All tests passed! Canton is working!
```

**If ANY test fails:**
- Initialization is incomplete
- Must debug before proceeding to Phase 3

### 10.3 What Success Enables

**Phase 3 (Backend):**
```typescript
// Can implement real Canton integration
app.post('/api/payments/submit', async (req, res) => {
  const contract = await ledger.create(PaymentRequest, {...});
  res.json({ contractId: contract.contractId });
});
```

**Phase 4 (Frontend):**
```typescript
// Can test against real blockchain
const response = await fetch('/api/payments/submit', {
  method: 'POST',
  body: JSON.stringify({
    sender: 'TechBank',
    receiver: 'GlobalCorp',
    amount: 1000
  })
});
// Payment actually recorded on Canton
```

**Phase 5 (Integration Testing):**
```typescript
// End-to-end tests work
test('Payment flow', async () => {
  // 1. Submit as TechBank
  const req = await submitPayment({...});
  
  // 2. Query as GlobalCorp
  const pending = await queryPayments('GlobalCorp');
  expect(pending).toContain(req.contractId);
  
  // 3. Accept as GlobalCorp
  const payment = await acceptPayment(req.contractId);
  
  // 4. Verify on blockchain
  const history = await queryPayments('TechBank');
  expect(history).toContain(payment.contractId);
});
```

---

## Summary for AI Assistant

**Context:**
Building a Canton blockchain demo with Daml smart contracts, Node.js backend, React frontend. Containers running, contracts written, but **cannot initialize Canton network**.

**Problem:**
Every initialization attempt fails with "Address already in use" because:
1. Docker Compose runs Canton as daemons (occupies ports continuously)
2. Canton console/scripts try to start NEW instances (port conflict)
3. Don't know how to interact with running daemons

**What We Need:**
Documentation or knowledge about:
1. **Canton 2.7.6 Admin API** (HTTP/gRPC endpoints for bootstrap, party creation, DAR upload)
2. **Canton console remote mode** (flags to connect to running daemon without starting new instance)
3. **Correct 2.7.6 syntax** for initialization commands (may differ from 2.9.0)

**Current Hypothesis:**
Admin API exists on ports 5012, 5019, 5022, 5032 - need to find endpoint documentation to call it directly.

**Constraints:**
- Cannot restart containers frequently (would lose state)
- Must work with Canton 2.7.6 (not 2.9.0)
- Windows PowerShell environment
- Memory storage (state lost on restart)

**Success Metric:**
Backend can execute this without error:
```typescript
await ledger.create(PaymentRequest, {
  sender: realPartyId,  // ← From initialized Canton
  receiver: realPartyId,
  amount: 1000
});
```

**Key Files to Reference:**
- `infrastructure/docker-compose.yml` - Container setup
- `infrastructure/canton/*.conf` - Node configs
- `daml/Payment.daml` - Smart contracts
- `infrastructure/party-ids.json` - Mock IDs (need real ones)

**Question:**
How do we bootstrap domain, connect participants, create parties, and upload DAR to Canton 2.7.6 daemons running in Docker containers?

---

## Appendix: Full Error Logs

**Error from Interactive Console Attempt:**
```
PS> docker exec -it canton-synchronizer /canton/bin/canton -c /canton/synchronizer.conf

Initialized logging
Reading configuration file /canton/synchronizer.conf
Configuration file /canton/synchronizer.conf successfully read
Starting Canton...
INFO  Initializing Canton 2.7.6 (community edition)
INFO  Starting domain 'mydomain'...
ERROR com.digitalasset.canton.environment.Environment - Failed to create domain 'mydomain'
java.net.BindException: Address already in use
        at sun.nio.ch.Net.bind0(Native Method)
        at sun.nio.ch.Net.bind(Net.java:459)
        at sun.nio.ch.Net.bind(Net.java:448)
        at sun.nio.ch.ServerSocketChannelImpl.bind(ServerSocketChannelImpl.java:227)
        at io.netty.channel.socket.nio.NioServerSocketChannel.doBind(NioServerSocketChannel.java:141)
        at io.netty.channel.AbstractChannel$AbstractUnsafe.bind(AbstractChannel.java:562)
        at io.netty.channel.DefaultChannelPipeline$HeadContext.bind(DefaultChannelPipeline.java:1334)
        at io.netty.channel.AbstractChannelHandlerContext.invokeBind(AbstractChannelHandlerContext.java:600)
        at io.netty.channel.AbstractChannelHandlerContext.bind(AbstractChannelHandlerContext.java:579)
        at io.netty.channel.DefaultChannelPipeline.bind(DefaultChannelPipeline.java:973)
        at io.netty.channel.AbstractChannel.bind(AbstractChannel.java:260)
        at io.netty.bootstrap.AbstractBootstrap$2.run(AbstractBootstrap.java:356)
        at io.netty.util.concurrent.AbstractEventExecutor.safeExecute(AbstractEventExecutor.java:164)
        at io.netty.util.concurrent.SingleThreadEventExecutor.runAllTasks(SingleThreadEventExecutor.java:472)
        at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:500)
        at io.netty.util.concurrent.SingleThreadEventExecutor$4.run(SingleThreadEventExecutor.java:989)
        at io.netty.util.internal.ThreadExecutorMap$2.run(ThreadExecutorMap.java:74)
        at io.netty.util.concurrent.FastThreadLocalRunnable.run(FastThreadLocalRunnable.java:30)
        at java.base/java.lang.Thread.run(Thread.java:829)
```

**Container Logs (Daemon Running Successfully):**
```
PS> docker logs canton-synchronizer --tail 20

INFO  c.d.c.environment.Environment - Canton domain 'mydomain' is starting
INFO  c.d.c.domain.Domain - Domain 'mydomain' public API listening on 0.0.0.0:5018
INFO  c.d.c.domain.Domain - Domain 'mydomain' admin API listening on 0.0.0.0:5019
INFO  c.d.c.environment.Environment - Canton domain 'mydomain' started successfully
INFO  c.d.c.environment.CommunityEnvironment - All nodes started successfully
INFO  c.d.c.console.ConsoleEnvironment - Canton console ready
```

**This shows daemon is running perfectly - we just can't initialize it!**

---

**End of Document**

**Next Steps:**
1. Research Canton 2.7.6 Admin API documentation
2. Test Admin API endpoints (curl/grpcurl)
3. If API found: Script initialization
4. If API not found: Consider Docker architecture redesign
5. Document solution for future reference

**Estimated Time to Resolution:**
- Best case (API documented): 3-5 hours
- Worst case (need redesign): 8-12 hours

