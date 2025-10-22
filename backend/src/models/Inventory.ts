/**
 * Party Inventory Model
 * Tracks cash balance and owned assets for each party
 */

import { RealEstateAsset, PrivateEquityAsset } from './Asset';

export interface PartyInventory {
  partyId: string;
  displayName: string;
  cash: number; // Available cash balance in dollars
  escrowedCash: number; // Cash locked in pending exchanges
  realEstate: string[]; // Available asset IDs
  escrowedRealEstate: string[]; // Asset IDs locked in pending exchanges
  privateEquity: string[]; // Available asset IDs
  escrowedPrivateEquity: string[]; // Asset IDs locked in pending exchanges
  lastUpdated: Date;
}

export interface InventoryRegistry {
  inventories: Map<string, PartyInventory>;
}

export interface InventorySnapshot {
  partyId: string;
  displayName: string;
  cash: number; // Available cash
  escrowedCash: number; // Cash locked in pending exchanges
  realEstateAssets: RealEstateAsset[]; // Available assets
  escrowedRealEstateAssets: RealEstateAsset[]; // Assets locked in pending exchanges
  privateEquityAssets: PrivateEquityAsset[]; // Available assets
  escrowedPrivateEquityAssets: PrivateEquityAsset[]; // Assets locked in pending exchanges
}

