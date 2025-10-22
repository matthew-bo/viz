// TypeScript interfaces matching backend exactly
// Must stay in sync with backend/src/types.ts

export interface Transaction {
  // Contract identifiers
  contractId: string;
  templateId: string; // "Payment:PaymentRequest" or "Payment:Payment"
  
  // Transaction metadata (from Canton)
  transactionId: string;
  offset: string;
  recordTime: string; // ISO timestamp
  
  // Contract payload
  payload: {
    sender: string; // Full party ID with fingerprint
    receiver: string; // Full party ID with fingerprint
    amount: string; // Decimal as string
    currency: string; // "USD"
    description: string;
    submittedAt: string; // ISO timestamp
    committedAt?: string; // ISO timestamp (only for Payment)
    rwaType?: string; // RWA asset type (e.g., "corporate_bonds")
    rwaDetails?: string; // JSON string with RWA metadata
  };
  
  // Privacy information
  signatories: string[];
  observers: string[];
  
  // UI state (derived from templateId)
  status: 'pending' | 'committed' | 'rejected';
  
  // Display names (extracted from party IDs)
  senderDisplayName: string; // "TechBank"
  receiverDisplayName: string; // "GlobalCorp"
}

export interface Party {
  displayName: string; // "TechBank"
  partyId: string; // "TechBank::1220..."
  ledgerApiUrl: string; // "http://localhost:7011/"
  color: string; // Hex color for UI visualization
}

// RWA (Real World Asset) details
export interface RWADetails {
  type: 'cash' | 'corporate_bonds' | 'treasury_bills' | 'commercial_paper' | 'equity' | 'commodities';
  name: string;
  issuer?: string;
  maturity?: string;
  couponRate?: number;
  faceValue?: number;
  quantity?: number;
  ticker?: string;
  shares?: number;
  pricePerShare?: number;
  unit?: string; // For commodities
  unitPrice?: number;
  value: number;
}

// Business metrics for dashboard
export interface BusinessMetrics {
  totalValue: number;
  transactionCount: number;
  pendingCount: number;
  committedCount: number;
  rwaBreakdown: {
    type: string;
    value: number;
    count: number;
  }[];
}

// Asset Types for Exchange System
export type AssetType = 'real_estate' | 'private_equity' | 'cash';

export interface OwnershipHistory {
  timestamp: string;
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
  createdAt: string;
}

export interface PrivateEquityAsset {
  id: string;
  type: 'private_equity';
  name: string;
  industry: string;
  valuation: number;
  ownerId: string;
  history: OwnershipHistory[];
  createdAt: string;
}

export type Asset = RealEstateAsset | PrivateEquityAsset;

// Exchange System Types
export interface ExchangeOffer {
  type: AssetType;
  // For cash
  cashAmount?: number;
  // For assets
  assetId?: string;
  assetName?: string;
  assetValue?: number;
}

export interface ExchangeProposal {
  id: string;
  fromParty: string;
  fromPartyName: string;
  toParty: string;
  toPartyName: string;
  offering: ExchangeOffer;
  requesting: ExchangeOffer;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  acceptedAt?: string;
}

// Inventory Types
export interface PartyInventory {
  partyId: string;
  displayName: string;
  cash: number; // Available cash
  escrowedCash: number; // Cash locked in pending exchanges
  realEstateAssets: RealEstateAsset[]; // Available assets
  escrowedRealEstateAssets: RealEstateAsset[]; // Assets locked in pending exchanges
  privateEquityAssets: PrivateEquityAsset[]; // Available assets
  escrowedPrivateEquityAssets: PrivateEquityAsset[]; // Assets locked in pending exchanges
}

