/**
 * Exchange Adapter - Maps exchanges to transaction format
 * This allows us to reuse all existing transaction UI components
 */

import { ExchangeProposal, Transaction } from '../types';

/**
 * Convert an exchange to a transaction-compatible format
 * This lets us display exchanges in TransactionList, Timeline, Synchronizer, etc.
 */
export function exchangeToTransaction(exchange: ExchangeProposal): Transaction {
  const offerDesc = exchange.offering.type === 'cash' 
    ? `$${exchange.offering.cashAmount?.toLocaleString()}`
    : exchange.offering.assetName || exchange.offering.type;
    
  const requestDesc = exchange.requesting.type === 'cash'
    ? `$${exchange.requesting.cashAmount?.toLocaleString()}`
    : exchange.requesting.assetName || exchange.requesting.type;

  // Build a description that shows the exchange nature
  const description = exchange.description 
    ? `${exchange.description} (${offerDesc} ↔ ${requestDesc})`
    : `Exchange: ${offerDesc} ↔ ${requestDesc}`;

  return {
    // Map exchange ID to contract ID
    contractId: exchange.id,
    
    // Use a special template ID to indicate this is an exchange
    templateId: 'Exchange:AssetExchange',
    
    // Transaction ID (same as exchange ID for simplicity)
    transactionId: exchange.id,
    
    // Canton metadata (not applicable but required by interface)
    offset: '0',
    recordTime: exchange.createdAt,
    
    // Payload maps exchange details
    payload: {
      sender: exchange.fromParty,
      receiver: exchange.toParty,
      // Use offering value or 0 for display
      amount: exchange.offering.cashAmount?.toString() || 
              exchange.offering.assetValue?.toString() || '0',
      currency: 'USD',
      description: description,
      submittedAt: exchange.createdAt,
      committedAt: exchange.acceptedAt,
      // Store exchange type info in RWA fields (clever reuse!)
      rwaType: exchange.offering.type,
      rwaDetails: JSON.stringify({
        exchangeId: exchange.id,
        offering: exchange.offering,
        requesting: exchange.requesting,
      }),
    },
    
    // Privacy info
    signatories: [exchange.fromParty, exchange.toParty],
    observers: [],
    
    // Status mapping
    status: exchange.status === 'accepted' ? 'committed' : 
            exchange.status === 'pending' ? 'pending' : 'rejected',
    
    // Display names
    senderDisplayName: exchange.fromPartyName,
    receiverDisplayName: exchange.toPartyName,
  };
}

/**
 * Convert multiple exchanges to transactions
 */
export function exchangesToTransactions(exchanges: ExchangeProposal[]): Transaction[] {
  return exchanges.map(exchangeToTransaction);
}

/**
 * Check if a transaction is actually an exchange
 */
export function isExchangeTransaction(transaction: Transaction): boolean {
  return transaction.templateId === 'Exchange:AssetExchange';
}

/**
 * Extract exchange details from a transaction
 */
export function getExchangeDetails(transaction: Transaction): {
  offering: any;
  requesting: any;
} | null {
  if (!isExchangeTransaction(transaction)) return null;
  
  try {
    const details = JSON.parse(transaction.payload.rwaDetails || '{}');
    return {
      offering: details.offering,
      requesting: details.requesting,
    };
  } catch {
    return null;
  }
}

