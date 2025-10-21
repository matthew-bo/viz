# Canton Privacy Blockchain Demo Script

**Duration:** 5 minutes  
**Audience:** Technical recruiters, hiring managers, blockchain engineers  
**Goal:** Demonstrate Canton's privacy-preserving blockchain with multi-party workflows

---

## Pre-Demo Checklist (2 minutes before call)

### Environment Setup:
- [ ] Docker Desktop running (minimum 8GB RAM allocated)
- [ ] Canton containers healthy: `docker-compose ps` (4 containers "Up")
- [ ] Backend running: `curl http://localhost:3001/health` returns `{"status":"healthy"}`
- [ ] Frontend accessible: Open `http://localhost:3000` 
- [ ] "Live" connection indicator shows green dot
- [ ] Clear previous test transactions (optional): Restart backend

### Browser Setup:
- [ ] Open `http://localhost:3000` in browser
- [ ] Open Browser DevTools (F12) → Network tab
- [ ] Filter to "EventSource" to show SSE connection
- [ ] Have Activity Log visible (expand panel at bottom)

### Backup Plan:
- [ ] Have screenshots ready if live demo fails
- [ ] Know how to restart containers: `docker-compose restart`
- [ ] Have GitHub repo link ready: `https://github.com/YOUR_USERNAME/canton-privacy-demo`

---

## Demo Flow

### **Minute 1: Introduction (30 seconds)**

**SAY:**
"This is a live Canton blockchain network with three independent financial institutions: TechBank, GlobalCorp, and RetailFinance. Each runs a separate blockchain node in its own Docker container. They're all connected to a synchronizer that orders transactions globally—but here's the key innovation—the synchronizer sequences messages without ever decrypting them."

**SHOW:**
1. Point to Privacy Filter showing 3 parties
2. Point to "Live" indicator (green dot) → "Real-time connection via Server-Sent Events"
3. Point to System Status panel:
   - Backend API: Healthy
   - Real-time Connection: Connected  
   - Canton Network: 3 participants operational

**WHY THIS MATTERS:**
Sets up the key value prop: physical separation + privacy + global ordering

---

### **Minute 2: Multi-Party Workflow (60 seconds)**

**SAY:**
"Let me create a payment request from TechBank to GlobalCorp for $1,000. Watch closely—this is just a *request*. Only TechBank has signed so far. GlobalCorp must explicitly accept before the payment is committed."

**DO:**
1. Fill form:
   - From: **TechBank**
   - To: **GlobalCorp**
   - Amount: **1000**
   - Description: **"Q4 Invoice Payment"**
2. Click **"Submit to Canton Network"**
3. **Pause for effect** (transaction appears in <100ms)

**SHOW:**
- Transaction card appears instantly
- Status badge: **Yellow "Pending Acceptance"**
- Click to expand Canton Metadata section:
  - Transaction ID: `00a1b2c3...`
  - Ledger Offset: Proof of global ordering
  - Signatories: Only TechBank (1 signature)
  - Point out: "Notice GlobalCorp is an *observer*, not a signatory yet"

**SAY:**
"This is blockchain's multi-party workflow. TechBank has proposed, but GlobalCorp hasn't agreed. The contract exists on Canton's ledger in 'pending' state. No central authority can force acceptance."

---

### **Minute 3: Accept Payment (60 seconds)**

**SAY:**
"Now I'll switch to GlobalCorp's perspective. Watch for the Accept button—only the receiver can accept payments. Canton enforces this at the blockchain level through Daml smart contracts."

**DO:**
1. Click **"View As: GlobalCorp"** in Privacy Filter
2. Transaction appears with **"Accept Payment"** button
3. Click **"Accept Payment"**
4. **Pause** - watch status change in real-time

**SHOW:**
- Status badge changes: Yellow → **Green "Committed"**
- New timestamp appears: **"Committed at: [timestamp]"**
- Expand metadata again:
  - Signatories: **TechBank AND GlobalCorp** (2 signatures)
  - Contract ID changes (PaymentRequest → Payment)
  - Point to Activity Log: Shows full operation history

