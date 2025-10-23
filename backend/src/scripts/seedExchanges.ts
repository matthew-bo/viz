/**
 * Exchange Seed Script
 * Creates backdated exchange transactions for demo purposes
 * Generates realistic transaction history over the past 30 days
 */

import exchangeService from '../services/exchangeService';
import inventoryService from '../services/inventoryService';
import assetService from '../services/assetService';
import { ExchangeProposal, ExchangeOffer } from '../models/Exchange';

interface Party {
  partyId: string;
  displayName: string;
}

/**
 * Generate random date between now and daysAgo
 */
function randomDate(daysAgo: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

/**
 * Get random element from array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate exchange description
 */
function generateDescription(assetType: string, assetName?: string): string {
  const descriptions = {
    real_estate: [
      `Property acquisition - ${assetName}`,
      `Real estate portfolio expansion`,
      `Strategic property investment`,
      `Commercial real estate purchase`
    ],
    private_equity: [
      `Private equity stake acquisition`,
      `Company investment - ${assetName}`,
      `Portfolio company addition`,
      `Strategic equity investment`
    ]
  };

  const typeDescriptions = descriptions[assetType as keyof typeof descriptions] || [
    'Asset purchase transaction'
  ];

  return randomElement(typeDescriptions);
}

/**
 * Seed exchange transactions
 */
export async function seedExchanges(parties: Party[], count: number = 30) {
  console.log(`\n🌱 Seeding ${count} backdated exchanges...\n`);
  console.log(`Parties received: ${parties.length}`);
  parties.forEach(p => console.log(`  - ${p.displayName} (${p.partyId.substring(0, 30)}...)`));

  type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
  const statuses: ExchangeStatus[] = ['pending', 'accepted', 'rejected'];
  const weights = {
    pending: 0.20,    // 20% pending
    accepted: 0.75,   // 75% accepted
    rejected: 0.05    // 5% rejected
  };

  const createdExchanges: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      // Random parties (ensure different)
      const initiatorParty = randomElement(parties);
      const counterparties = parties.filter(p => p.partyId !== initiatorParty.partyId);
      const counterparty = randomElement(counterparties);

      // Get inventory for initiator (who will offer cash)
      const inventory = inventoryService.getInventory(initiatorParty.partyId);
      console.log(`Attempt ${i + 1}: ${initiatorParty.displayName} offering cash`);
      
      if (!inventory) {
        console.log(`⚠️  ${initiatorParty.displayName} inventory not found`);
        continue;
      }

      // Check if initiator has enough cash to make an offer
      if (inventory.cash < 50000) {
        console.log(`⚠️  ${initiatorParty.displayName} has insufficient cash ($${inventory.cash.toLocaleString()})`);
        continue;
      }
      
      console.log(`  Available cash: $${(inventory.cash / 1000000).toFixed(1)}M`);

      // Get assets from counterparty (the person who will receive the cash)
      const counterpartyInventory = inventoryService.getInventory(counterparty.partyId);
      if (!counterpartyInventory || 
          (counterpartyInventory.realEstate.length === 0 && counterpartyInventory.privateEquity.length === 0)) {
        console.log(`⚠️  ${counterparty.displayName} has no assets to sell`);
        continue;
      }

      // Pick random asset type and asset from counterparty
      const hasRealEstate = counterpartyInventory.realEstate.length > 0;
      const hasPrivateEquity = counterpartyInventory.privateEquity.length > 0;
      
      let offering: ExchangeOffer;
      let requesting: ExchangeOffer;

      // Initiator offers cash (10-90% of their available balance)
      const cashMultiplier = 0.1 + Math.random() * 0.8; // 10% to 90% of cash
      const cashAmount = Math.round(inventory.cash * cashMultiplier);
      
      offering = {
        type: 'cash',
        cashAmount: cashAmount
      };

      // Request asset from counterparty
      if (hasRealEstate && (!hasPrivateEquity || Math.random() > 0.5)) {
        // Request real estate asset
        const assetId = randomElement(counterpartyInventory.realEstate);
        const asset = assetService.getRealEstate(assetId);
        if (!asset) continue;
        
        requesting = {
          type: 'real_estate',
          assetId: asset.id,
          assetName: asset.name,
          assetValue: asset.value
        };
      } else if (hasPrivateEquity) {
        // Request private equity asset
        const assetId = randomElement(counterpartyInventory.privateEquity);
        const asset = assetService.getPrivateEquity(assetId);
        if (!asset) continue;
        
        requesting = {
          type: 'private_equity',
          assetId: asset.id,
          assetName: asset.name,
          assetValue: asset.valuation
        };
      } else {
        continue;
      }

      // Determine status based on weights
      const rand = Math.random();
      let status: ExchangeStatus;
      if (rand < weights.rejected) {
        status = 'rejected';
      } else if (rand < weights.rejected + weights.pending) {
        status = 'pending';
      } else {
        status = 'accepted';
      }

      // Create exchange
      const exchange = exchangeService.createExchange(
        initiatorParty.partyId,
        initiatorParty.displayName,
        counterparty.partyId,
        counterparty.displayName,
        offering,
        requesting,
        generateDescription(requesting.type, requesting.assetName)
      );

      if (!exchange) {
        console.log(`⚠️  Failed to create exchange between ${initiatorParty.displayName} and ${counterparty.displayName}`);
        continue;
      }

      // Backdate the exchange
      const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
      const createdAt = randomDate(daysAgo);
      exchange.createdAt = createdAt;

      // Update status if not pending
      if (status === 'accepted') {
        const acceptedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000); // within 24 hours
        exchange.status = 'accepted';
        exchange.acceptedAt = acceptedAt;
        
        // Actually accept the exchange to transfer assets
        exchangeService.acceptExchange(exchange.id, counterparty.partyId);
      } else if (status === 'rejected') {
        exchange.status = 'rejected';
        // Note: No rejectedAt field in the model, status is enough
      }

      createdExchanges.push(exchange.id);

      // Log progress
      const statusEmoji = {
        pending: '⏳',
        accepted: '✅',
        rejected: '❌',
        cancelled: '🚫'
      };

      const assetEmoji = requesting.type === 'real_estate' ? '🏢' : '📊';
      const assetName = requesting.assetName || 'Unknown';
      console.log(
        `${statusEmoji[status]} ${status.toUpperCase().padEnd(10)} | ` +
        `${initiatorParty.displayName} → ${counterparty.displayName} | ` +
        `💵 $${(cashAmount / 1000000).toFixed(1)}M → ${assetEmoji} ${assetName.substring(0, 25)} | ` +
        `${daysAgo}d ago`
      );

    } catch (error) {
      console.error(`❌ Error creating exchange ${i + 1}:`, error);
    }
  }

  console.log(`\n✅ Created ${createdExchanges.length} backdated exchanges\n`);

  // Print summary
  const allExchanges = exchangeService.getAllExchanges();
  const summary = {
    total: allExchanges.length,
    pending: allExchanges.filter(e => e.status === 'pending').length,
    accepted: allExchanges.filter(e => e.status === 'accepted').length,
    rejected: allExchanges.filter(e => e.status === 'rejected').length,
    cancelled: allExchanges.filter(e => e.status === 'cancelled').length,
  };

  console.log('📊 Exchange Summary:');
  console.log(`   Total: ${summary.total}`);
  console.log(`   ⏳ Pending: ${summary.pending}`);
  console.log(`   ✅ Accepted: ${summary.accepted}`);
  console.log(`   ❌ Rejected: ${summary.rejected}`);
  console.log(`   🚫 Cancelled: ${summary.cancelled}`);
  console.log('');

  return createdExchanges;
}

/**
 * Clear all exchanges (for testing)
 */
export function clearExchanges() {
  console.log('🗑️  Clearing all exchanges...');
  // This would need to be implemented in exchangeService
  // For now, just restart the server to clear in-memory data
  console.log('⚠️  Restart server to clear in-memory exchanges');
}

