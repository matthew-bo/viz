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