**SAY:**
"Now both parties have signed. This transaction is permanently recorded on Canton's blockchain with cryptographic proof. The Payment contract is immutable—it can never be changed or deleted."

---

### **Minute 4: Privacy Demonstration (90 seconds)**

**SAY:**
"Here's what makes Canton different from traditional blockchains like Ethereum or Bitcoin. Let me show you RetailFinance's view."

**DO:**
1. Click **"View As: RetailFinance"** in Privacy Filter
2. **Pause for effect** - transaction disappears
3. Click back to **"All Parties"** - transaction reappears
4. Click **"View As: TechBank"** - transaction visible

**SAY:**
"RetailFinance literally cannot see this transaction. This isn't just UI filtering or access control—Canton's ledger genuinely doesn't share the encrypted transaction data with them. Let me prove it."

**SHOW (Advanced - Optional):**
```powershell
# Open PowerShell terminal
cd infrastructure
docker-compose logs participant3 | Select-String "GlobalCorp"
# No results - RetailFinance participant has no record

docker-compose logs participant1 | Select-String "GlobalCorp"  
# Shows transaction - TechBank participant has record
```

**SAY:**
"This is true privacy-preserving blockchain. Unlike Ethereum where every node sees every transaction, Canton only reveals contracts to involved parties. Each institution maintains sovereign control over their data while still achieving global consensus on transaction ordering."

**CREATE VISUAL CONTRAST:**
- Submit second transaction: **GlobalCorp → RetailFinance, $500**
- Show how each party sees different subsets:
  - TechBank: Sees only TechBank→GlobalCorp
  - GlobalCorp: Sees BOTH transactions (involved in both)
  - RetailFinance: Sees only GlobalCorp→RetailFinance

**PRIVACY MATRIX:**
```
Transaction          TechBank  GlobalCorp  RetailFinance
Tech→Global             ✓         ✓            ✗
Global→Retail           ✗         ✓            ✓
```

---

### **Minute 5: Technical Deep Dive (60 seconds)**

**SAY:**
"Let me show you what's happening under the hood. This demonstrates the technical sophistication."

**SHOW:**

1. **Browser DevTools → Network tab:**
   - EventSource connection to `/api/events`
   - Real-time messages streaming
   - Point out: "Sub-100 millisecond latency for updates"

2. **System Status Panel:**
   - Backend API: Auto-health checks every 60 seconds
   - Real-time Connection: Live SSE stream
   - Canton Network: 3 independent participants
   - Activity Statistics: Transaction count updates live

3. **Activity Log Panel:**
   - Expand to show operation history
   - Filter by category: API, SSE, Transaction, User actions
   - Click **"Export JSON"** - download complete audit trail
   - Point out: "Full observability for debugging and compliance"

4. **Expanded Canton Metadata:**
   - Transaction ID: Unique cryptographic identifier
   - Ledger Offset: Proves position in global ledger
   - Record Time: Synchronizer's timestamp (consensus time)
   - Signatories: Cryptographic proof of who signed

**SAY:**
"The technical stack is production-grade:

- **Blockchain:** Canton Community 2.7.6 (same as enterprise Canton Network)
- **Smart Contracts:** Daml - a functional language for multi-party contracts
- **Backend:** Node.js with TypeScript, @daml/ledger for Canton integration
- **Frontend:** React with TypeScript, Server-Sent Events for real-time
- **Infrastructure:** Docker Compose with 6 containers (4 Canton + backend + frontend)

Each Canton participant runs independently—separate containers, separate ledgers, separate cryptographic keys. The synchronizer sequences transactions but never decrypts them. It's end-to-end encryption for blockchain."

---

## Common Questions & Prepared Answers

### **Q: Is this using a public blockchain?**

