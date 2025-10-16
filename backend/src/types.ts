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

