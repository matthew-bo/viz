# Canton Privacy Blockchain Visualizer
## Complete MVP Requirements Document v2.0

---

## ⚠️ **IMPORTANT: ACTUAL IMPLEMENTATION VERSIONS**

**This document was written for Canton 2.9.0, but the actual implementation uses:**

| Component | README Says | **ACTUAL VERSION** |
|-----------|-------------|-------------------|
| Canton | 2.9.0 | **2.7.6** ✅ |
| Daml SDK | 2.9.0 | **2.7.6** ✅ |
| Node.js | 20.x | **22.13.1** ✅ |
| Docker Image | `canton-community:2.9.0` | **`canton-open-source:latest`** (2.7.6) ✅ |

### 📋 **Current Project Status (October 16, 2025)**

- ✅ **Phases 0-5 Complete:** Full stack operational with comprehensive testing! 🎉
- ✅ **Phase 2.5 Complete:** Canton fully initialized with **REAL party IDs** ⭐
- ✅ **Phase 3 Complete:** Backend fully functional with Canton integration 🎉
- ✅ **Phase 4 Complete:** Frontend with real-time updates via SSE 🎨
- ✅ **Phase 5 Complete:** Integration testing + Activity Log + System Status 🧪
- 🚀 **Phase 6 Ready:** Deployment & Demo preparation can start now!

### 🎯 **What You Should Read Instead**

**For Current Development:**
- **IMPLEMENTATION_PLAN.md** ← Your main guide, tracks all progress!
- This README is reference only (version numbers incorrect)

**Quick Start (Full Stack Running):**
```powershell
# 1. Ensure Canton is running
docker ps  # Should show 4 healthy containers

# 2. Start backend
cd backend
npm run dev  # Runs on http://localhost:3001

# 3. Start frontend (new terminal)
cd frontend
npm run dev  # Runs on http://localhost:3000

# 4. Open browser
# Navigate to: http://localhost:3000
# Check System Status panel for live health indicators
# View Activity Log for all operations
```

---

## ✅ **Canton Network Status**

**Last Initialized:** October 15, 2025  
**Status:** Fully Operational with Real Party IDs

| Component | Status | Details |
|-----------|--------|---------|
| Canton Containers | ✅ Running | All 4 containers operational |
| Domain | ✅ Initialized | `mydomain` auto-bootstrapped |
| Participants | ✅ Connected | All 3 connected to domain |
| Parties | ✅ Created | Real Canton party IDs generated |
| Smart Contracts | ✅ Deployed | payment-demo-0.0.1.dar uploaded |

**Party IDs Available:** `infrastructure/canton/party-ids.json`

**Real Canton Party IDs:**
```json
{
  "TechBank": "TechBank::1220f8135b39957c1ce3344cc391b41b657be795756db9e6c3e63f5961c484b919ec",
  "GlobalCorp": "GlobalCorp::12200e9f82e9a2d06ef6fa10b5785eccd3251eb9fca0f0a23a3c6ea644f6c284e8e7",
  "RetailFinance": "RetailFinance::122063e334410bd5b0487acd7ceb0874c0c446772d1d5d14406332e2f82e4cbed809"
}
```

**To Re-Initialize Canton** (if containers restarted with in-memory storage):
```powershell
.\infrastructure\init-canton-final.ps1
```

**Initialization Details:** See `CANTON_SUCCESS_SUMMARY.md` for complete setup guide and troubleshooting.

---

**Original Document Follows (Canton 2.9.0 - Use as Reference Only)**

