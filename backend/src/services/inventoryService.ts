/**
 * Inventory Service
 * Manages party inventories (cash + owned assets)
 */

import { PartyInventory, InventorySnapshot } from '../models/Inventory';
import assetService from './assetService';

class InventoryService {
  private inventories: Map<string, PartyInventory> = new Map();

  /**
   * Initialize inventory for a party
   */
  initializeInventory(partyId: string, displayName: string, cash: number = 1000000): void {
    this.inventories.set(partyId, {
      partyId,
      displayName,
      cash,
      escrowedCash: 0,
      realEstate: [],
      escrowedRealEstate: [],
      privateEquity: [],
      escrowedPrivateEquity: [],
      lastUpdated: new Date(),
    });
    console.log(`Initialized inventory for ${displayName} with $${cash.toLocaleString()}`);
  }

  /**
   * Get party inventory
   */
  getInventory(partyId: string): PartyInventory | null {
    return this.inventories.get(partyId) || null;
  }

  /**
   * Get detailed inventory snapshot with full asset details (including escrowed)
   */
  getInventorySnapshot(partyId: string): InventorySnapshot | null {
    const inventory = this.getInventory(partyId);
    if (!inventory) return null;

    const realEstateAssets = inventory.realEstate
      .map(id => assetService.getRealEstate(id))
      .filter(a => a !== null) as any[];

    const escrowedRealEstateAssets = inventory.escrowedRealEstate
      .map(id => assetService.getRealEstate(id))
      .filter(a => a !== null) as any[];

    const privateEquityAssets = inventory.privateEquity
      .map(id => assetService.getPrivateEquity(id))
      .filter(a => a !== null) as any[];

    const escrowedPrivateEquityAssets = inventory.escrowedPrivateEquity
      .map(id => assetService.getPrivateEquity(id))
      .filter(a => a !== null) as any[];

    return {
      partyId: inventory.partyId,
      displayName: inventory.displayName,
      cash: inventory.cash,
      escrowedCash: inventory.escrowedCash,
      realEstateAssets,
      escrowedRealEstateAssets,
      privateEquityAssets,
      escrowedPrivateEquityAssets,
    };
  }

