/**
 * Canton Asset Registry
 * 
 * Bridge between in-memory asset IDs and Canton contract IDs.
 * 
 * This service:
 * 1. Creates assets on Canton ledger at startup
 * 2. Maintains a mapping of assetId -> contractId
 * 3. Provides lookup methods for exchange operations
 * 
 * When Canton is not available, falls back gracefully.
 */

import { tokenizedAssetClient, TokenizedCashBalance, TokenizedRealEstate, TokenizedPrivateEquity } from '../canton/tokenized-asset-client';

interface AssetMapping {
  assetId: string;           // In-memory ID (e.g., "re_empire_state")
  contractId: string;        // Canton contract ID
  type: 'cash' | 'real_estate' | 'private_equity';
  owner: string;             // Party display name
  details: any;              // Asset-specific data
}

interface CashMapping {
  owner: string;
  contractId: string;
  amount: number;
  currency: string;
}

class CantonAssetRegistry {
  private assetMap: Map<string, AssetMapping> = new Map();
  private cashMap: Map<string, CashMapping[]> = new Map(); // owner -> cash holdings
  private initialized = false;
  private cantonAvailable = false;

  /**
   * Initialize assets on Canton ledger
   * Creates all the assets that exist in the in-memory system
   */
  async initialize(seedData: {
    cash: Array<{ owner: string; amount: number }>;
    realEstate: Array<{
      owner: string;
      assetId: string;
      name: string;
      location: string;
      propertyType: string;
      squareFeet: number;
      value: number;
    }>;
    privateEquity: Array<{
      owner: string;
      assetId: string;
      companyName: string;
      industry: string;
      ownershipPercentage: number;
      valuation: number;
    }>;
  }): Promise<{ success: boolean; created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    try {
      // Test Canton availability
      await tokenizedAssetClient.getTokenizedInventory('TechBank');
      this.cantonAvailable = true;
      console.log('✓ Canton ledger available for tokenized assets');
    } catch (error) {
      console.log('⚠ Canton ledger not available - using in-memory only');
      this.cantonAvailable = false;
      this.initialized = true;
      return { success: false, created: 0, errors: ['Canton not available'] };
    }

    // Create cash holdings
    for (const cash of seedData.cash) {
      try {
        const result = await tokenizedAssetClient.createCashHolding(
          cash.owner,
          cash.amount,
          'USD'
        );
        
        const ownerCash = this.cashMap.get(cash.owner) || [];
        ownerCash.push({
          owner: cash.owner,
          contractId: result.contractId,
          amount: cash.amount,
          currency: 'USD'
        });
        this.cashMap.set(cash.owner, ownerCash);
        created++;
        console.log(`  ✓ Created ${cash.owner} cash: $${cash.amount.toLocaleString()}`);
      } catch (error) {
        errors.push(`Cash ${cash.owner}: ${error}`);
      }
    }

    // Create real estate tokens
    for (const re of seedData.realEstate) {
      try {
        const result = await tokenizedAssetClient.createRealEstateToken(
          re.owner,
          re.assetId,
          re.name,
          re.location,
          re.propertyType,
          re.squareFeet,
          re.value
        );
        
        this.assetMap.set(re.assetId, {
          assetId: re.assetId,
          contractId: result.contractId,
          type: 'real_estate',
          owner: re.owner,
          details: re
        });
        created++;
        console.log(`  ✓ Created ${re.owner} RE: ${re.name}`);
      } catch (error) {
        errors.push(`RE ${re.name}: ${error}`);
      }
    }

    // Create private equity tokens
    for (const pe of seedData.privateEquity) {
      try {
        const result = await tokenizedAssetClient.createPrivateEquityToken(
          pe.owner,
          pe.assetId,
          pe.companyName,
          pe.industry,
          pe.ownershipPercentage,
          pe.valuation
        );
        
        this.assetMap.set(pe.assetId, {
          assetId: pe.assetId,
          contractId: result.contractId,
          type: 'private_equity',
          owner: pe.owner,
          details: pe
        });
        created++;
        console.log(`  ✓ Created ${pe.owner} PE: ${pe.companyName}`);
      } catch (error) {
        errors.push(`PE ${pe.companyName}: ${error}`);
      }
    }

    this.initialized = true;
    return { success: errors.length === 0, created, errors };
  }

