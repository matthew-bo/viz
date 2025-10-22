/**
 * Asset Service
 * Manages asset registry and CRUD operations
 */

import { Asset, RealEstateAsset, PrivateEquityAsset, AssetRegistry, OwnershipHistory } from '../models/Asset';

class AssetService {
  private realEstate: Map<string, RealEstateAsset> = new Map();
  private privateEquity: Map<string, PrivateEquityAsset> = new Map();

  /**
   * Initialize asset registry with seed data
   */
  initialize() {
    // Will be populated by seed script
    console.log('Asset registry initialized');
  }

  /**
   * Add real estate asset
   */
  addRealEstate(asset: RealEstateAsset): void {
    this.realEstate.set(asset.id, asset);
  }

  /**
   * Add private equity asset
   */
  addPrivateEquity(asset: PrivateEquityAsset): void {
    this.privateEquity.set(asset.id, asset);
  }

  /**
   * Get asset by ID (checks both types)
   */
  getAsset(assetId: string): Asset | null {
    return this.realEstate.get(assetId) || this.privateEquity.get(assetId) || null;
  }

  /**
   * Get real estate asset by ID
   */
  getRealEstate(assetId: string): RealEstateAsset | null {
    return this.realEstate.get(assetId) || null;
  }

  /**
   * Get private equity asset by ID
   */
  getPrivateEquity(assetId: string): PrivateEquityAsset | null {
    return this.privateEquity.get(assetId) || null;
  }

  /**
   * Get all real estate assets
   */
  getAllRealEstate(): RealEstateAsset[] {
    return Array.from(this.realEstate.values());
  }

  /**
   * Get all private equity assets
   */
  getAllPrivateEquity(): PrivateEquityAsset[] {
    return Array.from(this.privateEquity.values());
  }

  /**
   * Get assets owned by a specific party
   */
  getAssetsByOwner(ownerId: string): { realEstate: RealEstateAsset[]; privateEquity: PrivateEquityAsset[] } {
    const realEstate = this.getAllRealEstate().filter(a => a.ownerId === ownerId);
    const privateEquity = this.getAllPrivateEquity().filter(a => a.ownerId === ownerId);
    return { realEstate, privateEquity };
  }

  /**
   * Transfer ownership of an asset
   */
  transferOwnership(assetId: string, newOwnerId: string, historyEntry: OwnershipHistory): boolean {
    const asset = this.getAsset(assetId);
    if (!asset) {
      console.error(`Asset ${assetId} not found`);
      return false;
    }

    asset.ownerId = newOwnerId;
    asset.history.push(historyEntry);
    
    console.log(`Asset ${assetId} transferred to ${newOwnerId}`);
    return true;
  }

  /**
   * Get asset ownership history
   */
  getAssetHistory(assetId: string): OwnershipHistory[] {
    const asset = this.getAsset(assetId);
    return asset ? asset.history : [];
  }

  /**
   * Verify asset ownership
   */
  verifyOwnership(assetId: string, ownerId: string): boolean {
    const asset = this.getAsset(assetId);
    return asset?.ownerId === ownerId;
  }
}

export default new AssetService();