**Build Time:** 7 days | **Cost:** $5/month | **Complexity:** Simplified  
**Last Updated:** Based on senior blockchain developer review and Canton 2.9.0 documentation

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Infrastructure Setup](#3-infrastructure-setup)
4. [Daml Smart Contracts](#4-daml-smart-contracts)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Deployment](#7-deployment)
8. [Testing & Demo Script](#8-testing--demo-script)
9. [AI Agent Implementation Guide](#9-ai-agent-implementation-guide)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Project Goal
Build a publicly accessible web application demonstrating Canton Network's privacy-preserving blockchain capabilities:
- **3 independent participant nodes** (TechBank, GlobalCorp, RetailFinance)
- **1 synchronizer** providing global transaction ordering
- **Privacy visualization** showing transactions only visible to involved participants
- **Ordering visualization** demonstrating synchronizer reordering
- **Multi-party workflow** showing sender→receiver signature flow
- **No authentication** - public demo for recruiters

### 1.2 Key Architectural Decisions (Updated)

| Component | Implementation | Rationale |
|-----------|---------------|-----------|
| Canton Image | Official digitalasset/canton-community:2.9.0 | No build required, tested by thousands |
| Data Storage | Query Canton Ledger directly | Canton IS the database, no cache drift |
| Live Updates | Server-Sent Events (SSE) | <100ms updates vs 0-5s polling delay |
| Accept Workflow | Two-step: Request → Accept | Demonstrates multi-party blockchain |
| Party IDs | Automated JSON export | Eliminates manual copy-paste errors |
| Containers | 4 (3 participants + 1 synchronizer) | Minimal for demo |
| Build Time | 7 days | Realistic with proper tooling |

### 1.3 Technology Stack

**Versions (ACTUAL IMPLEMENTATION):**
```yaml
Canton: 2.7.6 (canton-open-source:latest)
Daml SDK: 2.7.6
Protocol Version: 5 (auto-negotiated by Canton)
@daml/ledger: ^2.7.6
Node.js: 22.13.1
TypeScript: 5.3.3
React: 18.2.0
```

**Stack:**
- **Blockchain:** Canton 2.7.6 (Docker: canton-open-source:latest)
- **Smart Contracts:** Daml 2.7.6
- **Backend:** Node.js 22.13.1 + TypeScript 5.3.3 + Express 4.18.2 + SSE
- **Frontend:** React 18.2.0 + TypeScript + Vite 5.0.8 + TailwindCSS 3.4.0
- **State Management:** Zustand 5.0.8 ⭐
- **Animations:** Framer Motion 12.23.24 ⭐
- **Layout:** React Resizable Panels 3.0.6 ⭐
- **Infrastructure:** Docker Compose (4 containers)
- **Hosting:** Railway.app or Fly.io

**Verification Commands:**
```bash
docker run digitalasset/canton-open-source:latest --version
daml version
node --version
```

---

## 2. Architecture Overview

### 2.1 System Architecture (Updated)

```
Public Internet
    ↓
Frontend (React) - SSE Connection
    ↓ HTTP REST + EventSource
Backend (Node.js) - No Cache
    ↓ gRPC Ledger API (queries Canton directly)
┌─────────────────────────────────────┐
│ Canton Network (Docker Network)     │
│                                      │
│  Participant1  Participant2  Part3  │
│   (TechBank)   (GlobalCorp)  (Retail)│
│       ↓            ↓           ↓     │
│  [PaymentRequest] [PaymentRequest]  │
│  [Payment]        [Payment]         │
│       └────────────┼───────────┘     │
│                    ↓                 │
│              Synchronizer            │
│         (orders transactions)        │
└─────────────────────────────────────┘
```

### 2.2 Transaction Flow (Multi-Party Demonstration)

**Critical for Recruiter Demo:**

```
Step 1: Sender Creates PaymentRequest
  Frontend: TechBank clicks "Send $1000 to GlobalCorp"
  Backend: Submits PaymentRequest (sender signs only)
  Canton: Creates contract with signatory=[TechBank], observer=[GlobalCorp]
  UI: Shows "Pending Acceptance" with yellow badge
  
Step 2: Receiver Views Pending Request
  Frontend: GlobalCorp sees pending request
  UI: "Accept" button appears for GlobalCorp only
  
Step 3: Receiver Accepts
  Frontend: GlobalCorp clicks "Accept"
  Backend: Exercises Accept choice (receiver signs)
  Canton: Creates Payment contract with signatory=[TechBank, GlobalCorp]
  UI: Shows "Committed" with green badge
  
Step 4: Privacy Demonstration
  Frontend: Switch to RetailFinance view
  UI: Transaction disappears (not visible to RetailFinance)
  Canton: Privacy enforced at ledger level
```

### 2.3 Key Design Decisions Explained

**Why Official Canton Image?**
- Digital Asset builds and tests it
- 200MB download vs 2GB+ source
- No Bazel/JDK version conflicts
- Works on all platforms (x86, ARM)

**Why Query Canton Directly?**
- Canton ledger IS the source of truth
- No cache synchronization bugs
- Survives backend restarts
- Demonstrates actual blockchain queries
- 50-100ms latency acceptable for demo

**Why SSE Instead of Polling?**
- Updates appear in <100ms vs 0-5 seconds
- Reduces network traffic by 90%
- Standard HTTP (works everywhere)
- More impressive demo experience

**Why Two-Step Accept Flow?**
- Demonstrates blockchain multi-party trust
- Shows signature requirements visually
- Proves backend can't auto-accept
- Recruiter sees real blockchain workflow

### 2.6 Real World Asset (RWA) Support ⭐ NEW

**Canton Visualizer now includes comprehensive RWA tracking and visualization!**

#### Supported Asset Types
1. **💵 Cash** - Liquid currency
2. **📈 Corporate Bonds** - Company debt securities  
3. **💰 Treasury Bills** - Government short-term debt
4. **📄 Commercial Paper** - Short-term unsecured promissory notes
5. **📊 Equity** - Company stocks and shares
6. **🏭 Commodities** - Physical goods (gold, oil, etc.)

#### RWA Features

**BusinessPanel - Portfolio Breakdown:**
- Each business card shows expandable RWA portfolio
- Visual breakdown by asset type with progress bars
- Percentage calculations and color-coding
- Real-time updates as transactions commit
- Total value per RWA category

**RWA Flow Diagram:**
- Toggle between List view and RWA Flow view
- Animated SVG visualization of asset flows
- Grouped by asset type with color-coding
- Volume and transaction count aggregation
- Smooth particle animations showing flow direction

**Filtering:**
- Filter by business (BusinessPanel)
- Filter by RWA type (in development)
- Synchronizer timeline filtering

**How to Use:**
1. Create transaction with RWA type (dropdown in CREATE modal)
2. View portfolio breakdown in BusinessPanel (left sidebar)
3. Click "📊 Asset Portfolio" to expand
4. Toggle to "RWA Flow" view in main content
5. Filter transactions by business or asset type

**Technical Implementation:**
- RWA type stored in transaction payload
- Portfolio calculated from committed transactions
- Framer Motion for smooth animations
- SVG-based flow diagrams for performance

---

## 3. Infrastructure Setup

### 3.1 Prerequisites

**Required Software:**
```bash
# Docker Desktop with 8GB RAM minimum
# Download: https://www.docker.com/products/docker-desktop

# Node.js 20 LTS
# Download: https://nodejs.org/

# Daml SDK 2.9.0 (free, no license required)
curl -sSL https://get.daml.com/ | sh
daml version  # Verify 2.9.0
```

**NO NEED FOR:**
- Java 17+ (not building from source)
- Bazel (not building from source)
- PostgreSQL (querying Canton directly)

### 3.2 Canton Community Edition Setup (UPDATED)

**Official Pre-Built Image:**
```yaml
CANTON_IMAGE: digitalasset/canton-community:2.9.0
```

**Pull and Verify:**
```bash
# Pull image (200MB, takes 1-2 minutes)
docker pull digitalasset/canton-community:2.9.0

# Verify version
docker run --rm digitalasset/canton-community:2.9.0 --version
# Expected output: Canton version 2.9.0
```

**Image Includes:**
- Canton daemon binary
- All required Java dependencies
- Admin console for scripting
- Health check utilities (nc, curl)

**Resource Requirements:**
- **Disk:** 500MB per container (2GB total)
- **RAM:** 1GB per container (4GB total minimum)
- **CPU:** 2 cores minimum
- **Network:** Docker bridge network

**Documentation Reference:**
- Canton Installation: https://docs.daml.com/canton/usermanual/installation.html
- Canton Configuration: https://docs.daml.com/canton/usermanual/configuration.html

### 3.3 Project Structure

```
canton-privacy-demo/
├── infrastructure/
│   ├── docker-compose.yml           # 4 services: sync + 3 participants
│   ├── init-canton.sh               # Automated setup script
│   ├── party-ids.json               # AUTO-GENERATED by init script
│   └── canton/
│       ├── participant1.conf        # TechBank config
│       ├── participant2.conf        # GlobalCorp config
│       ├── participant3.conf        # RetailFinance config
│       ├── synchronizer.conf        # Domain/sync config
│       └── scripts/
│           ├── bootstrap-domain.sc  # Initialize synchronizer
│           ├── connect-participant.sc # Connect to domain
│           ├── create-parties.sc    # Create parties, output JSON
│           └── upload-dar.sc        # Deploy smart contracts
├── daml/
│   ├── daml.yaml                    # Daml project config
│   └── Payment.daml                 # Smart contract templates
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                         # Party IDs from party-ids.json
│   ├── Dockerfile
│   └── src/
│       ├── server.ts                # Express app with SSE
│       ├── types.ts                 # TypeScript interfaces
│       ├── canton/
│       │   └── ledger-client.ts     # Canton Ledger API client
│       └── routes/
│           ├── contracts.ts         # POST /contracts, /contracts/:id/accept
│           ├── parties.ts           # GET /parties
│           └── events.ts            # GET /events (SSE endpoint)
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── Dockerfile
    └── src/
        ├── App.tsx                  # Main app with SSE connection
        ├── types.ts                 # TypeScript interfaces
        ├── api/
        │   └── client.ts            # API wrapper
        └── components/
            ├── Header.tsx           # App header with connection status
            ├── ContractForm.tsx     # Submit payment form
            ├── PrivacyFilter.tsx    # Party selector buttons
            ├── TransactionGrid.tsx  # Transaction list with privacy viz
            ├── TransactionCard.tsx  # Individual transaction card
            ├── CantonExplainer.tsx  # Educational overlay
            └── StatusBadge.tsx      # Status indicator component
```

### 3.4 Canton Configuration Files

**Reference:** https://docs.daml.com/canton/usermanual/configuration.html

All configurations use HOCON format (Human-Optimized Config Object Notation).

**synchronizer.conf:**
```hocon
canton {
  synchronizers {
    mydomain {
      storage {
        type = memory  # In-memory for demo (H2 database)
      }
      
      public-api {
        address = "0.0.0.0"
        port = 5018
      }
      
      admin-api {
        address = "0.0.0.0"
        port = 5019
      }
      
      parameters {
        # Allow development-mode features
        dev-version-support = true
      }
    }
  }
}
```

**participant1.conf (TechBank):**
```hocon
canton {
  participants {
    participant1 {
      storage {
        type = memory  # In-memory for demo
      }
      
      ledger-api {
        address = "0.0.0.0"
        port = 5011
      }
      
      admin-api {
        address = "0.0.0.0"
        port = 5012
      }
      
      parameters {
        dev-version-support = true
      }
    }
  }
}
```

**Instructions for AI Agent:**

Create three additional files with the same structure:
- **participant2.conf:** ports 5021 (ledger-api), 5022 (admin-api), entity name `participant2`
- **participant3.conf:** ports 5031 (ledger-api), 5032 (admin-api), entity name `participant3`

All use `storage.type = memory` and `dev-version-support = true`.

**Why memory storage?**
- Demo doesn't need persistence across restarts
- Faster initialization (no PostgreSQL setup)
- Simpler deployment
- Full Canton functionality available

### 3.5 Docker Compose Configuration

**File:** `infrastructure/docker-compose.yml`

**Key Requirements:**
- Use official Canton image: `digitalasset/canton-community:2.9.0`
- Mount config files as read-only volumes
- Mount scripts directory for initialization
- Implement health checks with 30-60s start period
- Use `depends_on` with `service_healthy` conditions
- No PostgreSQL service needed

**Service Structure:**

```yaml
services:
  synchronizer:
    - image: digitalasset/canton-community:2.9.0
    - ports: 5018:5018 (public), 5019:5019 (admin)
    - volumes: ./canton/synchronizer.conf, ./canton/scripts
    - command: daemon --config /canton/synchronizer.conf --log-level-root=INFO
    - healthcheck: nc -z localhost 5019
    
  participant1:
    - image: digitalasset/canton-community:2.9.0
    - ports: 5011:5011 (ledger), 5012:5012 (admin)
    - volumes: ./canton/participant1.conf, ./canton/scripts
    - command: daemon --config /canton/participant1.conf --log-level-root=INFO
    - healthcheck: nc -z localhost 5012
    - depends_on: synchronizer (service_healthy)
    
  participant2:
    - image: digitalasset/canton-community:2.9.0
    - ports: 5021:5021 (ledger), 5022:5022 (admin)
    - volumes: ./canton/participant2.conf, ./canton/scripts
    - healthcheck: nc -z localhost 5022
    - depends_on: synchronizer (service_healthy)
    
  participant3:
    - image: digitalasset/canton-community:2.9.0
    - ports: 5031:5031 (ledger), 5032:5032 (admin)
    - volumes: ./canton/participant3.conf, ./canton/scripts
    - healthcheck: nc -z localhost 5032
    - depends_on: synchronizer (service_healthy)
```

**Instructions for AI Agent:**

Write complete docker-compose.yml with:
- All 4 Canton services as specified above
- Health check intervals: 10s, timeout: 5s, retries: 5, start_period: 30s
- Container names: canton-synchronizer, canton-participant1, canton-participant2, canton-participant3
- Network: Use default bridge network
- Restart policy: unless-stopped for all services

Backend and frontend services will be added later in deployment section.

### 3.6 Canton Console Scripts (UPDATED)

**Reference:** https://docs.daml.com/canton/usermanual/console.html

Canton Admin API uses Scala-based console scripts. These run inside Canton containers using the `canton daemon --bootstrap` command.

**1. bootstrap-domain.sc**

Initializes the synchronizer (domain) for the first time.

```scala
// File: infrastructure/canton/scripts/bootstrap-domain.sc

println("Bootstrapping domain 'mydomain'...")

// Initialize domain with empty parameters (uses defaults)
mydomain.setup.bootstrap_domain(Seq())

println("Domain 'mydomain' successfully bootstrapped!")
println(s"Domain ID: ${mydomain.id}")
```

**2. connect-participant.sc (FIXED SYNTAX)**

Connects each participant to the synchronizer. Must run separately for each participant.

**CRITICAL:** Canton 2.9.0 syntax has changed from older documentation.

```scala
// File: infrastructure/canton/scripts/connect-participant.sc

import com.digitalasset.canton.config.RequireTypes.PositiveInt
import com.digitalasset.canton.sequencing.GrpcSequencerConnection
import scala.concurrent.duration._

println(s"Connecting ${participant.name} to domain 'mydomain'...")

// Connect using Canton 2.9.0 API
participant.domains.connect(
  alias = "mydomain",
  connection = GrpcSequencerConnection.tryCreate(
    "http://synchronizer:5018"  // Synchronizer public API endpoint
  ),
  priority = PositiveInt.tryCreate(0),
  synchronize = None,  // Use default synchronization
  timeTracker = None   // Use default time tracker
)

// Wait for connection to be active (max 30 seconds)
utils.retry_until_true(30, 1.second) {
  participant.domains.id_of("mydomain").isDefined
}

println(s"${participant.name} successfully connected to mydomain!")
println(s"Domain ID: ${participant.domains.id_of("mydomain").get}")
```

**Old syntax (WILL FAIL):**
```scala
// DON'T USE THIS - deprecated in 2.9.0
participant.domains.connect_local(
  sequencerConnection = grpc.SequencerConnection.Grpc(...)
)
```

**3. create-parties.sc (AUTO-GENERATE JSON)**

Creates parties and outputs party IDs in machine-readable JSON format.

**CRITICAL:** Party IDs include cryptographic fingerprints and change on every bootstrap. Must be automated.

```scala
// File: infrastructure/canton/scripts/create-parties.sc

println("Creating parties on participants...")

// Create parties (each party hosted on one participant)
val techBankParty = participant1.parties.enable(
  "TechBank",
  displayName = Some("TechBank")
)

val globalCorpParty = participant2.parties.enable(
  "GlobalCorp",
  displayName = Some("GlobalCorp")
)

val retailFinanceParty = participant3.parties.enable(
  "RetailFinance",
  displayName = Some("RetailFinance")
)

// Output as JSON for automated parsing
val partyJson = s"""{
  "TechBank": "$techBankParty",
  "GlobalCorp": "$globalCorpParty",
  "RetailFinance": "$retailFinanceParty"
}"""

println("=== PARTY IDS JSON ===")
println(partyJson)
println("=== END PARTY IDS ===")
```

**Example Output:**
```json
{
  "TechBank": "TechBank::122089a1b2c3d4e5f67890abcdef12345678",
  "GlobalCorp": "GlobalCorp::12207f8e9d0c1b2a39485f6e7d8c9b0a1",
  "RetailFinance": "RetailFinance::1220a9b8c7d6e5f4031827364554637281"
}
```

**Party ID Format:**
- Display name: `TechBank`
- Separator: `::`
- Fingerprint: `122089a1b2c3d4...` (hex encoded hash)

**4. upload-dar.sc**

Deploys compiled Daml smart contracts (.dar file) to all participants.

```scala
// File: infrastructure/canton/scripts/upload-dar.sc

println("Uploading DAR to all participants...")

val darPath = "/canton/payment-demo-0.0.1.dar"

// Upload to all three participants
participant1.dars.upload(darPath)
println("✓ Uploaded to participant1")

participant2.dars.upload(darPath)
println("✓ Uploaded to participant2")

participant3.dars.upload(darPath)
println("✓ Uploaded to participant3")

println("DAR successfully uploaded to all participants!")
```

### 3.7 Canton Initialization (WORKING SOLUTION ✅)

**Actual Implementation (Canton 2.7.6):**

**File:** `infrastructure/init-canton-final.ps1`  
**Status:** ✅ Fully Working - Tested and Verified  
**Time:** 30 seconds automated execution

**How to Initialize:**
```powershell
# From project root
.\infrastructure\init-canton-final.ps1
```

**What It Does:**
1. Connects all 3 participants to the auto-bootstrapped domain
2. Creates real Canton parties (TechBank, GlobalCorp, RetailFinance)  
3. Uploads payment-demo-0.0.1.dar to all participants
4. Extracts and saves real party IDs to `party-ids.json`

**Complete Details:** See `CANTON_SUCCESS_SUMMARY.md`

---

**Note:** The bash script (`init-canton.sh`) shown below was the original plan for Canton 2.9.0. The actual implementation uses a different approach due to Canton 2.7.6 API differences. See `CANTON_SUCCESS_SUMMARY.md` for the working solution.

**Original Plan (Canton 2.9.0 - Reference Only):**

**File:** `infrastructure/init-canton.sh` (not used in actual implementation)

**Purpose:** Orchestrates Canton setup with automated party ID extraction (2.9.0 approach).

```bash
#!/bin/bash
set -e  # Exit on any error

echo "=========================================="
echo "Canton Network Initialization"
echo "=========================================="

# Step 1: Wait for all containers to be healthy
echo "Waiting for Canton services to be healthy..."
for i in {1..60}; do
  HEALTHY=$(docker ps --filter "name=canton-" --filter "health=healthy" --format "{{.Names}}" | wc -l)
  if [ "$HEALTHY" -eq 4 ]; then
    echo "✓ All 4 services healthy"
    break
  fi
  echo "Waiting... ($i/60) - $HEALTHY/4 services healthy"
  sleep 2
done

if [ "$HEALTHY" -ne 4 ]; then
  echo "❌ Services failed to become healthy"
  exit 1
fi

# Retry helper function
retry_command() {
  local max_attempts=3
  local attempt=1
  local cmd="$@"
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: $cmd"
    if $cmd; then
      return 0
    fi
    echo "Failed, retrying in 5 seconds..."
    sleep 5
    ((attempt++))
  done
  
  echo "❌ Command failed after $max_attempts attempts"
  return 1
}

# Step 2: Bootstrap synchronizer domain
echo ""
echo "Step 2/5: Bootstrapping synchronizer domain..."
retry_command docker exec canton-synchronizer canton daemon \
  --config /canton/synchronizer.conf \
  --bootstrap /canton/scripts/bootstrap-domain.sc

# Step 3: Connect participants to domain
echo ""
echo "Step 3/5: Connecting participants to domain..."

for p in participant1 participant2 participant3; do
  echo "Connecting $p..."
  retry_command docker exec canton-$p canton daemon \
    --config /canton/$p.conf \
    --bootstrap /canton/scripts/connect-participant.sc
done

# Step 4: Create parties and extract JSON
echo ""
echo "Step 4/5: Creating parties and extracting IDs..."

# Run script and capture output
PARTY_OUTPUT=$(docker exec canton-participant1 canton daemon \
  --config /canton/participant1.conf \
  --config /canton/participant2.conf \
  --config /canton/participant3.conf \
  --bootstrap /canton/scripts/create-parties.sc)

# Extract JSON between markers
PARTY_JSON=$(echo "$PARTY_OUTPUT" | \
  sed -n '/=== PARTY IDS JSON ===/,/=== END PARTY IDS ===/p' | \
  grep -v "===")

# Save to file
echo "$PARTY_JSON" > party-ids.json
echo "✓ Party IDs saved to party-ids.json"

# Display for verification
echo "Party IDs:"
cat party-ids.json | jq '.'

# Step 5: Copy and upload DAR file
echo ""
echo "Step 5/5: Uploading smart contracts (DAR)..."

# Copy DAR to all containers
DAR_FILE="../daml/.daml/dist/payment-demo-0.0.1.dar"
if [ ! -f "$DAR_FILE" ]; then
  echo "❌ DAR file not found: $DAR_FILE"
  echo "Run 'cd daml && daml build' first"
  exit 1
fi

for container in canton-synchronizer canton-participant1 canton-participant2 canton-participant3; do
  docker cp "$DAR_FILE" $container:/canton/
done

# Upload DAR to all participants
retry_command docker exec canton-participant1 canton daemon \
  --config /canton/participant1.conf \
  --config /canton/participant2.conf \
  --config /canton/participant3.conf \
  --bootstrap /canton/scripts/upload-dar.sc

echo ""
echo "=========================================="
echo "✓ Initialization Complete!"
echo "=========================================="
echo "Next steps:"
echo "1. Copy party IDs to backend/.env:"
echo "   - TECHBANK_PARTY_ID=<value from party-ids.json>"
echo "   - GLOBALCORP_PARTY_ID=<value from party-ids.json>"
echo "   - RETAILFINANCE_PARTY_ID=<value from party-ids.json>"
echo "2. Start backend: cd backend && npm start"
echo "3. Start frontend: cd frontend && npm start"
echo "=========================================="
```

**Instructions for AI Agent:**

Make script executable:
```bash
chmod +x infrastructure/init-canton.sh
```

Test initialization:
```bash
cd infrastructure
docker-compose up -d
sleep 60  # Wait for containers
./init-canton.sh
cat party-ids.json  # Verify JSON output
```

---

## 4. Daml Smart Contracts

**Reference:** https://docs.daml.com/daml/reference/index.html

### 4.1 Contract Design

**Two-Template Pattern (Required for Canton Multi-Party):**

1. **PaymentRequest** - Initial proposal
   - Signatory: Sender only
   - Observer: Receiver (can see but hasn't signed)
   - Choices: Accept (receiver), Reject (receiver)

2. **Payment** - Final committed contract
   - Signatories: Sender AND receiver (both signed)
   - No observers (privacy-preserved)
   - Represents completed transaction

**Why Two Templates?**
- Canton requires all signatories to sign
- Can't create Payment directly (receiver hasn't signed yet)
- PaymentRequest allows sender to propose
- Accept choice allows receiver to sign and create Payment
- Demonstrates blockchain multi-party workflow

### 4.2 Payment.daml

**File:** `daml/Payment.daml`

```daml
module Payment where

-- PaymentRequest: Initial proposal by sender
template PaymentRequest
  with
    sender: Party
    receiver: Party
    amount: Decimal
    currency: Text
    description: Text
    submittedAt: Time
  where
    signatory sender      -- Only sender signs initially
    observer receiver     -- Receiver can see but hasn't signed
    
    -- Receiver can accept the payment request
    choice Accept : ContractId Payment
      controller receiver  -- Only receiver can exercise this choice
      do
        now <- getTime
        create Payment with
          sender = sender
          receiver = receiver
          amount = amount
          currency = currency
          description = description
          submittedAt = submittedAt
          committedAt = now
    
    -- Receiver can reject the payment request
    choice Reject : ()
      controller receiver
      do
        return ()  -- Simply archive the request

-- Payment: Final committed contract with both signatures
template Payment
  with
    sender: Party
    receiver: Party
    amount: Decimal
    currency: Text
    description: Text
    submittedAt: Time    -- When request was created
    committedAt: Time    -- When receiver accepted
  where
    signatory sender, receiver  -- Both parties have signed
    
    -- No choices needed - this is final state
```

**Key Concepts:**

- **Signatory:** Party that must sign (legally bound)
- **Observer:** Party that can see contract (not bound)
- **Controller:** Party that can exercise a choice
- **Time:** Ledger time (not wall clock time)

**Privacy Model:**
- PaymentRequest visible to: sender, receiver
- Payment visible to: sender, receiver
- Not visible to: other participants (e.g., RetailFinance)

### 4.3 Daml Project Configuration

**File:** `daml/daml.yaml`

```yaml
sdk-version: 2.9.0
name: payment-demo
version: 0.0.1
source: .
dependencies:
  - daml-prim
  - daml-stdlib
build-options:
  - --target=2.9
```

### 4.4 Build Commands

```bash
cd daml

# Build DAR (Daml Archive)
daml build

# Output: .daml/dist/payment-demo-0.0.1.dar
# This file is deployed to Canton participants
```

**DAR File Contents:**
- Compiled Daml code
- Type signatures
- Template definitions
- Choice definitions

**Verification:**
```bash
# Check DAR was created
ls -lh .daml/dist/payment-demo-0.0.1.dar

# Inspect DAR contents (optional)
daml damlc inspect-dar .daml/dist/payment-demo-0.0.1.dar
```

---

## 5. Backend Implementation

### 5.1 Architecture (UPDATED - No Cache)

**Components:**
- **Ledger Client** (`ledger-client.ts`) - Queries Canton Ledger API directly
- **REST Routes** (`routes/`) - Serves frontend
- **SSE Broadcast** (`routes/events.ts`) - Pushes real-time updates
- **No Cache** - Canton is the source of truth

**Data Flow:**
```
POST /api/contracts (submit)
  ↓
ledgerClient.submitPaymentRequest() → Canton (sender signs)
  ↓
broadcastTransaction({ status: 'pending' }) → SSE
  ↓
Return PaymentRequest to frontend

POST /api/contracts/:id/accept
  ↓
ledgerClient.acceptPayment() → Canton (receiver signs)
  ↓
broadcastTransaction({ status: 'committed' }) → SSE
  ↓
Return Payment to frontend

GET /api/contracts?party=TechBank
  ↓
ledgerClient.getTransactions('TechBank') → Canton query
  ↓
Return [PaymentRequest, Payment] contracts
```

**Why No Cache:**
- Canton ledger is always correct
- No synchronization bugs
- Survives backend restarts
- Demonstrates blockchain query patterns
- 50-100ms latency acceptable for demo

### 5.2 TypeScript Interfaces

**File:** `backend/src/types.ts`

```typescript
// Canton transaction with full metadata
export interface CantonTransaction {
  // Contract identifiers
  contractId: string;           // Canton contract ID (unique)
  templateId: string;           // "Payment:PaymentRequest" or "Payment:Payment"
  
  // Transaction metadata (from Canton)
  transactionId: string;        // Canton transaction ID
  offset: string;               // Ledger offset (ordering proof)
  recordTime: string;           // ISO timestamp when recorded
  
  // Contract payload
  payload: {
    sender: string;             // Party ID with fingerprint
    receiver: string;           // Party ID with fingerprint
    amount: string;             // Decimal as string
    currency: string;           // "USD"
    description: string;        // User-provided text
    submittedAt: string;        // ISO timestamp
    committedAt?: string;       // ISO timestamp (only for Payment)
  };
  
  // Privacy information
  signatories: string[];        // Parties who signed
  observers: string[];          // Parties who can see
  
  // UI state (derived from templateId)
  status: 'pending' | 'committed' | 'rejected';
  
  // Display name mapping (e.g., "TechBank::1220..." → "TechBank")
  senderDisplayName: string;
  receiverDisplayName: string;
}

// Party configuration
export interface PartyConfig {
  displayName: string;          // "TechBank"
  partyId: string;              // "TechBank::122089abc..."
  ledgerApiUrl: string;         // "http://participant1:5011"
}
```

### 5.3 Canton Ledger Client

**File:** `backend/src/canton/ledger-client.ts`

**Reference:** https://docs.daml.com/app-dev/bindings-ts/index.html

**Key Responsibilities:**
1. Create authenticated connections to each participant's Ledger API
2. Submit PaymentRequest contracts (sender signs)
3. Exercise Accept choice (receiver signs)
4. Query active contracts with privacy filtering

**Authentication:**

Canton Ledger API requires JWT tokens with specific claims structure:

```typescript
import jwt from 'jsonwebtoken';

function createCantonToken(partyId: string, ledgerId: string): string {
  return jwt.sign(
    {
      "https://daml.com/ledger-api": {
        actAs: [partyId],                    // Party this token acts as
        ledgerId: ledgerId,                  // Must match participant's ledger ID
        applicationId: "canton-privacy-demo" // Application identifier
      }
    },
    'demo-secret-key',  // Demo only - use proper secret in production
    { 
      algorithm: 'HS256',
      expiresIn: '24h'
    }
  );
}
```

**Class Structure:**

```typescript
import { DamlLedger } from '@daml/ledger';

export class CantonLedgerClient {
  private ledgers: Map<string, DamlLedger>;
  private parties: Map<string, PartyConfig>;
  
  constructor() {
    // Load party IDs from environment variables
    const parties: PartyConfig[] = [
      {
        displayName: 'TechBank',
        partyId: process.env.TECHBANK_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT1_LEDGER_API!
      },
      {
        displayName: 'GlobalCorp',
        partyId: process.env.GLOBALCORP_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT2_LEDGER_API!
      },
      {
        displayName: 'RetailFinance',
        partyId: process.env.RETAILFINANCE_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT3_LEDGER_API!
      }
    ];
    
    // Create ledger connections for each party
    this.ledgers = new Map();
    this.parties = new Map();
    
    for (const party of parties) {
      const token = createCantonToken(party.partyId, 'participant1');
      const ledger = new DamlLedger({
        token: token,
        httpBaseUrl: party.ledgerApiUrl
      });
      
      this.ledgers.set(party.displayName, ledger);
      this.parties.set(party.displayName, party);
    }
  }
  
  // Get party ID by display name
  getPartyId(displayName: string): string {
    const party = this.parties.get(displayName);
    if (!party) throw new Error(`Unknown party: ${displayName}`);
    return party.partyId;
  }
  
  // Submit PaymentRequest (sender signs)
  async submitPaymentRequest(
    senderName: string,
    receiverName: string,
    amount: number,
    description: string
  ): Promise<CantonTransaction> {
    // Get sender's ledger connection
    const senderLedger = this.ledgers.get(senderName);
    if (!senderLedger) throw new Error(`Unknown sender: ${senderName}`);
    
    // Get party IDs
    const senderPartyId = this.getPartyId(senderName);
    const receiverPartyId = this.getPartyId(receiverName);
    
    // Submit contract creation
    const result = await senderLedger.create({
      templateId: 'Payment:PaymentRequest',
      payload: {
        sender: senderPartyId,
        receiver: receiverPartyId,
        amount: amount.toString(),
        currency: 'USD',
        description: description,
        submittedAt: new Date().toISOString()
      }
    });
    
    return this.formatPaymentRequest(result, senderName, receiverName);
  }
  
  // Accept PaymentRequest (receiver signs)
  async acceptPaymentRequest(
    receiverName: string,
    contractId: string
  ): Promise<CantonTransaction> {
    // Get receiver's ledger connection
    const receiverLedger = this.ledgers.get(receiverName);
    if (!receiverLedger) throw new Error(`Unknown receiver: ${receiverName}`);
    
    // Exercise Accept choice
    const result = await receiverLedger.exercise({
      templateId: 'Payment:PaymentRequest',
      contractId: contractId,
      choice: 'Accept',
      argument: {}  // Accept choice takes no arguments
    });
    
    // Extract Payment contract from exercise result
    const paymentContract = result.exerciseResult;
    
    // Query to get full contract details
    const contracts = await receiverLedger.query({
      templateId: 'Payment:Payment'
    });
    
    const payment = contracts.find(c => c.contractId === paymentContract);
    if (!payment) throw new Error('Payment contract not found after accept');
    
    return this.formatPayment(payment);
  }
  
  // Query all contracts visible to a party
  async getTransactions(partyName?: string): Promise<CantonTransaction[]> {
    const ledger = partyName 
      ? this.ledgers.get(partyName)
      : this.ledgers.values().next().value;
    
    if (!ledger) throw new Error(`Unknown party: ${partyName}`);
    
    // Query both PaymentRequest and Payment contracts
    const [requests, payments] = await Promise.all([
      ledger.query({ templateId: 'Payment:PaymentRequest' }),
      ledger.query({ templateId: 'Payment:Payment' })
    ]);
    
    // Format and combine
    const formattedRequests = requests.map(r => 
      this.formatPaymentRequest(r, this.getDisplayName(r.payload.sender), 
                                    this.getDisplayName(r.payload.receiver))
    );
    const formattedPayments = payments.map(p => this.formatPayment(p));
    
    // Sort by creation time (newest first)
    return [...formattedRequests, ...formattedPayments].sort((a, b) => 
      new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime()
    );
  }
  
  // Format PaymentRequest contract
  private formatPaymentRequest(
    contract: any,
    senderDisplayName: string,
    receiverDisplayName: string
  ): CantonTransaction {
    return {
      contractId: contract.contractId,
      templateId: 'Payment:PaymentRequest',
      transactionId: contract.transactionId,
      offset: contract.offset,
      recordTime: contract.recordTime || new Date().toISOString(),
      payload: contract.payload,
      signatories: contract.signatories,
      observers: contract.observers,
      status: 'pending',
      senderDisplayName: senderDisplayName,
      receiverDisplayName: receiverDisplayName
    };
  }
  
  // Format Payment contract
  private formatPayment(contract: any): CantonTransaction {
    return {
      contractId: contract.contractId,
      templateId: 'Payment:Payment',
      transactionId: contract.transactionId,
      offset: contract.offset,
      recordTime: contract.recordTime || new Date().toISOString(),
      payload: contract.payload,
      signatories: contract.signatories,
      observers: contract.observers || [],
      status: 'committed',
      senderDisplayName: this.getDisplayName(contract.payload.sender),
      receiverDisplayName: this.getDisplayName(contract.payload.receiver)
    };
  }
  
  // Extract display name from party ID
  private getDisplayName(partyId: string): string {
    // Party ID format: "TechBank::122089abc..."
    return partyId.split('::')[0];
  }
  
  // Get all parties for UI
  getAllParties(): PartyConfig[] {
    return Array.from(this.parties.values());
  }
}
```

**Instructions for AI Agent:**

Implement the CantonLedgerClient class exactly as specified above. Key points:
- Use `@daml/ledger` package for all Canton interactions
- Handle party IDs with fingerprints correctly
- Generate JWT tokens for authentication
- Query both PaymentRequest and Payment templates
- Format results with display names for UI

### 5.4 Backend Routes

**File:** `backend/src/routes/contracts.ts`

**Endpoints:**
1. `GET /api/contracts?party=TechBank` - Query transactions (Canton direct)
2. `POST /api/contracts` - Submit PaymentRequest (sender signs)
3. `POST /api/contracts/:id/accept` - Accept request (receiver signs)

**Implementation Details:**

```typescript
import { Router } from 'express';
import { CantonLedgerClient } from '../canton/ledger-client';
import { broadcastTransaction } from './events';

const router = Router();
const ledger = new CantonLedgerClient();

// GET /api/contracts - Query transactions from Canton
router.get('/', async (req, res) => {
  try {
    const party = req.query.party as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Query Canton ledger directly (no cache)
    const transactions = await ledger.getTransactions(party);
    
    // Apply limit
    const limited = transactions.slice(0, limit);
    
    res.json(limited);
  } catch (error) {
    console.error('Failed to query transactions:', error);
    res.status(500).json({ 
      error: 'Failed to query Canton ledger',
      details: error.message 
    });
  }
});

// POST /api/contracts - Submit PaymentRequest
router.post('/', async (req, res) => {
  try {
    const { sender, receiver, amount, description } = req.body;
    
    // Validate required fields
    if (!sender || !receiver || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['sender', 'receiver', 'amount']
      });
    }
    
    // Validate amount is positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number'
      });
    }
    
    // Submit to Canton (sender signs)
    const transaction = await ledger.submitPaymentRequest(
      sender,
      receiver,
      numAmount,
      description || ''
    );
    
    // Broadcast to all SSE clients
    broadcastTransaction(transaction);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Failed to submit transaction:', error);
    res.status(500).json({ 
      error: 'Failed to submit to Canton',
      details: error.message 
    });
  }
});

// POST /api/contracts/:id/accept - Accept PaymentRequest
router.post('/:id/accept', async (req, res) => {
  try {
    const contractId = req.params.id;
    const { receiver } = req.body;
    
    if (!receiver) {
      return res.status(400).json({ 
        error: 'Receiver party name required'
      });
    }
    
    // Submit Accept choice to Canton (receiver signs)
    const transaction = await ledger.acceptPaymentRequest(
      receiver,
      contractId
    );
    
    // Broadcast to all SSE clients
    broadcastTransaction(transaction);
    
    res.json(transaction);
  } catch (error) {
    console.error('Failed to accept transaction:', error);
    res.status(500).json({ 
      error: 'Failed to accept on Canton',
      details: error.message 
    });
  }
});

export default router;
```

**Instructions for AI Agent:**

Implement routes with:
- Proper input validation
- Error handling with descriptive messages
- Logging for debugging
- SSE broadcast after state changes
- HTTP status codes (200, 201, 400, 500)

**File:** `backend/src/routes/parties.ts`

```typescript
import { Router } from 'express';
import { CantonLedgerClient } from '../canton/ledger-client';

const router = Router();
const ledger = new CantonLedgerClient();

// GET /api/parties - Get all parties for UI
router.get('/', async (req, res) => {
  try {
    const parties = ledger.getAllParties();
    res.json(parties);
  } catch (error) {
    console.error('Failed to get parties:', error);
    res.status(500).json({ 
      error: 'Failed to get parties',
      details: error.message 
    });
  }
});

export default router;
```

### 5.5 Server-Sent Events (SSE)

**File:** `backend/src/routes/events.ts`

**Purpose:** Push real-time transaction updates to all connected clients.

**SSE Benefits:**
- Server-to-client push over HTTP
- Automatic reconnection
- Works through firewalls
- No WebSocket complexity

**Implementation:**

```typescript
import { Router, Request, Response } from 'express';
import { CantonTransaction } from '../types';

const router = Router();

// Store active SSE connections
const clients: Response[] = [];

// SSE endpoint - clients connect here
router.get('/', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Enable CORS for SSE
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection success event
  res.write('data: {"type":"connected"}\n\n');
  
  // Add client to active connections
  clients.push(res);
  console.log(`✓ SSE client connected. Total clients: ${clients.length}`);
  
  // Remove client on disconnect
  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log(`✗ SSE client disconnected. Total clients: ${clients.length}`);
    }
  });
});

// Broadcast transaction to all connected clients
export function broadcastTransaction(transaction: CantonTransaction) {
  const message = `data: ${JSON.stringify({
    type: 'transaction',
    data: transaction
  })}\n\n`;
  
  console.log(`Broadcasting transaction ${transaction.contractId} to ${clients.length} clients`);
  
  // Send to all active clients
  clients.forEach((client, index) => {
    try {
      client.write(message);
    } catch (error) {
      console.error(`Failed to send to client ${index}:`, error);
    }
  });
}

export default router;
```

**Instructions for AI Agent:**

Implement SSE endpoint with:
- Correct headers for SSE protocol
- Client connection tracking
- Cleanup on disconnect
- Error handling for failed sends

### 5.6 Backend Server Setup

**File:** `backend/src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contractsRouter from './routes/contracts';
import partiesRouter from './routes/parties';
import eventsRouter from './routes/events';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/contracts', contractsRouter);
app.use('/api/parties', partiesRouter);
app.use('/api/events', eventsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Backend server running on port ${PORT}`);
  console.log(`✓ SSE endpoint: http://localhost:${PORT}/api/events`);
});
```

**Instructions for AI Agent:**

Create Express server with:
- CORS enabled for frontend
- JSON body parsing
- Request logging
- All route handlers mounted
- Health check endpoint

### 5.7 Backend Configuration Files

**File:** `backend/package.json`

```json
{
  "name": "canton-privacy-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@daml/ledger": "^2.9.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
```

**File:** `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**File:** `backend/.env`

```bash
# Participant Ledger API URLs (Docker network)
PARTICIPANT1_LEDGER_API=http://participant1:5011
PARTICIPANT2_LEDGER_API=http://participant2:5021
PARTICIPANT3_LEDGER_API=http://participant3:5031

# Party IDs (from party-ids.json after running init-canton.sh)
TECHBANK_PARTY_ID=TechBank::122089a1b2c3d4e5f67890abcdef12345678
GLOBALCORP_PARTY_ID=GlobalCorp::12207f8e9d0c1b2a39485f6e7d8c9b0a1
RETAILFINANCE_PARTY_ID=RetailFinance::1220a9b8c7d6e5f4031827364554637281

# Server configuration
PORT=3001
```

**Instructions for AI Agent:**

After running `init-canton.sh`, update `.env` file with actual party IDs from `party-ids.json`:
```bash
# Extract party IDs and update .env
cat infrastructure/party-ids.json | jq -r 'to_entries | .[] | "\(.key | ascii_upcase)_PARTY_ID=\(.value)"'
```

---

## 6. Frontend Implementation

### 6.1 Architecture

**Key Features:**
- Single-page application with SSE connection
- Real-time updates (<100ms latency)
- **System Status Panel** - Live health monitoring (backend, SSE, Canton network) ⭐ NEW
- **Activity Log** - Complete operation logging with JSON/CSV export ⭐ NEW
- Privacy filter with visual indicators
- Accept button for pending transactions
- Canton explainer overlay
- Responsive design (mobile-friendly)

**Component Hierarchy:**
```
App
├── Header (connection status)
├── CantonExplainer (educational overlay)
├── SystemStatus (live health indicators) ⭐ NEW
├── ContractForm (submit payment)
├── PrivacyFilter (party selector)
├── TransactionGrid
│   └── TransactionCard (individual transaction)
│       ├── StatusBadge
│       └── AcceptButton (conditional)
└── ActivityLog (operation logging & export) ⭐ NEW
```

### 6.2 TypeScript Interfaces

**File:** `frontend/src/types.ts`

```typescript
// Match backend interface exactly
export interface Transaction {
  contractId: string;
  templateId: string;
  transactionId: string;
  offset: string;
  recordTime: string;
  payload: {
    sender: string;
    receiver: string;
    amount: string;
    currency: string;
    description: string;
    submittedAt: string;
    committedAt?: string;
  };
  signatories: string[];
  observers: string[];
  status: 'pending' | 'committed' | 'rejected';
  senderDisplayName: string;
  receiverDisplayName: string;
}

export interface Party {
  displayName: string;
  partyId: string;
  ledgerApiUrl: string;
}
```

### 6.3 API Client

**File:** `frontend/src/api/client.ts`

```typescript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const apiClient = {
  // Get transactions (optionally filtered by party)
  async getTransactions(params?: { party?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.party) query.append('party', params.party);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE}/api/contracts?${query}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },
  
  // Submit new PaymentRequest
  async submitContract(data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
  }) {
    const response = await fetch(`${API_BASE}/api/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to submit transaction');
    return response.json();
  },
  
  // Accept pending PaymentRequest
  async acceptContract(contractId: string, receiver: string) {
    const response = await fetch(`${API_BASE}/api/contracts/${contractId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver })
    });
    if (!response.ok) throw new Error('Failed to accept transaction');
    return response.json();
  },
  
  // Get all parties
  async getParties() {
    const response = await fetch(`${API_BASE}/api/parties`);
    if (!response.ok) throw new Error('Failed to fetch parties');
    return response.json();
  }
};
```

### 6.4 Main App Component

**File:** `frontend/src/App.tsx`

**Structure:**

```typescript
import { useState, useEffect } from 'react';
import { Transaction, Party } from './types';
import { apiClient } from './api/client';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Load initial data and parties
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [txs, partiesList] = await Promise.all([
          apiClient.getTransactions({ limit: 50 }),
          apiClient.getParties()
        ]);
        setTransactions(txs);
        setParties(partiesList);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);
  
  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/events');
    
    eventSource.onopen = () => {
      console.log('✓ SSE connected');
      setIsConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'transaction') {
        const tx = message.data as Transaction;
        
        setTransactions(prev => {
          // Check if transaction exists (update) or is new (add)
          const existingIndex = prev.findIndex(t => t.contractId === tx.contractId);
          
          if (existingIndex !== -1) {
            // Update existing transaction
            const updated = [...prev];
            updated[existingIndex] = tx;
            return updated;
          } else {
            // Add new transaction at beginning
            return [tx, ...prev];
          }
        });
      }
    };
    
    eventSource.onerror = () => {
      console.error('✗ SSE disconnected');
      setIsConnected(false);
      // Browser automatically reconnects
    };
    
    // Cleanup on unmount
    return () => eventSource.close();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
  }) => {
    try {
      await apiClient.submitContract(data);
      // No need to update state - SSE will push update
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit transaction');
    }
  };
  
  // Handle accept button click
  const handleAccept = async (contractId: string, receiver: string) => {
    try {
      await apiClient.acceptContract(contractId, receiver);
      // No need to update state - SSE will push update
    } catch (error) {
      console.error('Failed to accept:', error);
      alert('Failed to accept transaction');
    }
  };
  
  if (loading) {
    return <div>Loading Canton Network...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header isConnected={isConnected} />
      <CantonExplainer />
      
      <div className="container mx-auto px-4 py-8">
        <ContractForm 
          parties={parties}
          onSubmit={handleSubmit} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          <PrivacyFilter
            parties={parties}
            selectedParty={selectedParty}
            onChange={setSelectedParty}
          />
          
          <TransactionGrid
            transactions={transactions}
            selectedParty={selectedParty}
            onAccept={handleAccept}
          />
        </div>
      </div>
    </div>
  );
}
```

**Instructions for AI Agent:**

Implement App component with:
- SSE connection with automatic reconnection
- Initial data loading
- State management for transactions and party filter
- Error handling with user feedback
- Loading states

### 6.5 Component Specifications

**Instructions for AI Agent:**

Create the following components with Tailwind CSS styling and lucide-react icons.

**1. Header Component**

```typescript
// File: frontend/src/components/Header.tsx

interface Props {
  isConnected: boolean;
}

// Display:
// - App title: "Canton Privacy Blockchain Demo"
// - Subtitle: "Multi-Party Privacy-Preserving Transactions"
// - Connection indicator: 
//   - Green dot + "Live" if isConnected
//   - Gray dot + "Connecting..." if !isConnected
// - GitHub link (optional)

// Styling: Dark header with white text, fixed top position
```

**2. CantonExplainer Component**

```typescript
// File: frontend/src/components/CantonExplainer.tsx

// Display collapsible/expandable panel explaining:
// 1. What is Canton Network?
//    - Privacy-preserving blockchain
//    - Synchronizer orders transactions
//    - Parties only see their contracts
//
// 2. What makes it different?
//    - Table comparing Ethereum vs Database vs Canton
//    - Ethereum: Public, everyone sees everything
//    - Database: No consensus, no proof
//    - Canton: Privacy + Consensus + Proof
//
// 3. How this demo works
//    - 3 independent banks (participants)
//    - Send payment requests
//    - Receiver must accept (multi-party signatures)
//    - Privacy: only sender/receiver see transaction

// Styling: Light blue background, collapsible with toggle button
```

**3. ContractForm Component**

```typescript
// File: frontend/src/components/ContractForm.tsx

interface Props {
  parties: Party[];
  onSubmit: (data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
  }) => Promise<void>;
}

// Form fields:
// - From: Dropdown (select sender party)
// - To: Dropdown (select receiver party)
// - Amount: Number input with $ prefix
// - Description: Text input (optional)
// - Submit button: "Submit to Canton Network"

// Validation:
// - From and To must be different
// - Amount must be positive number
// - Disable form during submission
// - Show success/error toast

// Styling: White card with shadow, responsive grid layout
```

**4. PrivacyFilter Component**

```typescript
// File: frontend/src/components/PrivacyFilter.tsx

interface Props {
  parties: Party[];
  selectedParty: string | null;
  onChange: (party: string | null) => void;
}

// Display:
// - Title: "Privacy Filter"
// - Info box explaining: "Select a party to see transactions from their perspective"
// - Buttons:
//   - [All Parties] - shows all transactions
//   - [TechBank] - shows only TechBank's transactions
//   - [GlobalCorp] - shows only GlobalCorp's transactions
//   - [RetailFinance] - shows only RetailFinance's transactions
// - Active button highlighted
// - Icon: Eye icon for visual emphasis

// Behavior:
// - Click button calls onChange with party name or null (for All)
// - Active state styled differently

// Styling: Sidebar card with buttons stacked vertically
```

**5. TransactionGrid Component**

```typescript
// File: frontend/src/components/TransactionGrid.tsx

interface Props {
  transactions: Transaction[];
  selectedParty: string | null;
  onAccept: (contractId: string, receiver: string) => Promise<void>;
}

// Display:
// - Title: "Transactions" with count
// - Empty state if no transactions
// - Grid/list of TransactionCard components
// - Each card shows/hides based on privacy filter

// Privacy logic:
// - If selectedParty is null: show all
// - If selectedParty is set: show only if tx.senderDisplayName === selectedParty OR tx.receiverDisplayName === selectedParty
// - Hidden transactions shown with red border and "Hidden" badge

// Styling: Responsive grid (1 column mobile, 2-3 columns desktop)
```

**6. TransactionCard Component**

```typescript
// File: frontend/src/components/TransactionCard.tsx

interface Props {
  transaction: Transaction;
  isVisible: boolean;
  selectedParty: string | null;
  onAccept: (contractId: string, receiver: string) => Promise<void>;
}

// Display:
// - Status badge (pending/committed)
// - Sender → Receiver with arrow icon
// - Amount with currency ($1,000.00 USD)
// - Description
// - Timestamps: Submitted at, Committed at (if committed)
// - Privacy indicators: colored dots for each party
//   - Green dot: party can see transaction
//   - Red dot: party cannot see transaction
// - Canton metadata (expandable):
//   - Transaction ID
//   - Contract ID
//   - Offset (ledger position)
//   - Signatories list
// - Accept button (conditional):
//   - Show ONLY if status === 'pending' AND selectedParty === receiver
//   - Button text: "Accept Payment"
//   - On click: calls onAccept

// Visibility styling:
// - If isVisible: normal border (gray)
// - If !isVisible: red border + opacity 50% + "Hidden from this party" badge

// Styling: White card with shadow, hover effect, responsive layout
```

**7. StatusBadge Component**

```typescript
// File: frontend/src/components/StatusBadge.tsx

interface Props {
  status: 'pending' | 'committed' | 'rejected';
}

// Display status with color-coded badge:
// - pending: Yellow/amber background, "Pending Acceptance"
// - committed: Green background, "Committed"
// - rejected: Red background, "Rejected"

// Include icon:
// - pending: Clock icon
// - committed: CheckCircle icon
// - rejected: XCircle icon

// Styling: Rounded badge with icon + text
```

**8. SystemStatus Component** ⭐ NEW

```typescript
// File: frontend/src/components/SystemStatus.tsx

interface Props {
  isConnected: boolean;
  partyCount: number;
  transactionCount: number;
  lastUpdateTime?: Date;
}

// Display (Expandable/Collapsible Panel):
// - Header: "System Status" with expand/collapse button
// - Summary: Quick overview (collapsed state)
//
// Expanded View shows:
// 1. Backend API Health:
//    - Status indicator (Healthy/Degraded/Down)
//    - Checks every 60 seconds automatically
//    - Shows backend version and last check time
//
// 2. Real-time Connection (SSE):
//    - Green dot + "Connected" or Red dot + "Disconnected"
//    - Updates immediately on connection status change
//    - Shows connection endpoint
//
// 3. Canton Network Status:
//    - Participant count (expects 3)
//    - Status: "All participants operational" or warning
//
// 4. Activity Statistics:
//    - Total transaction count (live updates via SSE)
//    - Last update time (e.g., "2m ago", "just now")
//
// 5. Privacy Notice:
//    - Info box explaining Canton's privacy model
//
// Features:
// - Live polling: Backend health checked every 60 seconds
// - Real-time updates: SSE, transaction count, last update time
// - Responsive design
// - Clear visual indicators (green/yellow/red status)
//
// Styling: White card with shadow, expandable sections, status colors
```

**9. ActivityLog Component** ⭐ NEW

```typescript
// File: frontend/src/components/ActivityLog.tsx

interface Props {
  maxEntries?: number;  // Default: 100
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  category: 'user' | 'system' | 'api' | 'sse' | 'transaction';
  message: string;
  details?: Record<string, any>;
}

// Display (Expandable/Collapsible Panel):
// - Header: "Activity Log" with entry count
// - Collapsed: Shows count and latest entry time
//
// Expanded View shows:
// 1. Filter Controls:
//    - Filter by level: All/Info/Success/Warning/Error
//    - Filter by category: All/User/System/API/SSE/Transaction
//
// 2. Action Buttons:
//    - Export JSON: Download all logs as JSON file
//    - Export CSV: Download all logs as CSV (for Excel)
//    - Clear: Clear all logs (with confirmation)
//
// 3. Log Entries List (scrollable, max 200 entries):
//    - Color-coded by level (blue/green/yellow/red)
//    - Icon for each level (Info/CheckCircle/AlertCircle)
//    - Timestamp (relative: "just now", "5m ago", or full date)
//    - Category badge (USER/SYSTEM/API/SSE/TRANSACTION)
//    - Message text
//    - Expandable details (JSON view of full context)
//
// Features:
// - Auto-logging: All API calls, SSE events, user actions logged automatically
// - Export functionality: JSON and CSV formats for debugging
// - Filtering: By level and category
// - Auto-cleanup: Keeps most recent maxEntries (default 200)
// - Persistent during session: Logs survive component re-renders
//
// Logging Integration:
// - API Client: Logs all HTTP requests/responses
// - App.tsx: Logs SSE connections, transactions, user actions
// - SystemStatus: Can log health check failures
//
// Styling: White card with shadow, scrollable log list, color-coded entries
```

### 6.6 Frontend Configuration Files

**File:** `frontend/package.json`

```json
{
  "name": "canton-privacy-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

**File:** `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**File:** `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'canton-blue': '#0066cc',
        'canton-dark': '#1a202c',
      },
    },
  },
  plugins: [],
}
```

**File:** `frontend/.env`

```bash
REACT_APP_API_URL=http://localhost:3001
```

---

## 7. Deployment

### 7.1 Docker Configuration

**File:** `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**File:** `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**File:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional for production)
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.2 Complete Docker Compose

**File:** `infrastructure/docker-compose.yml` (Complete Version)

```yaml
version: '3.8'

services:
  # Canton synchronizer (domain)
  synchronizer:
    image: digitalasset/canton-community:2.9.0
    container_name: canton-synchronizer
    ports:
      - "5018:5018"  # Public API
      - "5019:5019"  # Admin API
    volumes:
      - ./canton/synchronizer.conf:/canton/synchronizer.conf:ro
      - ./canton/scripts:/canton/scripts:ro
    command: daemon --config /canton/synchronizer.conf --log-level-root=INFO
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "5019"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

  # Participant 1 (TechBank)
  participant1:
    image: digitalasset/canton-community:2.9.0
    container_name: canton-participant1
    ports:
      - "5011:5011"  # Ledger API
      - "5012:5012"  # Admin API
    volumes:
      - ./canton/participant1.conf:/canton/participant1.conf:ro
      - ./canton/scripts:/canton/scripts:ro
    command: daemon --config /canton/participant1.conf --log-level-root=INFO
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "5012"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    depends_on:
      synchronizer:
        condition: service_healthy
    restart: unless-stopped

  # Participant 2 (GlobalCorp)
  participant2:
    image: digitalasset/canton-community:2.9.0
    container_name: canton-participant2
    ports:
      - "5021:5021"  # Ledger API
      - "5022:5022"  # Admin API
    volumes:
      - ./canton/participant2.conf:/canton/participant2.conf:ro
      - ./canton/scripts:/canton/scripts:ro
    command: daemon --config /canton/participant2.conf --log-level-root=INFO
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "5022"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    depends_on:
      synchronizer:
        condition: service_healthy
    restart: unless-stopped

  # Participant 3 (RetailFinance)
  participant3:
    image: digitalasset/canton-community:2.9.0
    container_name: canton-participant3
    ports:
      - "5031:5031"  # Ledger API
      - "5032:5032"  # Admin API
    volumes:
      - ./canton/participant3.conf:/canton/participant3.conf:ro
      - ./canton/scripts:/canton/scripts:ro
    command: daemon --config /canton/participant3.conf --log-level-root=INFO
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "5032"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    depends_on:
      synchronizer:
        condition: service_healthy
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: canton-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - PARTICIPANT1_LEDGER_API=http://participant1:5011
      - PARTICIPANT2_LEDGER_API=http://participant2:5021
      - PARTICIPANT3_LEDGER_API=http://participant3:5031
      # Party IDs loaded from .env file
    env_file:
      - ../backend/.env
    depends_on:
      participant1:
        condition: service_healthy
      participant2:
        condition: service_healthy
      participant3:
        condition: service_healthy
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: canton-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 7.3 Railway.app Deployment

**Step-by-Step Instructions:**

```bash
# 1. Initialize Git repository
cd canton-privacy-demo
git init
git add .
git commit -m "Initial commit: Canton Privacy Demo"

# 2. Create GitHub repository
# (Manual step: Create repo at github.com)
git remote add origin https://github.com/YOUR_USERNAME/canton-privacy-demo.git
git push -u origin main

# 3. Install Railway CLI
npm install -g @railway/cli

# 4. Login to Railway
railway login

# 5. Create new project
railway init

# 6. Deploy infrastructure first
cd infrastructure
railway up

# 7. Run initialization
railway run bash
./init-canton.sh
cat party-ids.json  # Copy party IDs

# 8. Set environment variables in Railway dashboard
# Go to: railway.app → Your Project → Variables
# Add from party-ids.json:
TECHBANK_PARTY_ID=<value>
GLOBALCORP_PARTY_ID=<value>
RETAILFINANCE_PARTY_ID=<value>

# 9. Deploy backend
cd ../backend
railway up

# 10. Deploy frontend
cd ../frontend
railway up

# 11. Link services
# Railway dashboard: Link frontend → backend via internal DNS
```

**Alternative: Fly.io Deployment**

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Deploy each service
cd infrastructure && flyctl launch
cd ../backend && flyctl launch
cd ../frontend && flyctl launch

# 4. Set secrets
flyctl secrets set TECHBANK_PARTY_ID=<value>
flyctl secrets set GLOBALCORP_PARTY_ID=<value>
flyctl secrets set RETAILFINANCE_PARTY_ID=<value>
```

---

## 7.5. Observability & Debugging Features ⭐ NEW

### 7.5.1 System Status Panel

**Purpose:** Live monitoring of all system components for demo presentations and debugging.

**Location:** Below Canton explainer, before transaction form

**What It Shows:**
1. **Backend API Health** (auto-checks every 60 seconds)
   - Status: Healthy / Degraded / Down
   - Backend version and last check timestamp
   - Automatic polling without manual refresh

2. **Real-time Connection Status** (SSE)
   - Live indicator: Connected (green) / Disconnected (red)
   - Updates immediately on connection changes
   - Shows SSE endpoint URL

3. **Canton Network Status**
   - Active participant count (expects 3)
   - Status message based on participant availability

4. **Activity Statistics**
   - Total transaction count (updates in real-time via SSE)
   - Last update time (relative: "just now", "5m ago")

**Benefits for Demo:**
- Proves system is live and operational
- Shows real-time capabilities visibly
- Professional presentation quality
- Builds confidence with recruiters

**Benefits for Debugging:**
- Quick health check without terminal
- Immediate visibility into connection issues
- Canton network status at a glance

---

### 7.5.2 Activity Log System

**Purpose:** Complete operation tracking with export capabilities for debugging and audit trails.

**Location:** Bottom of main page, above footer

**What It Logs:**

1. **API Calls** (all HTTP requests)
   - Method and endpoint
   - Success/failure status
   - Request parameters
   - Response data (summary)

2. **SSE Events** (real-time updates)
   - Connection established/failed
   - Transaction updates received
   - Connection drops

3. **User Actions**
   - Payment request submissions
   - Payment acceptances
   - Filter changes

4. **System Events**
   - Initial data load
   - Backend health check failures
   - Component initialization

**Features:**

1. **Filtering**
   - By level: Info / Success / Warning / Error
   - By category: User / System / API / SSE / Transaction

2. **Export Capabilities**
   - **JSON Export:** Full structured data for technical analysis
   - **CSV Export:** Spreadsheet format for Excel, easy sharing
   - Includes all metadata: timestamps, categories, details

3. **Log Entry Details**
   - Expandable JSON view of full context
   - Request/response parameters
   - Error stack traces
   - Transaction metadata

4. **Auto-Management**
   - Keeps most recent 200 entries (configurable)
   - Timestamp formatting (relative and absolute)
   - Color-coded by severity

**Use Cases:**

1. **Demo Presentation:**
   - Show what's happening under the hood
   - Demonstrate transparency
   - Expand details to show Canton metadata

2. **Debugging:**
   - Export logs when issues occur
   - Share with support or developers
   - Trace API call sequences

3. **Compliance/Audit:**
   - Complete operation history
   - User action tracking
   - Export for record-keeping

**Example Log Entries:**

```
[SUCCESS] API - POST /api/contracts - Success
  Sender: TechBank, Receiver: GlobalCorp, Amount: 1000, ContractId: #001...

[INFO] TRANSACTION - Transaction pending: TechBank → GlobalCorp
  ContractId: #001..., Status: pending, Amount: 1000 USD

[SUCCESS] SSE - Real-time connection established
  Endpoint: http://localhost:3001/api/events

[INFO] USER - Accepting payment request as GlobalCorp
  ContractId: #001..., Receiver: GlobalCorp

[SUCCESS] API - POST /api/contracts/#001.../accept - Success
  ContractId: #001..., Receiver: GlobalCorp

[INFO] TRANSACTION - Transaction committed: TechBank → GlobalCorp
  ContractId: #002..., Status: committed, Amount: 1000 USD
```

**Export Format (JSON):**
```json
{
  "exportDate": "2025-10-16T02:45:00.000Z",
  "totalEntries": 47,
  "logs": [
    {
      "id": "1697423100123-abc",
      "timestamp": "2025-10-16T02:44:55.123Z",
      "level": "success",
      "category": "api",
      "message": "POST /api/contracts - Success",
      "details": {
        "sender": "TechBank",
        "receiver": "GlobalCorp",
        "amount": 1000,
        "contractId": "#001..."
      }
    }
  ]
}
```

---

## 8. Testing & Demo Script

### 8.1 Infrastructure Tests

**Verify Canton Network:**

```bash
# 1. Check all containers running
docker ps --filter "name=canton-" --format "table {{.Names}}\t{{.Status}}"

# Expected output: 4 healthy containers

# 2. Check synchronizer bootstrap
docker logs canton-synchronizer | grep "Domain 'mydomain'"

# 3. Check participant connections
for p in participant1 participant2 participant3; do
  echo "Testing $p..."
  docker exec canton-$p canton daemon \
    --config /canton/$p.conf \
    -c "$p.domains.list_connected()"
done

# Expected output: Each shows "mydomain" as connected

# 4. Check parties exist
docker exec canton-participant1 canton daemon \
  --config /canton/participant1.conf \
  -c "participant1.parties.list()"

# Expected output: TechBank party listed

# 5. Check DAR uploaded
docker exec canton-participant1 canton daemon \
  --config /canton/participant1.conf \
  -c "participant1.dars.list()"

# Expected output: payment-demo-0.0.1
```

### 8.2 Functional Tests

**API Tests:**

```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Get parties
curl http://localhost:3001/api/parties | jq '.'

# 3. Submit transaction
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 1000,
    "description": "Test payment"
  }' | jq '.'

# Expected: Returns transaction with status "pending"

# 4. Query all transactions
curl http://localhost:3001/api/contracts | jq '.'

# 5. Query by party (privacy test)
curl "http://localhost:3001/api/contracts?party=TechBank" | jq '.'
curl "http://localhost:3001/api/contracts?party=RetailFinance" | jq '.'

# Expected: RetailFinance does NOT see TechBank→GlobalCorp transaction
```

### 8.3 Privacy Validation Test

**Test Scenario:**

```bash
# Submit Transaction 1: TechBank → GlobalCorp $1000
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 1000,
    "description": "Invoice #123"
  }'

# Submit Transaction 2: GlobalCorp → RetailFinance $500
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "GlobalCorp",
    "receiver": "RetailFinance",
    "amount": 500,
    "description": "Invoice #456"
  }'

# Verify privacy:
echo "TechBank view:"
curl "http://localhost:3001/api/contracts?party=TechBank" | jq '. | length'
# Expected: 1 (sees only Transaction 1)

echo "GlobalCorp view:"
curl "http://localhost:3001/api/contracts?party=GlobalCorp" | jq '. | length'
# Expected: 2 (sees both transactions)

echo "RetailFinance view:"
curl "http://localhost:3001/api/contracts?party=RetailFinance" | jq '. | length'
# Expected: 1 (sees only Transaction 2)
```

**Expected Visibility Matrix:**

| Transaction | TechBank | GlobalCorp | RetailFinance |
|-------------|----------|------------|---------------|
| Tech→Global | ✓ (sender) | ✓ (receiver) | ✗ (not involved) |
| Global→Retail | ✗ (not involved) | ✓ (sender) | ✓ (receiver) |

### 8.4 Five-Minute Recruiter Demo Script

**File:** `DEMO.md`

```markdown
# Canton Privacy Blockchain Demo Script
**Duration:** 5 minutes | **Audience:** Technical recruiters

## Pre-Demo Setup (Done Before Call)

1. Start all services:
   ```bash
   cd infrastructure && docker-compose up -d
   ./init-canton.sh
   ```

2. Open browser to: http://localhost:3000

3. Verify connection indicator shows "Live" (green dot)

4. Clear any existing transactions (optional fresh start)

---

## Demo Flow

### Part 1: Introduction (30 seconds)

**Say:**
"This is a live Canton Network blockchain demo. You're looking at three independent banks—TechBank, GlobalCorp, and RetailFinance—each running their own blockchain node. They're all connected to a synchronizer that orders transactions without seeing the content. This demonstrates privacy-preserving blockchain technology."

**Show:**
- Point to the three party names in the privacy filter
- Point to the "Live" connection indicator
- Point to the Canton explainer (briefly expand if they seem interested)

---

### Part 2: Submit Payment Request (60 seconds)

**Say:**
"Let me send a payment from TechBank to GlobalCorp. Notice I'm just creating a request—GlobalCorp hasn't signed yet."

**Do:**
1. Select "From: TechBank"
2. Select "To: GlobalCorp"
3. Enter Amount: $1000
4. Description: "Q4 Invoice Payment"
5. Click "Submit to Canton Network"

**Show:**
- Transaction appears instantly (SSE in action)
- Status badge shows "Pending Acceptance" (yellow)
- Point out: "Only TechBank has signed so far"

**Say:**
"Now watch—I'll switch to GlobalCorp's view to accept this payment."

---

### Part 3: Multi-Party Acceptance (60 seconds)

**Say:**
"This is the key blockchain workflow: multiple parties must agree."

**Do:**
1. Click privacy filter: "GlobalCorp"
2. Point to the pending transaction
3. Click "Accept Payment" button
4. Transaction status changes to "Committed" (green)

**Show:**
- Status changes in real-time
- Point to signatories: "TechBank, GlobalCorp" (both signed)
- Point to timestamps: Submitted vs Committed

**Say:**
"Now both parties have signed. This transaction is permanently recorded on Canton's blockchain with cryptographic proof."

---

### Part 4: Privacy Demonstration (90 seconds)

**Say:**
"Here's what makes Canton special: privacy. Let me show you RetailFinance's view."

**Do:**
1. Click privacy filter: "RetailFinance"
2. Transaction disappears or shows as hidden

**Say:**
"See? RetailFinance cannot see this transaction at all. It's not just hidden in the UI—Canton's ledger genuinely doesn't share it with them. This is privacy at the blockchain level."

**Do:**
2. Submit another transaction: GlobalCorp → RetailFinance $500
3. Show that TechBank view: new transaction hidden
4. Show GlobalCorp view: sees both transactions
5. Show RetailFinance view: sees only the new one

**Show (final visualization):**
```
Privacy Matrix:
┌─────────────────┬──────────┬────────────┬───────────────┐
│ Transaction     │ TechBank │ GlobalCorp │ RetailFinance │
├─────────────────┼──────────┼────────────┼───────────────┤
│ Tech→Global     │    ✓     │      ✓     │       ✗       │
│ Global→Retail   │    ✗     │      ✓     │       ✓       │
└─────────────────┴──────────┴────────────┴───────────────┘
```

**Say:**
"Each party only sees contracts they're involved in. This is crucial for financial institutions that need to collaborate without exposing sensitive data."

---

### Part 5: Technical Deep Dive (60 seconds)

**Say:**
"Let me show you what's happening under the hood."

**Do:**
1. Click on a committed transaction to expand details
2. Point out Canton-specific fields:
   - Transaction ID (unique Canton identifier)
   - Offset (ledger position—proves ordering)
   - Signatories (both parties signed)
   - Record time (when synchronizer recorded)

**Say:**
"This is real blockchain data. Every transaction has:
- A unique ID for auditability
- An offset proving its position in the global ledger
- Cryptographic signatures from all parties
- Timestamps from the synchronizer"

**Optional (if time):**
3. Show browser DevTools → Network tab → EventSource connection
4. Point out real-time updates via Server-Sent Events

---

### Part 6: Closing (30 seconds)

**Say:**
"So to recap what you just saw:
1. Real Canton blockchain—not a simulation
2. Multi-party workflow with signature requirements
3. Privacy preserved at the ledger level
4. Global ordering without exposing content
5. Full-stack implementation: React, TypeScript, Node.js, Daml smart contracts"

**Show (if they ask about code):**
- Open GitHub repository
- Show project structure
- Point out: Daml contracts, Canton configuration, SSE implementation

**Invite questions:**
"Any questions about the architecture or implementation?"

---

## Common Questions & Answers

**Q: Is this using a public blockchain?**
A: "No, it's Canton Community Edition running locally in Docker. But the same code works on Canton Network's production infrastructure used by banks and financial institutions."

**Q: How does privacy actually work?**
A: "Canton uses sub-transaction privacy. Each participant only receives the contracts they're involved in. The synchronizer orders transactions without decrypting them. It's like end-to-end encryption for blockchain."

**Q: What happens if a party rejects?**
A: "Good question. The PaymentRequest contract has a Reject choice. If the receiver exercises it, the request is archived and no Payment contract is created. Let me show you..." (Demo reject flow if time permits)

**Q: How long did this take to build?**
A: "About 7 days following these requirements. The Canton integration was the complex part—everything else is standard web development. I can walk you through the architecture if you'd like."

**Q: Can this scale?**
A: "Absolutely. Canton is designed for production use. This demo uses in-memory storage for simplicity, but production deployments use PostgreSQL and can handle thousands of transactions per second. The architecture is already multi-node."

---

## Troubleshooting

**If SSE connection fails:**
- Refresh browser
- Check backend logs: `docker logs canton-backend`
- Verify backend is running: `curl http://localhost:3001/health`

**If transaction doesn't appear:**
- Check browser console for errors
- Verify Canton participants are healthy: `docker ps`
- Query ledger directly: `curl http://localhost:3001/api/contracts`

**If privacy filter doesn't work:**
- Verify party IDs are correct in backend/.env
- Check backend logs for authentication errors
- Re-run init-canton.sh if needed

---

## Post-Demo

**If they want to try it:**
1. Share GitHub repository link
2. Point to README with setup instructions
3. Offer to answer questions via email

**If they want to see code:**
1. Show Daml smart contracts (Payment.daml)
2. Show backend Canton integration (ledger-client.ts)
3. Show frontend SSE implementation (App.tsx)

**If they want architecture diagrams:**
1. Share requirements document
2. Explain two-template pattern (PaymentRequest → Payment)
3. Discuss synchronizer ordering and privacy model
```

---

## 9. AI Agent Implementation Guide

### 9.1 Phase-by-Phase Instructions

**NOTE:** This guide was written for Canton 2.9.0. **The actual implementation uses Canton 2.7.6** with different initialization approach. See `IMPLEMENTATION_PLAN.md` and `CANTON_SUCCESS_SUMMARY.md` for current development status.

**Phase 1: Infrastructure (Day 1-2)** ✅ COMPLETE (Actual Implementation)

**Actual Tasks Completed:**
1. ✅ Created all Canton configuration files (Canton 2.7.6 syntax)
2. ✅ Created docker-compose.yml with `digitalasset/canton-open-source:latest` (2.7.6)
3. ✅ Created Canton remote console scripts (2.7.6 API)
4. ✅ Created `init-canton-final.ps1` with automated party ID extraction
5. ✅ All containers running healthy
6. ✅ Canton fully initialized with real party IDs

**Actual Verification (October 15, 2025):**
```powershell
# Check containers
docker ps  # All 4 containers healthy ✅

# Verify initialization
Get-Content infrastructure/canton/party-ids.json  # Real party IDs ✅

# Re-initialize if needed
.\infrastructure\init-canton-final.ps1
```

**Original Plan (Canton 2.9.0 - Reference Only):**

**Tasks:**
1. Create all Canton configuration files exactly as specified
2. Create docker-compose.yml with official Canton image
3. Create Canton console scripts with correct 2.9.0 syntax
4. Create init-canton.sh with automated party ID extraction
5. Test: All containers start healthy

**Verification:**
```bash
docker-compose up -d
docker ps  # All 4 containers healthy
./init-canton.sh
cat party-ids.json  # Valid JSON with 3 party IDs
```

**Success Criteria (Actual Implementation):**
- [X] All 4 Canton containers running ✅
- [X] Synchronizer auto-bootstrapped successfully ✅
- [X] All 3 participants connected to domain ✅
- [X] Real party IDs extracted to JSON file ✅
- [X] No errors in docker logs ✅

---

**Phase 2: Smart Contracts (Day 3)** ✅ COMPLETE (Actual Implementation)

**Actual Tasks Completed:**
1. ✅ Created daml.yaml with SDK version 2.7.6 (matches Canton)
2. ✅ Created Payment.daml with two templates
3. ✅ Built DAR file successfully
4. ✅ DAR file verified and uploaded to all participants

**Actual Verification (October 15, 2025):**
```powershell
cd daml
daml build  # ✅ Success
ls .daml/dist/payment-demo-0.0.1.dar  # ✅ 243 KB
```

**Original Plan (Canton 2.9.0 - Reference Only):**

**Tasks:**
1. Create daml.yaml with SDK version 2.9.0
2. Create Payment.daml with two templates
3. Build DAR file
4. Verify DAR file created

**Verification:**
```bash
cd daml
daml build
ls -lh .daml/dist/payment-demo-0.0.1.dar
daml damlc inspect-dar .daml/dist/payment-demo-0.0.1.dar
```

**Success Criteria (Actual Implementation):**
- [X] DAR file builds without errors ✅
- [X] Both templates present in DAR ✅
- [X] File size: 243 KB ✅
- [X] Uploaded to all 3 participants ✅

---

**Phase 3: Backend (Day 4-5)** 🚀 READY TO START

**Current Status (October 15, 2025):**
- ✅ Canton fully initialized with real party IDs
- ✅ All infrastructure ready
- 🚀 Backend development can begin
- 📖 See `IMPLEMENTATION_PLAN.md` Phase 3 for detailed steps

**Tasks:**
1. Install dependencies (`@daml/ledger`, express, etc.)
2. Create types.ts with interfaces
3. Implement ledger-client.ts with JWT generation
4. Implement routes: contracts.ts, parties.ts, events.ts
5. Create server.ts with all routes mounted
6. Update .env with real party IDs from `infrastructure/canton/party-ids.json`
7. Test each endpoint with curl

**Verification:**
```bash
cd backend
npm install
npm run dev

# In another terminal:
curl http://localhost:3001/health
curl http://localhost:3001/api/parties
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{"sender":"TechBank","receiver":"GlobalCorp","amount":100,"description":"Test"}'
```

**Success Criteria:**
- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Parties endpoint returns 3 parties
- [ ] POST contracts creates PaymentRequest in Canton
- [ ] POST contracts/:id/accept creates Payment in Canton
- [ ] SSE endpoint accepts connections
- [ ] Extensive logging present for debugging

---

**Phase 4: Frontend (Day 6)**

**Tasks:**
1. Install dependencies (React, lucide-react, etc.)
2. Create types.ts matching backend
3. Create API client
4. Implement App.tsx with SSE connection
5. Create all 7 components (Header, Form, Filter, Grid, Card, Badge, Explainer)
6. Configure Tailwind CSS
7. Test end-to-end flow

**Verification:**
```bash
cd frontend
npm install
npm run dev

# Open http://localhost:5173 in browser
# Test:
# 1. Connection indicator shows "Live"
# 2. Submit transaction
# 3. Transaction appears instantly
# 4. Accept button visible to receiver
# 5. Privacy filter hides/shows correctly
```

**Success Criteria:**
- [ ] SSE connection established (green indicator)
- [ ] Form submission works
- [ ] Transactions appear in real-time (<1s)
- [ ] Accept button functional
- [ ] Privacy filter works correctly
- [ ] Mobile responsive
- [ ] No console errors

---

**Phase 5: Polish & Testing (Day 7)**

**Tasks:**
1. Add loading states to all components
2. Add error handling with user-friendly messages
3. Add toast notifications for success/error
4. Test privacy matrix thoroughly
5. Test multi-party accept flow
6. Write demo script
7. Create README
8. Record demo video (optional)

**Verification:**
- Run all tests from Section 8
- Follow demo script end-to-end
- Check all success criteria from all phases

**Success Criteria:**
- [ ] All infrastructure tests pass
- [ ] All functional tests pass
- [ ] Privacy validation matrix correct
- [ ] Demo script works smoothly in <5 minutes
- [ ] No obvious bugs or UI glitches
- [ ] README clear and complete

---

### 9.2 Critical Success Criteria Checklist

**Before considering project complete, verify ALL of these:**

**Infrastructure:**
- [ ] Canton 2.9.0 image pulls successfully
- [ ] All 4 containers healthy within 60 seconds
- [ ] Synchronizer domain bootstrapped
- [ ] All participants connected to domain
- [ ] Party IDs extracted automatically to JSON
- [ ] DAR uploaded to all participants
- [ ] No manual copy-paste required

**Smart Contracts:**
- [ ] PaymentRequest template has Accept choice
- [ ] Payment template has both signatories
- [ ] DAR builds without errors
- [ ] Templates visible in Canton

**Backend:**
- [ ] Queries Canton ledger directly (no cache)
- [ ] JWT tokens generated correctly
- [ ] POST /contracts creates PaymentRequest
- [ ] POST /contracts/:id/accept creates Payment
- [ ] GET /contracts respects party parameter
- [ ] SSE broadcasts transactions
- [ ] Environment variables loaded from .env
- [ ] Party IDs with fingerprints handled correctly

**Frontend:**
- [ ] SSE connection auto-reconnects
- [ ] Transactions appear in <100ms
- [ ] Accept button only for receiver
- [ ] Privacy filter hides/shows correctly
- [ ] Status badges color-coded
- [ ] Mobile responsive
- [ ] Loading states present
- [ ] Error handling with user feedback

**Integration:**
- [ ] End-to-end flow: Submit → Accept → Committed
- [ ] Privacy matrix correct (see Section 8.3)
- [ ] Multiple transactions don't interfere
- [ ] Real-time updates work for all clients
- [ ] Demo script completes in <5 minutes

---

## 10. Appendices

### 10.1 File Checklist

**Total: 35 files, 6 Docker containers**

```
✓ infrastructure/
  ✓ docker-compose.yml (complete with all 6 services)
  ✓ init-canton.sh (with automated JSON extraction)
  ✓ party-ids.json (AUTO-GENERATED)
  ✓ canton/
    ✓ synchronizer.conf
    ✓ participant1.conf
    ✓ participant2.conf
    ✓ participant3.conf
    ✓ scripts/
      ✓ bootstrap-domain.sc
      ✓ connect-participant.sc (2.9.0 syntax)
      ✓ create-parties.sc (JSON output)
      ✓ upload-dar.sc

✓ daml/
  ✓ daml.yaml (SDK 2.9.0)
  ✓ Payment.daml (two templates)

✓ backend/
  ✓ package.json (with @daml/ledger 2.9.0)
  ✓ tsconfig.json
  ✓ .env (party IDs from JSON)
  ✓ Dockerfile
  ✓ src/
    ✓ server.ts (Express + SSE)
    ✓ types.ts
    ✓ canton/
      ✓ ledger-client.ts (queries Canton directly)
    ✓ routes/
      ✓ Header.tsx
      ✓ ContractForm.tsx
      ✓ PrivacyFilter.tsx
      ✓ TransactionGrid.tsx
      ✓ TransactionCard.tsx
      ✓ StatusBadge.tsx
      ✓ CantonExplainer.tsx

✓ DEMO.md (5-minute recruiter script)
✓ README.md
```

### 10.2 Canton Community Edition License - PUBLIC DEPLOYMENT ALLOWED ✅

**LICENSE VERIFICATION:**

Canton Community Edition is licensed under **Apache License 2.0** (verified from GitHub repository).

**What This Means for Public Deployment:**
- ✅ **Commercial use allowed** - You can deploy publicly and even charge for access
- ✅ **Distribution allowed** - You can share your deployment URL freely
- ✅ **Modification allowed** - You can modify Canton code if needed (not required for this project)
- ✅ **Patent grant** - Apache 2.0 includes express patent license
- ✅ **No attribution required in running software** - Only in source code

**Requirements:**
- Include copy of Apache License 2.0 in your repository (done automatically when you clone Canton)
- Include NOTICE file if present (Canton includes this)
- Don't claim your demo is endorsed by Digital Asset

**Bottom Line:** You can absolutely deploy this publicly and share the URL with recruiters. Canton Community Edition is free and open source specifically for this purpose.

**References:**
- Canton GitHub: https://github.com/digital-asset/canton (Apache 2.0 license)
- Apache 2.0 FAQ: https://www.apache.org/foundation/license-faq.html
- "We do not distinguish between personal, internal, or commercial use" - Apache Foundation

---

### 10.3 Always-On Public Deployment (Detailed Guide)

**Target:** `https://your-canton-demo.railway.app` - accessible to anyone, 24/7

**Monthly Cost:** $20-30 (Railway.app) or $25-35 (Fly.io)

**Deployment Time:** 2-3 hours initial setup, then automated

---

## Railway.app Deployment (RECOMMENDED - Simplest)

### Prerequisites

```bash
# Install Railway CLI
npm install -g @railway/cli

# Verify installation
railway --version
```

### Step 1: Prepare Your Repository

```bash
# 1. Initialize Git repository
cd canton-privacy-demo
git init
git add .
git commit -m "Initial commit: Canton Privacy Demo"

# 2. Create GitHub repository (via GitHub website)
# Name: canton-privacy-demo
# Visibility: Public or Private (your choice)

# 3. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/canton-privacy-demo.git
git branch -M main
git push -u origin main
```

### Step 2: Build Daml Contracts

```bash
# Build .dar file locally first
cd daml
daml build

# Verify .dar file created
ls -lh .daml/dist/payment-demo-0.0.1.dar
# Should see ~50-100KB file

cd ..
```

### Step 3: Railway Project Setup

```bash
# 1. Login to Railway
railway login
# Opens browser for authentication

# 2. Create new project
railway init
# Select: "Empty Project"
# Name: canton-privacy-demo

# 3. Link to GitHub repo
railway link
# Select your canton-privacy-demo repository
```

### Step 4: Create Railway Services

**Railway supports multi-container deployment via Docker Compose.**

**Create:** `railway.json` in project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "infrastructure/Dockerfile.railway"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Create:** `infrastructure/Dockerfile.railway` (Multi-stage build):

```dockerfile
# Stage 1: Canton Infrastructure
FROM digitalasset/canton-community:2.9.0 as canton-base

# Stage 2: Backend Build
FROM node:20-alpine as backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Frontend Build
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 4: Final Runtime (All Services)
FROM digitalasset/canton-community:2.9.0

# Install Node.js for backend
RUN apt-get update && apt-get install -y \
    curl \
    nginx \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy Canton configurations
COPY infrastructure/canton/ /canton/

# Copy built backend
COPY --from=backend-build /app/backend/dist /app/backend/dist
COPY --from=backend-build /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-build /app/backend/package.json /app/backend/

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html/
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Daml contracts
COPY daml/.daml/dist/*.dar /canton/

# Copy initialization scripts
COPY infrastructure/init-canton.sh /
COPY infrastructure/start-all-services.sh /
RUN chmod +x /*.sh

# Expose all ports
EXPOSE 5011 5012 5021 5022 5031 5032 5018 5019 3001 80

# Start all services
CMD ["/start-all-services.sh"]
```

**Create:** `infrastructure/start-all-services.sh`:

```bash
#!/bin/bash
set -e

echo "Starting Canton Privacy Demo - All Services"

# Start Canton synchronizer in background
canton daemon --config /canton/synchronizer.conf --log-level-root=INFO &
SYNC_PID=$!

# Wait for synchronizer
sleep 30

# Start participants in background
canton daemon --config /canton/participant1.conf --log-level-root=INFO &
PART1_PID=$!

canton daemon --config /canton/participant2.conf --log-level-root=INFO &
PART2_PID=$!

canton daemon --config /canton/participant3.conf --log-level-root=INFO &
PART3_PID=$!

# Wait for participants
sleep 30

# Run initialization (only once)
if [ ! -f /canton/initialized.flag ]; then
    echo "Running first-time initialization..."
    /init-canton.sh
    touch /canton/initialized.flag
fi

# Start backend
cd /app/backend
node dist/server.js &
BACKEND_PID=$!

# Start nginx for frontend
nginx -g "daemon off;" &
NGINX_PID=$!

# Keep container running
wait $SYNC_PID $PART1_PID $PART2_PID $PART3_PID $BACKEND_PID $NGINX_PID
```

### Step 5: Deploy to Railway

```bash
# Deploy from root directory
railway up

# Railway will:
# 1. Build Docker image (10-15 minutes first time)
# 2. Deploy container
# 3. Assign public URL
```

### Step 6: Configure Environment Variables

```bash
# After first deployment, get party IDs from logs
railway logs

# Look for output from init-canton.sh:
# === PARTY IDS JSON ===
# {"TechBank":"TechBank::1220...","GlobalCorp":...}
# === END PARTY IDS ===

# Set environment variables in Railway dashboard
railway variables set TECHBANK_PARTY_ID="TechBank::122089abc..."
railway variables set GLOBALCORP_PARTY_ID="GlobalCorp::12207def..."
railway variables set RETAILFINANCE_PARTY_ID="RetailFinance::1220ghi..."

# Or set all at once via CLI
railway variables set \
  TECHBANK_PARTY_ID="..." \
  GLOBALCORP_PARTY_ID="..." \
  RETAILFINANCE_PARTY_ID="..."

# Railway will automatically redeploy
```

### Step 7: Get Your Public URL

```bash
# Get assigned domain
railway domain

# Output: your-canton-demo.railway.app

# Or set custom domain
railway domain add your-custom-domain.com
```

### Step 8: Verify Deployment

```bash
# Check health
curl https://your-canton-demo.railway.app/api/health

# Check parties
curl https://your-canton-demo.railway.app/api/parties

# Submit test transaction
curl -X POST https://your-canton-demo.railway.app/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 1000,
    "description": "Test payment"
  }'

# Open in browser
open https://your-canton-demo.railway.app
```

### Railway Dashboard Management

**Access Dashboard:**
```bash
railway open
# or visit: https://railway.app/dashboard
```

**Monitor Resources:**
- CPU usage: ~50-70% (4 Canton containers + backend)
- Memory: 2-3GB (will scale automatically)
- Network: Minimal (only when demo accessed)

**View Logs:**
```bash
# Real-time logs
railway logs

# Specific service logs
railway logs --filter "Canton"
railway logs --filter "backend"
```

**Cost Monitoring:**
- View current usage: Railway Dashboard → Usage tab
- Expected: $20-30/month for always-on
- $5 free credits per month included

---

## Fly.io Deployment (Alternative)

### Prerequisites

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login
```

### Step 1: Create Fly.toml

**File:** `fly.toml` in project root:

```toml
app = "canton-privacy-demo"
primary_region = "iad"  # US East

[build]
  dockerfile = "infrastructure/Dockerfile.railway"

[[services]]
  internal_port = 80
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 3001

[env]
  NODE_ENV = "production"
  PARTICIPANT1_LEDGER_API = "http://localhost:5011"
  PARTICIPANT2_LEDGER_API = "http://localhost:5021"
  PARTICIPANT3_LEDGER_API = "http://localhost:5031"

[compute]
  memory = "4096mb"  # 4GB for Canton containers
  cpus = 2
```

### Step 2: Deploy to Fly.io

```bash
# Create app
flyctl apps create canton-privacy-demo

# Deploy
flyctl deploy

# Set secrets (party IDs)
flyctl secrets set \
  TECHBANK_PARTY_ID="..." \
  GLOBALCORP_PARTY_ID="..." \
  RETAILFINANCE_PARTY_ID="..."

# Get URL
flyctl info
# Output: https://canton-privacy-demo.fly.dev
```

### Step 3: Monitor Fly.io

```bash
# View logs
flyctl logs

# Check status
flyctl status

# SSH into container (debugging)
flyctl ssh console

# Scale (if needed)
flyctl scale memory 4096  # Increase to 4GB
```

---

## Deployment Comparison

| Feature | Railway.app | Fly.io |
|---------|------------|--------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ Easiest | ⭐⭐⭐⭐ Easy |
| **Monthly Cost** | $20-30 | $25-35 |
| **Free Tier** | $5/month credit | Limited free tier |
| **Multi-Container** | ✅ Native support | ✅ Dockerfile |
| **Auto-Deploy** | ✅ GitHub integration | ✅ GitHub Actions |
| **Custom Domains** | ✅ Free | ✅ Free |
| **Dashboard UI** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Logs** | Real-time, searchable | Real-time, CLI-based |
| **SSL/HTTPS** | ✅ Automatic | ✅ Automatic |

**Recommendation:** Use Railway.app for simplest setup and best dashboard.

---

## Troubleshooting Deployment Issues

### Issue: "Out of Memory" Error

```bash
# Railway: Increase memory limit
# Dashboard → Settings → Resources → Memory: 4GB

# Fly.io: Scale memory
flyctl scale memory 4096
```

### Issue: Party IDs Not Found

```bash
# SSH into Railway container
railway run bash

# Check party-ids.json exists
cat /canton/party-ids.json

# If missing, run init script manually
/init-canton.sh

# Copy party IDs to Railway variables
```

### Issue: Canton Containers Not Starting

```bash
# Check logs
railway logs --filter "Canton"

# Common causes:
# 1. Memory too low (need 4GB+)
# 2. Ports already in use (shouldn't happen in Docker)
# 3. Config files missing

# Verify config files in repo
ls infrastructure/canton/*.conf
```

### Issue: Backend Can't Connect to Canton

```bash
# Check environment variables set correctly
railway variables

# Verify PARTICIPANT*_LEDGER_API URLs point to localhost
# (all services in same container)
PARTICIPANT1_LEDGER_API=http://localhost:5011
```

### Issue: Frontend Not Loading

```bash
# Check nginx running
railway run bash
ps aux | grep nginx

# Check frontend files deployed
ls /usr/share/nginx/html/

# Verify nginx config
cat /etc/nginx/conf.d/default.conf
```

---

## Post-Deployment: Sharing with Recruiters

### Your Public URL

```
Frontend: https://your-canton-demo.railway.app
Backend API: https://your-canton-demo.railway.app/api
Health Check: https://your-canton-demo.railway.app/api/health
```

### Add to Resume/LinkedIn

```
Canton Privacy Blockchain Visualizer
• Privacy-preserving multi-party blockchain demo using Canton Network
• Live Demo: https://your-canton-demo.railway.app
• Source Code: https://github.com/YOUR_USERNAME/canton-privacy-demo
• Tech Stack: Canton 2.9.0, Daml, React, TypeScript, Node.js, Docker
```

### Share with Recruiters

**Email Template:**

```
Subject: Canton Blockchain Demo - [Your Name]

Hi [Recruiter Name],

I've built a live demonstration of privacy-preserving blockchain technology using Digital Asset's Canton Network.

🔗 Live Demo: https://your-canton-demo.railway.app
📦 Source Code: https://github.com/YOUR_USERNAME/canton-privacy-demo

Key Features:
• Real Canton blockchain (not a simulation)
• 3 independent participant nodes
• Sub-transaction privacy (parties only see their contracts)
• Multi-party signature requirements
• Real-time updates via Server-Sent Events

Technical Stack:
• Blockchain: Canton Community 2.9.0
• Smart Contracts: Daml
• Backend: Node.js + TypeScript + Express
• Frontend: React + TypeScript + TailwindCSS
• Infrastructure: Docker + Railway.app

Try it out:
1. Submit a payment from TechBank to GlobalCorp
2. Switch to RetailFinance view - transaction disappears (privacy!)
3. Click "Accept" to complete the multi-party signature flow

The full source code and setup instructions are on GitHub.

Looking forward to discussing blockchain development opportunities!

Best regards,
[Your Name]
```

---

## Ongoing Maintenance

### Monitor Usage (Avoid Surprise Bills)

```bash
# Railway: Check usage dashboard daily
# Visit: https://railway.app/dashboard → Usage

# Set up billing alerts
# Dashboard → Settings → Billing → Alerts
# Alert at: $25 (before hitting $30 limit)
```

### Update Deployment

```bash
# Make changes locally
git add .
git commit -m "Update: [description]"
git push origin main

# Railway auto-deploys from GitHub
# Or manually:
railway up
```

### Pause Deployment (Stop Costs)

```bash
# Railway: Pause project
railway down

# Fly.io: Scale to zero
flyctl scale count 0

# Resume later
railway up  # or: flyctl scale count 1
```

### Destroy Deployment (Permanent)

```bash
# Railway: Delete project
railway delete

# Fly.io: Delete app
flyctl apps destroy canton-privacy-demo
```

---

## Expected Costs (Always-On)

| Service | Railway.app | Fly.io |
|---------|-------------|--------|
| **Compute** | $15-20/month | $20-25/month |
| **Memory (4GB)** | Included | $5-7/month |
| **Bandwidth** | $5-8/month | $3-5/month |
| **SSL/Domain** | Free | Free |
| **Total** | **$20-30/month** | **$25-35/month** |

**Free Credits:**
- Railway: $5/month included
- Fly.io: Limited free tier (not enough for this project)

**Cost Optimization:**
- Only runs when accessed (minimal traffic = lower bandwidth costs)
- Data in-memory (no database costs)
- Single container deployment (simpler than multi-service)

---

## Final Checklist Before Going Live

### Pre-Deployment

- [ ] Daml contracts build successfully (`daml build`)
- [ ] All config files created (4 Canton configs)
- [ ] Docker Compose works locally
- [ ] Init script runs without errors
- [ ] Party IDs extracted to JSON
- [ ] Backend connects to Canton
- [ ] Frontend displays transactions
- [ ] Privacy filter works correctly
- [ ] Accept flow completes successfully

### Post-Deployment

- [ ] Public URL accessible
- [ ] Health endpoint returns 200
- [ ] Can submit transaction via API
- [ ] Can accept transaction via API
- [ ] Frontend loads correctly
- [ ] SSE connection established
- [ ] Privacy demonstration works
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] HTTPS enabled (automatic)

### Share with Recruiters

- [ ] URL added to resume
- [ ] URL added to LinkedIn
- [ ] GitHub repo public and documented
- [ ] README includes live demo link
- [ ] Demo script works smoothly
- [ ] Can explain technical decisions
- [ ] Monitoring/alerts configured

---

**END OF ALWAYS-ON DEPLOYMENT GUIDE**

**Summary:**
1. ✅ Canton Community Edition (Apache 2.0) - fully allowed for public deployment
2. ✅ Railway.app recommended - simplest setup, $20-30/month
3. ✅ All services in single Docker container - reduces complexity
4. ✅ Automatic SSL and domain - professional URL
5. ✅ GitHub integration - push to deploy
6. ✅ Share URL directly with recruiters - no video recording needed

**Your always-on public demo will be live at:** `https://your-canton-demo.railway.app`



| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | Infrastructure setup (Docker configs, no building) | 3 |
| 2 | Canton initialization + automated party IDs | 3 |
| 3 | Daml contracts + testing | 4 |
| 4-5 | Backend (direct Canton queries + SSE) | 8 |
| 6 | Frontend (SSE connection + components) | 6 |
| 7 | Testing + demo recording + documentation | 4 |
| **Bonus** | Deploy to Railway (if needed) | +2 |
| **Total** | **MVP with recorded demo** | **28-30 hours** |

---

### 10.7 What Actually Impresses Recruiters

**From my experience reviewing candidates:**

**Top Tier (Guaranteed Interview):**
1. ✅ Clean, professional recorded demo (5 min)
2. ✅ Well-documented GitHub repo
3. ✅ Clear README with setup instructions
4. ✅ Can articulate technical decisions

**Good Tier (Strong Consideration):**
1. ✅ Live deployed app (if stable)
2. ✅ Comprehensive test coverage
3. ✅ Production-ready code quality

**Less Important Than You Think:**
- Having it "always on" (video is fine)
- Perfect UI design (functional is enough)
- Complex features (MVP is better than incomplete)

**What Matters Most:**
- Can you explain WHY you made technical choices?
- Can you walk through the code confidently?
- Does it actually work when you demo it?
- Is the code readable and well-structured?

---

### 10.8 Critical Success Factors

**Must Get Right:**
1. ✅ Canton 2.9.0 official image (no building)
2. ✅ Automated party ID extraction
3. ✅ Direct Canton queries (no cache drift)
4. ✅ SSE for real-time updates (<100ms)
5. ✅ Two-step Accept flow (demonstrates blockchain)
6. ✅ Privacy filter works correctly
7. ✅ 5-minute demo script practiced and smooth
8. ✅ Recorded demo is professional quality

**Common Pitfalls to Avoid:**
- ❌ Building Canton from source (will fail)
- ❌ Manual party ID copy-paste (error-prone)
- ❌ Auto-accept pattern (defeats blockchain purpose)
- ❌ Polling instead of SSE (feels slow)
- ❌ Cache instead of Canton queries (defeats "blockchain" claim)
- ❌ Deploying before testing locally (waste of money)

---

## Conclusion

**For Your Use Case (Recruiter Portfolio):**

1. **Primary:** Record professional Loom demo (FREE)
   - Follow Section 8.4 demo script
   - Upload to Loom
   - Add to resume/LinkedIn

2. **Secondary:** Push to GitHub with excellent README (FREE)
   - Clear setup instructions
   - Architecture explanation
   - Link to demo video

3. **Optional:** Deploy on-demand for live interviews ($5-10 per interview)
   - Railway.app or Fly.io
   - Deploy 24 hours before interview
   - Destroy after interview

**Total Cost:** $0 for most use cases, $5-10 per interview if they want live demo

**Expected Result:** Recruiters watch video, review GitHub code, invite you to technical interview.

---

**END OF REQUIREMENTS DOCUMENT v2.0**

**For AI Agent Implementing This:**
- Focus on local development first (free)
- Ensure demo script works smoothly
- Record professional demo video
- Deployment is optional based on budget
- Prioritize code quality over constant uptime