  /**
   * Add cash to party balance
   */
  addCash(partyId: string, amount: number): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    inventory.cash += amount;
    inventory.lastUpdated = new Date();
    console.log(`Added $${amount.toLocaleString()} to ${inventory.displayName} (new balance: $${inventory.cash.toLocaleString()})`);
    return true;
  }

  /**
   * Deduct cash from party balance
   */
  deductCash(partyId: string, amount: number): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) {
      console.error(`Inventory not found for ${partyId}`);
      return false;
    }

    if (inventory.cash < amount) {
      console.error(`Insufficient funds for ${inventory.displayName}: has $${inventory.cash.toLocaleString()}, needs $${amount.toLocaleString()}`);
      return false;
    }

    inventory.cash -= amount;
    inventory.lastUpdated = new Date();
    console.log(`Deducted $${amount.toLocaleString()} from ${inventory.displayName} (new balance: $${inventory.cash.toLocaleString()})`);
    return true;
  }

  /**
   * Add asset to party inventory
   */
  addAsset(partyId: string, assetId: string, assetType: 'real_estate' | 'private_equity'): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    if (assetType === 'real_estate') {
      if (!inventory.realEstate.includes(assetId)) {
        inventory.realEstate.push(assetId);
      }
    } else {
      if (!inventory.privateEquity.includes(assetId)) {
        inventory.privateEquity.push(assetId);
      }
    }

    inventory.lastUpdated = new Date();
    return true;
  }

  /**
   * Remove asset from party inventory
   */
  removeAsset(partyId: string, assetId: string, assetType: 'real_estate' | 'private_equity'): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    if (assetType === 'real_estate') {
      inventory.realEstate = inventory.realEstate.filter(id => id !== assetId);
    } else {
      inventory.privateEquity = inventory.privateEquity.filter(id => id !== assetId);
    }

    inventory.lastUpdated = new Date();
    return true;
  }

  /**
   * Check if party owns an asset
   */
  ownsAsset(partyId: string, assetId: string): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    return inventory.realEstate.includes(assetId) || inventory.privateEquity.includes(assetId);
  }

  /**
   * Verify party has sufficient cash
   */
  hasSufficientCash(partyId: string, amount: number): boolean {
    const inventory = this.getInventory(partyId);
    return inventory ? inventory.cash >= amount : false;
  }

  /**
   * Lock cash in escrow for a pending exchange
   */
  lockCashInEscrow(partyId: string, amount: number): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) {
      console.error(`Inventory not found for ${partyId}`);
      return false;
    }

    if (inventory.cash < amount) {
      console.error(`Insufficient available cash for ${inventory.displayName}: has $${inventory.cash.toLocaleString()}, needs $${amount.toLocaleString()}`);
      return false;
    }

    inventory.cash -= amount;
    inventory.escrowedCash += amount;
    inventory.lastUpdated = new Date();
    console.log(`🔒 Locked $${amount.toLocaleString()} in escrow for ${inventory.displayName}`);
    return true;
  }

  /**
   * Release cash from escrow (on cancel/reject)
   */
  releaseCashFromEscrow(partyId: string, amount: number): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    if (inventory.escrowedCash < amount) {
      console.error(`Insufficient escrowed cash to release for ${inventory.displayName}`);
      return false;
    }

    inventory.escrowedCash -= amount;
    inventory.cash += amount;
    inventory.lastUpdated = new Date();
    console.log(`🔓 Released $${amount.toLocaleString()} from escrow for ${inventory.displayName}`);
    return true;
  }

  /**
   * Transfer cash from escrow to recipient (on accept)
   */
  transferCashFromEscrow(fromPartyId: string, toPartyId: string, amount: number): boolean {
    const fromInventory = this.getInventory(fromPartyId);
    const toInventory = this.getInventory(toPartyId);
    
    if (!fromInventory || !toInventory) return false;

    if (fromInventory.escrowedCash < amount) {
      console.error(`Insufficient escrowed cash for ${fromInventory.displayName}`);
      return false;
    }

    fromInventory.escrowedCash -= amount;
    toInventory.cash += amount;
    fromInventory.lastUpdated = new Date();
    toInventory.lastUpdated = new Date();
    console.log(`💸 Transferred $${amount.toLocaleString()} from escrow: ${fromInventory.displayName} → ${toInventory.displayName}`);
    return true;
  }

  /**
   * Lock asset in escrow for a pending exchange
   */
  lockAssetInEscrow(partyId: string, assetId: string, assetType: 'real_estate' | 'private_equity'): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    if (assetType === 'real_estate') {
      if (!inventory.realEstate.includes(assetId)) {
        console.error(`Asset ${assetId} not in available inventory`);
        return false;
      }
      inventory.realEstate = inventory.realEstate.filter(id => id !== assetId);
      inventory.escrowedRealEstate.push(assetId);
    } else {
      if (!inventory.privateEquity.includes(assetId)) {
        console.error(`Asset ${assetId} not in available inventory`);
        return false;
      }
      inventory.privateEquity = inventory.privateEquity.filter(id => id !== assetId);
      inventory.escrowedPrivateEquity.push(assetId);
    }

    inventory.lastUpdated = new Date();
    console.log(`🔒 Locked ${assetType} asset ${assetId} in escrow for ${inventory.displayName}`);
    return true;
  }

  /**
   * Release asset from escrow (on cancel/reject)
   */
  releaseAssetFromEscrow(partyId: string, assetId: string, assetType: 'real_estate' | 'private_equity'): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    if (assetType === 'real_estate') {
      if (!inventory.escrowedRealEstate.includes(assetId)) {
        console.error(`Asset ${assetId} not in escrowed inventory`);
        return false;
      }
      inventory.escrowedRealEstate = inventory.escrowedRealEstate.filter(id => id !== assetId);
      inventory.realEstate.push(assetId);
    } else {
      if (!inventory.escrowedPrivateEquity.includes(assetId)) {
        console.error(`Asset ${assetId} not in escrowed inventory`);
        return false;
      }
      inventory.escrowedPrivateEquity = inventory.escrowedPrivateEquity.filter(id => id !== assetId);
      inventory.privateEquity.push(assetId);
    }

    inventory.lastUpdated = new Date();
    console.log(`🔓 Released ${assetType} asset ${assetId} from escrow for ${inventory.displayName}`);
    return true;
  }

  /**
   * Transfer asset from escrow to recipient (on accept)
   * Note: Asset ownership transfer is handled by assetService, this just moves inventory
   */
  transferAssetFromEscrow(fromPartyId: string, toPartyId: string, assetId: string, assetType: 'real_estate' | 'private_equity'): boolean {
    const fromInventory = this.getInventory(fromPartyId);
    const toInventory = this.getInventory(toPartyId);
    
    if (!fromInventory || !toInventory) return false;

    if (assetType === 'real_estate') {
      if (!fromInventory.escrowedRealEstate.includes(assetId)) {
        console.error(`Asset ${assetId} not in escrowed inventory for ${fromInventory.displayName}`);
        return false;
      }
      fromInventory.escrowedRealEstate = fromInventory.escrowedRealEstate.filter(id => id !== assetId);
      toInventory.realEstate.push(assetId);
    } else {
      if (!fromInventory.escrowedPrivateEquity.includes(assetId)) {
        console.error(`Asset ${assetId} not in escrowed inventory for ${fromInventory.displayName}`);
        return false;
      }
      fromInventory.escrowedPrivateEquity = fromInventory.escrowedPrivateEquity.filter(id => id !== assetId);
      toInventory.privateEquity.push(assetId);
    }

    fromInventory.lastUpdated = new Date();
    toInventory.lastUpdated = new Date();
    console.log(`💎 Transferred ${assetType} asset ${assetId} from escrow: ${fromInventory.displayName} → ${toInventory.displayName}`);
    return true;
  }

  /**
   * Check if party still owns asset (including escrowed)
   */
  ownsAssetIncludingEscrow(partyId: string, assetId: string): boolean {
    const inventory = this.getInventory(partyId);
    if (!inventory) return false;

    return inventory.realEstate.includes(assetId) || 
           inventory.escrowedRealEstate.includes(assetId) ||
           inventory.privateEquity.includes(assetId) ||
           inventory.escrowedPrivateEquity.includes(assetId);
  }

  /**
   * Atomically validate and lock cash in escrow
   * This prevents race conditions where validation passes but locking fails
   * due to concurrent operations
   */
  validateAndLockCash(partyId: string, amount: number): { success: boolean; error?: string } {
    const inventory = this.getInventory(partyId);
    if (!inventory) {
      return { success: false, error: `Inventory not found for party ${partyId}` };
    }

    // Atomic check and lock
    if (inventory.cash < amount) {
      return { 
        success: false, 
        error: `Insufficient cash for ${inventory.displayName}: has $${inventory.cash.toLocaleString()}, needs $${amount.toLocaleString()}` 
      };
    }

    // Lock immediately after validation
    inventory.cash -= amount;
    inventory.escrowedCash += amount;
    inventory.lastUpdated = new Date();
    console.log(`🔒 Atomically validated and locked $${amount.toLocaleString()} for ${inventory.displayName}`);
    
    return { success: true };
  }

  /**
   * Atomically validate and lock asset in escrow
   * This prevents race conditions where validation passes but locking fails
   */
  validateAndLockAsset(partyId: string, assetId: string, assetType: 'real_estate' | 'private_equity'): { success: boolean; error?: string } {
    const inventory = this.getInventory(partyId);
    if (!inventory) {
      return { success: false, error: `Inventory not found for party ${partyId}` };
    }

    // Atomic check and lock
    if (assetType === 'real_estate') {
      if (!inventory.realEstate.includes(assetId)) {
        return { success: false, error: `Asset ${assetId} not owned by party` };
      }
      inventory.realEstate = inventory.realEstate.filter(id => id !== assetId);
      inventory.escrowedRealEstate.push(assetId);
    } else {
      if (!inventory.privateEquity.includes(assetId)) {
        return { success: false, error: `Asset ${assetId} not owned by party` };
      }
      inventory.privateEquity = inventory.privateEquity.filter(id => id !== assetId);
      inventory.escrowedPrivateEquity.push(assetId);
    }

    inventory.lastUpdated = new Date();
    console.log(`🔒 Atomically validated and locked ${assetType} ${assetId} for ${inventory.displayName}`);
    
    return { success: true };
  }

  /**
   * Get all inventories (for admin/debugging)
   */
  getAllInventories(): PartyInventory[] {
    return Array.from(this.inventories.values());
  }
}

export default new InventoryService();