**A:** "No, this is Canton Community Edition running locally in Docker. However, the exact same codebase works on Canton Network's production infrastructure, which is used by actual financial institutions and enterprises. The demo uses in-memory storage for simplicity, but production deployments use PostgreSQL for persistence and can handle thousands of transactions per second."

---

### **Q: How does privacy actually work technically?**

**A:** "Canton uses sub-transaction privacy. Each transaction is split into encrypted 'views' that are only sent to involved parties. The synchronizer orders these encrypted views without ever decrypting them—it only sees message envelopes, not content. It's like TLS/HTTPS for blockchain: each party has their own encrypted channel, but the synchronizer still provides global ordering and consensus on sequencing."

---

### **Q: What happens if a party rejects a payment request?**

**A:** "Great question! The PaymentRequest contract has a Reject choice. If the receiver exercises it, the request is simply archived with no Payment created. The Daml smart contract enforces this logic at the blockchain level—the backend cannot override it. Would you like me to demonstrate?" 

*(If time permits, demo reject flow)*

---

### **Q: How long did this take to build?**

**A:** "About 7 days following a structured implementation plan. The Canton integration was the most complex part—understanding Canton's party ID system, Daml contract patterns, and the JSON HTTP API. The rest is standard full-stack development: React frontend, Node.js backend, Docker deployment. The hardest technical challenge was handling Canton's cryptographic party IDs and ensuring JWT tokens were correctly formatted."

---

### **Q: Can this handle production load?**

**A:** "Absolutely. Canton is designed for enterprise use by banks and financial institutions. This demo uses in-memory storage and 4 containers on a single machine, but production deployments scale horizontally:
- Each participant can be on separate infrastructure
- Participants can use PostgreSQL clusters for high availability
- Canton handles thousands of transactions per second in production
- The synchronizer can be replicated for fault tolerance

The architecture is already multi-party and distributed—it just needs production-grade persistence and load balancing."

---

### **Q: How do you ensure data consistency across participants?**

**A:** "Canton uses a two-phase commit protocol. When TechBank submits a transaction:
1. **Request Phase:** TechBank's participant encrypts the transaction and sends to synchronizer
2. **Ordering Phase:** Synchronizer assigns a sequence number (the 'offset') and notifies all involved participants
3. **Confirmation Phase:** Each participant confirms they received and can process the transaction
4. **Commit Phase:** Synchronizer gives final 'commit' signal, all participants write to their local ledger simultaneously

If any participant fails confirmation, the entire transaction rolls back. This guarantees atomicity—either all parties see the transaction, or none do."

---

### **Q: What's the difference between Canton and Hyperledger Fabric?**

**A:** "Great question! Both are permissioned blockchain platforms, but key differences:

**Hyperledger Fabric:**
- Channel-based privacy (create separate blockchains per group)
- All channel members see all channel transactions
- Complex to manage many channels

**Canton:**
- Transaction-level privacy (same ledger, different views)
- Only involved parties see each transaction
- Single global sequencer, multiple private contracts
- Daml smart contracts are portable across blockchains

Think of it this way: Fabric creates separate rooms for private conversations. Canton lets everyone stay in one room but uses end-to-end encryption so only intended recipients can decrypt messages."

---

## Troubleshooting During Demo

### **SSE Connection Fails (Red "Disconnected" indicator)**

**DO:**
1. Check browser console for errors (F12 → Console)
2. Verify backend running: `curl http://localhost:3001/health`
3. Restart backend: `docker-compose restart backend`
4. Refresh browser page

**SAY:**
"Let me restart the connection... *[restart backend]* ...and there we go, back online. This demonstrates the resilience—the Canton ledger persists even when the API layer restarts."

---

### **Transaction Doesn't Appear**

**DO:**
1. Check Activity Log for error messages
2. Verify Canton participants: `docker-compose ps` (should be "Up")
3. Check backend logs: `docker-compose logs backend`

**SAY:**
"Let me check the system logs... *[diagnose issue]* ...the Activity Log here shows exactly what went wrong, which is crucial for debugging in production."

