/**
 * Asset Type Definitions
 * Supports Real Estate and Private Equity assets
 */

export type AssetType = 'real_estate' | 'private_equity' | 'cash';

export interface OwnershipHistory {
  timestamp: Date;
  fromParty: string;
  toParty: string;
  exchangeId: string;
  exchangedFor: {
    type: AssetType;
    description: string;
    value?: number;
  };
}

export interface RealEstateAsset {
  id: string;
  type: 'real_estate';
  name: string;
  propertyType: 'commercial' | 'residential' | 'industrial' | 'mixed_use';
  location: string;
  value: number;
  ownerId: string;
  history: OwnershipHistory[];
  createdAt: Date;
}

export interface PrivateEquityAsset {
  id: string;
  type: 'private_equity';
  name: string;
  industry: string;
  valuation: number;
  ownerId: string;
  history: OwnershipHistory[];
  createdAt: Date;
}

export type Asset = RealEstateAsset | PrivateEquityAsset;

export interface AssetRegistry {
  realEstate: Map<string, RealEstateAsset>;
  privateEquity: Map<string, PrivateEquityAsset>;
}