  /**
   * Get Canton contract ID for an asset
   */
  getContractId(assetId: string): string | null {
    return this.assetMap.get(assetId)?.contractId || null;
  }

  /**
   * Get asset mapping by contract ID
   */
  getAssetByContractId(contractId: string): AssetMapping | null {
    for (const mapping of this.assetMap.values()) {
      if (mapping.contractId === contractId) {
        return mapping;
      }
    }
    return null;
  }

  /**
   * Get cash contract ID for a party with sufficient funds
   */
  getCashContractId(owner: string, amount: number): string | null {
    const holdings = this.cashMap.get(owner) || [];
    for (const holding of holdings) {
      if (holding.amount >= amount) {
        return holding.contractId;
      }
    }
    return null;
  }

  /**
   * Update mapping after exchange (ownership changed)
   */
  updateAssetOwner(assetId: string, newOwner: string, newContractId: string): void {
    const mapping = this.assetMap.get(assetId);
    if (mapping) {
      mapping.owner = newOwner;
      mapping.contractId = newContractId;
    }
  }

  /**
   * Update cash holdings after transfer
   */
  updateCashHoldings(owner: string, holdings: CashMapping[]): void {
    this.cashMap.set(owner, holdings);
  }

  /**
   * Refresh mappings from Canton (after an exchange)
   */
  async refreshFromCanton(): Promise<void> {
    if (!this.cantonAvailable) return;

    try {
      const parties = ['TechBank', 'GlobalCorp', 'RetailFinance'];
      
      for (const partyName of parties) {
        const inventory = await tokenizedAssetClient.getTokenizedInventory(partyName);
        
        // Update cash mappings
        this.cashMap.set(partyName, inventory.cash.map(c => ({
          owner: partyName,
          contractId: c.contractId,
          amount: c.amount,
          currency: c.currency
        })));

        // Update real estate mappings
        for (const re of inventory.realEstate) {
          this.assetMap.set(re.assetId, {
            assetId: re.assetId,
            contractId: re.contractId,
            type: 'real_estate',
            owner: partyName,
            details: re
          });
        }

        // Update private equity mappings
        for (const pe of inventory.privateEquity) {
          this.assetMap.set(pe.assetId, {
            assetId: pe.assetId,
            contractId: pe.contractId,
            type: 'private_equity',
            owner: partyName,
            details: pe
          });
        }
      }
    } catch (error) {
      console.error('Failed to refresh from Canton:', error);
    }
  }

  /**
   * Get all mappings for a party
   */
  getPartyAssets(owner: string): AssetMapping[] {
    return Array.from(this.assetMap.values()).filter(m => m.owner === owner);
  }

  /**
   * Get cash holdings for a party
   */
  getPartyCash(owner: string): CashMapping[] {
    return this.cashMap.get(owner) || [];
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isCantonAvailable(): boolean {
    return this.cantonAvailable;
  }

  /**
   * Get full inventory for a party (combining cash and assets)
   */
  async getPartyInventory(owner: string): Promise<{
    displayName: string;
    cash: number;
    cashContractId: string | null;
    realEstateAssets: AssetMapping[];
    privateEquityAssets: AssetMapping[];
    escrow: { cash: number; assets: string[] };
  }> {
    const cashHoldings = this.getPartyCash(owner);
    const totalCash = cashHoldings.reduce((sum, c) => sum + c.amount, 0);
    const primaryCashContract = cashHoldings[0]?.contractId || null;

    const allAssets = this.getPartyAssets(owner);
    const realEstateAssets = allAssets.filter(a => a.type === 'real_estate');
    const privateEquityAssets = allAssets.filter(a => a.type === 'private_equity');

    return {
      displayName: owner,
      cash: totalCash,
      cashContractId: primaryCashContract,
      realEstateAssets,
      privateEquityAssets,
      escrow: { cash: 0, assets: [] } // Escrow is now in Canton proposals
    };
  }
}

export const cantonAssetRegistry = new CantonAssetRegistry();

