# Canton Privacy Backend

Backend API server for Canton Privacy Blockchain Visualizer.

## Prerequisites

- Node.js 20+
- Canton infrastructure running (see `../infrastructure/`)
- Canton initialized with real party IDs

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create .env File

Copy the environment template and add your real party IDs:

```bash
cp env.template .env
```

The `.env` file should contain:

```bash
# Participant Ledger API URLs
PARTICIPANT1_LEDGER_API=http://canton-participant1:5011
PARTICIPANT2_LEDGER_API=http://canton-participant2:5021
PARTICIPANT3_LEDGER_API=http://canton-participant3:5031

# Party IDs (from infrastructure/canton/party-ids.json)
TECHBANK_PARTY_ID=TechBank::1220...
GLOBALCORP_PARTY_ID=GlobalCorp::1220...
RETAILFINANCE_PARTY_ID=RetailFinance::1220...

# Server configuration
PORT=3001
JWT_SECRET=demo-secret-key-canton-privacy-visualizer
```

**⚠️ Important:** Use the REAL party IDs from `infrastructure/canton/party-ids.json` after running `init-canton-final.ps1`.

### 3. Update Party IDs

After Canton initialization, update `.env` with actual party IDs:

```powershell
# From project root
Get-Content infrastructure/canton/party-ids.json
```

Copy the party IDs into your `.env` file.

## Development

### Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001` with hot-reloading via `ts-node`.

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns server status.

### Get Parties

```bash
GET /api/parties
```

Returns all party configurations (display names, party IDs, ledger URLs).

### Query Transactions

```bash
GET /api/contracts?party=TechBank&limit=50
```

Query parameters:
- `party` (optional): Filter by party display name
- `limit` (optional): Max number of results (default: 50)

Returns array of transactions (both PaymentRequests and Payments).

**Privacy:** Canton enforces visibility at ledger level. Each party only sees their own transactions.

### Submit Transaction

```bash
POST /api/contracts
Content-Type: application/json

{
  "sender": "TechBank",
  "receiver": "GlobalCorp",
  "amount": 1000,
  "description": "Invoice #123"
}
```

Creates a PaymentRequest contract (sender signs only).

### Accept Transaction

```bash
POST /api/contracts/:contractId/accept
Content-Type: application/json

{
  "receiver": "GlobalCorp"
}
```

Exercises Accept choice on PaymentRequest (receiver signs, creates Payment).

### Server-Sent Events (SSE)

```bash
GET /api/events
```

Real-time transaction updates. Connect with EventSource:

```javascript
const eventSource = new EventSource('http://localhost:3001/api/events');

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'transaction') {
    console.log('New transaction:', message.data);
  }
};
```

## Testing

### Test with curl

```bash
# Health check
curl http://localhost:3001/health

# Get parties
curl http://localhost:3001/api/parties | jq '.'

# Submit transaction
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 1000,
    "description": "Test payment"
  }' | jq '.'

# Query transactions
curl "http://localhost:3001/api/contracts?party=TechBank" | jq '.'

# Test SSE connection
curl -N http://localhost:3001/api/events
```

### Privacy Testing

```bash
# Submit transaction: TechBank → GlobalCorp
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{"sender":"TechBank","receiver":"GlobalCorp","amount":1000,"description":"Test"}' | jq '.'

# TechBank can see it
curl "http://localhost:3001/api/contracts?party=TechBank" | jq '. | length'
# Expected: 1

# GlobalCorp can see it
curl "http://localhost:3001/api/contracts?party=GlobalCorp" | jq '. | length'
# Expected: 1

# RetailFinance CANNOT see it (privacy enforced by Canton)
curl "http://localhost:3001/api/contracts?party=RetailFinance" | jq '. | length'
# Expected: 0
```

## Architecture

### Data Flow

```
Frontend
    ↓
REST API (Express)
    ↓
Canton Ledger Client
    ↓
Canton Ledger API (gRPC)
    ↓
Canton Blockchain
```

### Key Design Decisions

1. **No Caching** - Query Canton directly for every request
   - Canton IS the database
   - Avoids cache synchronization issues
   - Survives backend restarts

2. **Server-Sent Events** - Real-time updates
   - <100ms latency vs 0-5s polling
   - Standard HTTP (no WebSocket complexity)
   - Automatic reconnection

3. **JWT Authentication** - Required by Canton
   - Tokens generated per-party
   - Canton validates signatures
   - Enables multi-party authorization

4. **Privacy at Ledger Level** - Canton enforces visibility
   - Not enforced in backend code
   - Cryptographically guaranteed
   - Each party has separate ledger connection

## Troubleshooting

### Cannot connect to Canton

**Error:** `Failed to query Canton ledger`

**Solution:**
1. Verify Canton containers running: `docker ps --filter "name=canton"`
2. Check container hostnames in `.env` match docker-compose service names
3. Ensure backend is running in same Docker network (for production)

### Party IDs not found

**Error:** `Missing configuration for party: TechBank`

**Solution:**
1. Verify `.env` file exists in `backend/` directory
2. Check party IDs are copied from `infrastructure/canton/party-ids.json`
3. Ensure no extra whitespace in party ID values

### JWT authentication fails

**Error:** `Canton submission failed: Unauthorized`

**Solution:**
1. Check JWT_SECRET in `.env`
2. Verify party IDs exactly match Canton (with `::` separator)
3. Check ledgerId parameter in `createCantonToken()` function

### SSE not broadcasting

**Error:** Transactions submit but frontend doesn't update

**Solution:**
1. Check `broadcastTransaction()` is called after submit/accept
2. Verify clients array has connected clients: check server logs
3. Test SSE endpoint directly: `curl -N http://localhost:3001/api/events`

## Development Notes

- **TypeScript Strict Mode** - All code uses strict type checking
- **Error Handling** - All Canton calls wrapped in try/catch
- **Logging** - Comprehensive console logging for debugging
- **CORS Enabled** - Frontend can connect from any origin (dev mode)

## Next Steps

After backend is running:
1. Start frontend development (Phase 4)
2. Test end-to-end workflow
3. Run integration tests
4. Deploy to production

