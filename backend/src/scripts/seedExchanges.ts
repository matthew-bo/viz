/**
 * Exchange Seed Script
 * Creates backdated exchange transactions for demo purposes
 * Generates realistic transaction history over the past 30 days
 */

import exchangeService from '../services/exchangeService';
import inventoryService from '../services/inventoryService';
import { ExchangeStatus } from '../models/Exchange';

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
function generateDescription(assetType: string, assetId: string): string {
  const descriptions = {
    real_estate: [
      `Property acquisition - ${assetId}`,
      `Real estate portfolio diversification`,
      `Strategic property investment`,
      `Commercial real estate transaction`
    ],
    private_equity: [
      `Private equity stake acquisition`,
      `Company investment opportunity`,
      `Portfolio company addition`,
      `Strategic equity position`
    ]
  };

  const typeDescriptions = descriptions[assetType as keyof typeof descriptions] || [
    'Asset exchange transaction'
  ];

  return randomElement(typeDescriptions);
}

/**
 * Seed exchange transactions
 */
export async function seedExchanges(parties: Party[], count: number = 30) {
  console.log(`\n🌱 Seeding ${count} backdated exchanges...\n`);

  const statuses: ExchangeStatus[] = ['pending', 'accepted', 'rejected', 'completed'];
  const weights = {
    pending: 0.15,    // 15% pending
    accepted: 0.20,   // 20% accepted
    completed: 0.60,  // 60% completed
    rejected: 0.05    // 5% rejected
  };

  const createdExchanges: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      // Random parties (ensure different)
      const initiatorParty = randomElement(parties);
      const counterparties = parties.filter(p => p.partyId !== initiatorParty.partyId);
      const counterparty = randomElement(counterparties);

      // Get available assets for initiator
      const inventory = inventoryService.getInventory(initiatorParty.partyId);
      if (!inventory || (inventory.realEstate.length === 0 && inventory.privateEquity.length === 0)) {
        console.log(`⚠️  ${initiatorParty.displayName} has no assets to exchange`);
        continue;
      }

      // Pick random asset type and asset
      const hasRealEstate = inventory.realEstate.length > 0;
      const hasPrivateEquity = inventory.privateEquity.length > 0;
      
      let assetType: 'real_estate' | 'private_equity';
      let assetId: string;
      let assetValue: number;

      if (hasRealEstate && (!hasPrivateEquity || Math.random() > 0.5)) {
        assetType = 'real_estate';
        const asset = randomElement(inventory.realEstate);
        assetId = asset.id;
        assetValue = asset.value;
      } else if (hasPrivateEquity) {
        assetType = 'private_equity';
        const asset = randomElement(inventory.privateEquity);
        assetId = asset.id;
        assetValue = asset.valuation;
      } else {
        continue;
      }

      // Calculate cash amount (80-120% of asset value)
      const cashMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const cashAmount = Math.round(assetValue * cashMultiplier);

      // Determine status based on weights
      const rand = Math.random();
      let status: ExchangeStatus;
      if (rand < weights.rejected) {
        status = 'rejected';
      } else if (rand < weights.rejected + weights.pending) {
        status = 'pending';
      } else if (rand < weights.rejected + weights.pending + weights.accepted) {
        status = 'accepted';
      } else {
        status = 'completed';
      }

      // Create exchange
      const exchange = await exchangeService.createExchange({
        initiatorPartyId: initiatorParty.partyId,
        counterpartyId: counterparty.partyId,
        assetOffered: assetId,
        assetType: assetType,
        cashAmount: cashAmount,
        description: generateDescription(assetType, assetId)
      });

      // Backdate the exchange
      const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
      const createdAt = randomDate(daysAgo);
      exchange.createdAt = createdAt;

      // Update status if not pending
      if (status === 'accepted') {
        const acceptedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000); // within 24 hours
        exchange.status = 'accepted';
        exchange.acceptedAt = acceptedAt;
      } else if (status === 'rejected') {
        const rejectedAt = new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000); // within 48 hours
        exchange.status = 'rejected';
        exchange.rejectedAt = rejectedAt;
      } else if (status === 'completed') {
        const acceptedAt = new Date(createdAt.getTime() + Math.random() * 12 * 60 * 60 * 1000); // within 12 hours
        const completedAt = new Date(acceptedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000); // 12-36 hours after creation
        exchange.status = 'completed';
        exchange.acceptedAt = acceptedAt;
        exchange.completedAt = completedAt;

        // Actually execute the completed exchanges
        try {
          await exchangeService.completeExchange(exchange.id);
        } catch (error) {
          // If completion fails, leave as accepted
          exchange.status = 'accepted';
          console.log(`⚠️  Could not complete exchange ${exchange.id}: ${error}`);
        }
      }

      createdExchanges.push(exchange.id);

      // Log progress
      const statusEmoji = {
        pending: '⏳',
        accepted: '✅',
        rejected: '❌',
        completed: '🎉'
      };

      console.log(
        `${statusEmoji[status]} ${status.toUpperCase().padEnd(10)} | ` +
        `${initiatorParty.displayName} → ${counterparty.displayName} | ` +
        `${assetType === 'real_estate' ? '🏢' : '📊'} ${assetId.substring(0, 20)}... | ` +
        `$${(cashAmount / 1000000).toFixed(1)}M | ` +
        `${daysAgo}d ago`
      );

    } catch (error) {
      console.error(`❌ Error creating exchange ${i + 1}:`, error);
    }
  }

  console.log(`\n✅ Created ${createdExchanges.length} backdated exchanges\n`);

  // Print summary
  const allExchanges = exchangeService.getExchanges();
  const summary = {
    total: allExchanges.length,
    pending: allExchanges.filter(e => e.status === 'pending').length,
    accepted: allExchanges.filter(e => e.status === 'accepted').length,
    completed: allExchanges.filter(e => e.status === 'completed').length,
    rejected: allExchanges.filter(e => e.status === 'rejected').length,
  };

  console.log('📊 Exchange Summary:');
  console.log(`   Total: ${summary.total}`);
  console.log(`   ⏳ Pending: ${summary.pending}`);
  console.log(`   ✅ Accepted: ${summary.accepted}`);
  console.log(`   🎉 Completed: ${summary.completed}`);
  console.log(`   ❌ Rejected: ${summary.rejected}`);
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

