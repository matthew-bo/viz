/**
 * Canton Asset Registry
 * 
 * Bridge between in-memory asset IDs and Canton contract IDs.
 * Uses the raw HTTP Canton client for direct ledger interaction.
 */

import {
  createCashHolding,
  createRealEstateToken,
  createPrivateEquityToken,
  getCantonInventory,
  checkCantonHealth,
  CashHoldingInfo,
  RealEstateInfo,
  PrivateEquityInfo
} from '../canton/canton-asset-service';

interface AssetMapping {
  assetId: string;
  contractId: string;
  type: 'cash' | 'real_estate' | 'private_equity';
  owner: string;
  details: any;
}

interface CashMapping {
  owner: string;
  contractId: string;
  amount: number;
  currency: string;
}

class CantonAssetRegistry {
  private assetMap: Map<string, AssetMapping> = new Map();
  private cashMap: Map<string, CashMapping[]> = new Map();
  private initialized = false;
  private cantonAvailable = false;

  /**
   * Initialize assets on Canton ledger
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

    // Check Canton availability
    try {
      this.cantonAvailable = await checkCantonHealth();
      if (!this.cantonAvailable) {
        console.log('⚠ Canton ledger not available - using in-memory only');
        this.initialized = true;
        return { success: false, created: 0, errors: ['Canton not available'] };
      }
      console.log('✓ Canton ledger available');
    } catch (error) {
      console.log('⚠ Canton health check failed - using in-memory only');
      this.cantonAvailable = false;
      this.initialized = true;
      return { success: false, created: 0, errors: ['Canton health check failed'] };
    }

    // Create cash holdings
    for (const cash of seedData.cash) {
      try {
        const result = await createCashHolding(cash.owner, cash.amount, 'USD');
        
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
      } catch (error: any) {
        const msg = `Cash ${cash.owner}: ${error.message || error}`;
        errors.push(msg);
        console.log(`  ✗ ${msg}`);
      }
    }

    // Create real estate tokens
    for (const re of seedData.realEstate) {
      try {
        const result = await createRealEstateToken(
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
      } catch (error: any) {
        const msg = `RE ${re.name}: ${error.message || error}`;
        errors.push(msg);
        console.log(`  ✗ ${msg}`);
      }
    }

    // Create private equity tokens
    for (const pe of seedData.privateEquity) {
      try {
        const result = await createPrivateEquityToken(
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
      } catch (error: any) {
        const msg = `PE ${pe.companyName}: ${error.message || error}`;
        errors.push(msg);
        console.log(`  ✗ ${msg}`);
      }
    }

    this.initialized = true;
    
    // If we created any assets, consider it a partial success
    if (created > 0 && errors.length > 0) {
      console.log(`⚠ Partial tokenization: ${created} created, ${errors.length} errors`);
      return { success: false, created, errors };
    } else if (created > 0) {
      console.log(`✓ Full tokenization complete: ${created} assets created`);
      return { success: true, created, errors: [] };
    } else {
      return { success: false, created: 0, errors };
    }
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
   * Update mapping after exchange
   */
  updateAssetOwner(assetId: string, newOwner: string, newContractId: string): void {
    const mapping = this.assetMap.get(assetId);
    if (mapping) {
      mapping.owner = newOwner;
      mapping.contractId = newContractId;
    }
  }

  /**
   * Refresh mappings from Canton
   */
  async refreshFromCanton(): Promise<void> {
    if (!this.cantonAvailable) return;

    try {
      const parties = ['TechBank', 'GlobalCorp', 'RetailFinance'];
      
      for (const partyName of parties) {
        const inventory = await getCantonInventory(partyName);
        
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
}

export const cantonAssetRegistry = new CantonAssetRegistry();
