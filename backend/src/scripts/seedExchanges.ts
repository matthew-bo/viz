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

      // Get available assets for initiator
      const inventory = inventoryService.getInventory(initiatorParty.partyId);
      if (!inventory || (inventory.realEstate.length === 0 && inventory.privateEquity.length === 0)) {
        console.log(`⚠️  ${initiatorParty.displayName} has no assets to exchange`);
        continue;
      }

      // Pick random asset type and asset
      const hasRealEstate = inventory.realEstate.length > 0;
      const hasPrivateEquity = inventory.privateEquity.length > 0;
      
      let offering: ExchangeOffer;
      let requesting: ExchangeOffer;
      let assetValue: number;

      if (hasRealEstate && (!hasPrivateEquity || Math.random() > 0.5)) {
        // Offer real estate asset
        const assetId = randomElement(inventory.realEstate);
        const asset = assetService.getRealEstate(assetId);
        if (!asset) continue;
        
        assetValue = asset.value;
        offering = {
          type: 'real_estate',
          assetId: asset.id,
          assetName: asset.name,
          assetValue: asset.value
        };
      } else if (hasPrivateEquity) {
        // Offer private equity asset
        const assetId = randomElement(inventory.privateEquity);
        const asset = assetService.getPrivateEquity(assetId);
        if (!asset) continue;
        
        assetValue = asset.valuation;
        offering = {
          type: 'private_equity',
          assetId: asset.id,
          assetName: asset.name,
          assetValue: asset.valuation
        };
      } else {
        continue;
      }

      // Request cash (80-120% of asset value)
      const cashMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const cashAmount = Math.round(assetValue * cashMultiplier);
      
      requesting = {
        type: 'cash',
        cashAmount: cashAmount
      };

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
        generateDescription(offering.type, offering.assetId || 'cash')
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

      console.log(
        `${statusEmoji[status]} ${status.toUpperCase().padEnd(10)} | ` +
        `${initiatorParty.displayName} → ${counterparty.displayName} | ` +
        `${offering.type === 'real_estate' ? '🏢' : '📊'} ${offering.assetName?.substring(0, 25)}... | ` +
        `$${(cashAmount / 1000000).toFixed(1)}M | ` +
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

