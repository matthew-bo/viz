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