---

### **Accept Button Doesn't Show**

**DO:**
1. Verify correct party selected (must match receiver)
2. Check transaction status (must be "pending")
3. Refresh page if needed

**SAY:**
"The Accept button only appears for the receiver party—this is Canton enforcing authorization at the blockchain level, not just UI logic."

---

## Post-Demo Follow-Up

### **If They Want to Try It:**

1. Share GitHub repository: `https://github.com/YOUR_USERNAME/canton-privacy-demo`
2. Point to `README.md` for complete setup instructions
3. Highlight quick start:
   ```bash
   # 1. Start Canton
   cd infrastructure && docker-compose up -d
   
   # 2. Initialize (one-time)
   .\init-canton-final.ps1
   
   # 3. Start backend
   cd backend && npm run dev
   
   # 4. Start frontend  
   cd frontend && npm run dev
   ```
4. Offer to answer setup questions via email

---

### **If They Want to See Code:**

**High-Value Files to Show:**

1. **Daml Smart Contracts:** `daml/Payment.daml`
   - Explain two-template pattern (PaymentRequest → Payment)
   - Show signatory vs observer roles
   - Demonstrate how Accept choice creates Payment

2. **Backend Canton Integration:** `backend/src/canton/ledger-client.ts`
   - JWT token generation for Canton API
   - Party ID management
   - Direct Canton ledger queries (no cache)

3. **Frontend Real-Time:** `frontend/src/App.tsx`
   - Server-Sent Events connection
   - State management for real-time updates
   - Privacy filtering logic

4. **Docker Setup:** `infrastructure/docker-compose.yml`
   - 6-container architecture
   - Network isolation
   - Volume persistence for Canton ledgers

---

### **If They Want Architecture Details:**

**Share Documentation:**
- `README.md` - Complete architecture overview
- `IMPLEMENTATION_PLAN.md` - Development journey  
- `CANTON_SUCCESS_SUMMARY.md` - Canton initialization details
- `BACKEND_SUCCESS_SUMMARY.md` - API implementation

**Key Architectural Decisions to Highlight:**
1. Why 6 separate containers (demonstrates physical separation)
2. Why direct Canton queries vs caching (blockchain is source of truth)
3. Why SSE vs polling (sub-100ms updates vs 5-second delays)
4. Why two-template pattern (Canton's multi-party signature model)

---

## Demo Success Metrics

**You've nailed the demo if the recruiter:**

✅ Understands Canton's privacy model (not just access control)  
✅ Sees real-time updates working smoothly  
✅ Asks follow-up technical questions  
✅ Comments "impressive" or "this is cool"  
✅ Requests GitHub link or wants to try it themselves  
✅ Asks about your experience with other blockchain platforms  
✅ Discusses next interview steps

---

## Practice Checklist

**Before Your First Real Demo:**

- [ ] Practice script 3 times end-to-end
- [ ] Time yourself (should be under 5 minutes for core demo)
- [ ] Practice handling each common question
- [ ] Test with a friend and get feedback
- [ ] Record yourself and watch for filler words ("um", "like")
- [ ] Prepare 30-second elevator pitch version
- [ ] Know how to recover from common failures
- [ ] Have screenshots as backup if live demo fails

---

## Elevator Pitch Version (30 seconds)

*"This is a Canton blockchain network with three independent banks—Tech

Bank, GlobalCorp, and RetailFinance. Watch me send a payment from TechBank to GlobalCorp. *[Submit transaction]* See? It appears instantly. Now I'll switch to RetailFinance's view. *[Switch]* The transaction disappears—RetailFinance can't see it because they're not involved. That's Canton's innovation: privacy-preserving blockchain where each party only sees their own contracts, yet we still get global consensus on ordering."*

---

**END OF DEMO SCRIPT**

**Remember:** Confidence, clarity, and enthusiasm matter more than perfection. If something breaks, use it as an opportunity to show debugging skills and system understanding.

**Good luck! 🚀**
