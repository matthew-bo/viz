#!/bin/bash
# Single-Node Canton Quick Start Script
# Run this after migration to test the new setup

set -e

echo "=== Canton Privacy Demo - Single-Node Quick Start ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to infrastructure directory
cd "$(dirname "$0")"

echo "📍 Working directory: $(pwd)"
echo ""

# Step 1: Start Canton
echo "1️⃣  Starting Canton single-node..."
docker compose -f docker-compose-simple.yml up -d canton

echo "   Waiting for Canton to initialize (60 seconds)..."
sleep 60

# Check Canton health
if docker ps | grep -q "canton-single-node.*healthy"; then
    echo -e "${GREEN}✅ Canton is healthy${NC}"
else
    echo -e "${RED}❌ Canton is not healthy${NC}"
    echo "   Check logs: docker logs canton-single-node"
    exit 1
fi

# Step 2: Extract party IDs
echo ""
echo "2️⃣  Extracting party IDs from Canton logs..."
docker logs canton-single-node | grep -A 3 "PARTY IDs (SAVE THESE" | grep "_PARTY_ID=" > /tmp/party-ids.txt || true

if [ -s /tmp/party-ids.txt ]; then
    echo -e "${GREEN}✅ Party IDs found${NC}"
    echo ""
    echo -e "${YELLOW}=== COPY THESE TO backend/.env ===${NC}"
    cat /tmp/party-ids.txt
    echo -e "${YELLOW}=================================${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  ACTION REQUIRED: Update backend/.env with these party IDs${NC}"
    echo "   Then run: docker compose -f docker-compose-simple.yml up -d backend frontend"
    echo ""
    read -p "Press ENTER after updating backend/.env..."
else
    echo -e "${RED}❌ Could not extract party IDs${NC}"
    echo "   Manually check: docker logs canton-single-node"
    exit 1
fi

# Step 3: Start backend and frontend
echo ""
echo "3️⃣  Starting backend and frontend..."
docker compose -f docker-compose-simple.yml up -d backend frontend

echo "   Waiting for services to start (15 seconds)..."
sleep 15

# Step 4: Test backend health
echo ""
echo "4️⃣  Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi

# Step 5: Test parties endpoint
echo ""
echo "5️⃣  Testing parties endpoint..."
PARTIES_COUNT=$(curl -s http://localhost:3001/api/parties | jq '. | length')

if [ "$PARTIES_COUNT" = "3" ]; then
    echo -e "${GREEN}✅ Found 3 parties${NC}"
else
    echo -e "${RED}❌ Expected 3 parties, found: $PARTIES_COUNT${NC}"
    exit 1
fi

# Step 6: Test transaction submission
echo ""
echo "6️⃣  Testing transaction submission (THE CRITICAL TEST)..."
SUBMIT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 1000,
    "description": "Quick start test"
  }')

if echo "$SUBMIT_RESPONSE" | grep -q "contractId"; then
    echo -e "${GREEN}✅ Transaction submitted successfully (NO UNKNOWN_SUBMITTERS!)${NC}"
    echo "   Contract ID: $(echo $SUBMIT_RESPONSE | jq -r '.contractId' | head -c 20)..."
else
    echo -e "${RED}❌ Transaction submission failed${NC}"
    echo "   Response: $SUBMIT_RESPONSE"
    exit 1
fi

# Step 7: Test privacy
echo ""
echo "7️⃣  Testing privacy model..."
TECHBANK_COUNT=$(curl -s "http://localhost:3001/api/contracts?party=TechBank" | jq '. | length')
RETAIL_COUNT=$(curl -s "http://localhost:3001/api/contracts?party=RetailFinance" | jq '. | length')

echo "   TechBank sees: $TECHBANK_COUNT transactions"
echo "   RetailFinance sees: $RETAIL_COUNT transactions"

if [ "$TECHBANK_COUNT" -gt "0" ] && [ "$RETAIL_COUNT" = "0" ]; then
    echo -e "${GREEN}✅ Privacy model working correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Privacy model check inconclusive${NC}"
fi

# Step 8: Test frontend
echo ""
echo "8️⃣  Testing frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend returned HTTP $FRONTEND_RESPONSE${NC}"
fi

# Final summary
echo ""
echo "=== 🎉 Quick Start Complete ==="
echo ""
echo "✅ All services running:"
docker compose -f docker-compose-simple.yml ps
echo ""
echo "📊 Access your application:"
echo "   Frontend: http://45.55.189.150:3000"
echo "   Backend:  http://45.55.189.150:3001"
echo "   Health:   http://45.55.189.150:3001/health"
echo ""
echo "🔍 Useful commands:"
echo "   View Canton logs:  docker logs canton-single-node"
echo "   View backend logs: docker logs backend"
echo "   View all logs:     docker compose -f docker-compose-simple.yml logs -f"
echo "   Stop all:          docker compose -f docker-compose-simple.yml down"
echo "   Restart all:       docker compose -f docker-compose-simple.yml restart"
echo ""

