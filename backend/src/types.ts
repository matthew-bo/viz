// Canton transaction with full metadata
export interface CantonTransaction {
  // Contract identifiers
  contractId: string;           // Canton contract ID (unique)
  templateId: string;           // "Payment:PaymentRequest" or "Payment:Payment"
  
  // Transaction metadata (from Canton)
  transactionId: string;        // Canton transaction ID
  offset: string;               // Ledger offset (ordering proof)
  recordTime: string;           // ISO timestamp when recorded
  
  // Contract payload (from Daml template)
  payload: {
    sender: string;             // Full party ID with fingerprint
    receiver: string;           // Full party ID with fingerprint
    amount: string;             // Decimal as string (e.g., "1000.00")
    currency: string;           // "USD"
    description: string;        // User-provided text
    submittedAt: string;        // ISO timestamp
    committedAt?: string;       // ISO timestamp (only for Payment template)
    rwaType?: string;           // RWA asset type (optional)
    rwaDetails?: string;        // JSON string with RWA metadata (optional)
  };
  
  // Privacy information (from Canton)
  signatories: string[];        // Parties who signed
  observers: string[];          // Parties who can see
  
  // UI state (derived from templateId)
  status: 'pending' | 'committed' | 'rejected';
  
  // Display name mapping (for UI convenience)
  senderDisplayName: string;    // "TechBank" (extracted from party ID)
  receiverDisplayName: string;  // "GlobalCorp" (extracted from party ID)
}

// Party configuration
export interface PartyConfig {
  displayName: string;          // "TechBank"
  partyId: string;              // "TechBank::1220f8135b39..."
  ledgerApiUrl: string;         // "http://canton-participant1:5011"
}

// Exchange offer structure
export interface ExchangeOfferData {
  type: 'cash' | 'real_estate' | 'private_equity';
  cashAmount?: number;
  assetId?: string;
  assetName?: string;
  assetValue?: number;
}

// Exchange transaction (from DAML ExchangeProposal/Exchange contracts)
export interface ExchangeTransaction {
  id: string;
  contractId: string;
  fromParty: string;
  fromPartyName: string;
  toParty: string;
  toPartyName: string;
  offering: ExchangeOfferData;
  requesting: ExchangeOfferData;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  acceptedAt?: string;
}

