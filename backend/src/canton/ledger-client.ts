import dotenv from 'dotenv';
dotenv.config();

import Ledger from '@daml/ledger';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { CantonTransaction, PartyConfig, ExchangeTransaction, ExchangeOfferData } from '../types';
import { PaymentRequest, Payment } from '../daml-types/payment-demo-0.0.1/lib/Payment';
import { 
  ExchangeProposal as ExchangeProposalTemplate, 
  Exchange as ExchangeTemplate,
  ExchangeProposalData,
  ExchangeData,
  ExchangeOffer,
  OfferType
} from '../daml-types/payment-demo-0.0.1/lib/Exchange';
import { config } from '../config';

/**
 * Create JWT token for Canton Ledger API authentication
 * Canton requires specific JWT claim structure
 * Each participant has its own ledger ID (participant1, participant2, participant3)
 */
function createCantonToken(partyId: string, ledgerId: string): string {
  const secret = config.jwt.secret;
  
  const payload = {
    "https://daml.com/ledger-api": {
      actAs: [partyId],                    // Party this token acts as
      ledgerId: ledgerId,                  // Must match Canton's ledger ID
      applicationId: "canton-privacy-demo" // Application identifier
    }
  };
  
  const options: jwt.SignOptions = { 
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn as StringValue | number
  };
  
  return jwt.sign(payload, secret, options);
}

/**
 * Canton Ledger Client
 * Handles all interactions with Canton blockchain via Ledger API
 */
export class CantonLedgerClient {
  private ledgers: Map<string, Ledger>;
  private parties: Map<string, PartyConfig & { ledgerId: string }>;
  
  constructor() {
    console.log('Initializing Canton Ledger Client...');
    
    // Load party configurations from environment variables
    // Each party has its own participant with a unique ledger ID
    const parties: Array<PartyConfig & { ledgerId: string }> = [
      {
        displayName: 'TechBank',
        partyId: process.env.TECHBANK_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT1_LEDGER_API!,
        ledgerId: 'participant1'  // Single-node: all parties on participant1
      },
      {
        displayName: 'GlobalCorp',
        partyId: process.env.GLOBALCORP_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT2_LEDGER_API!,
        ledgerId: 'participant1'  // Single-node: all parties on participant1
      },
      {
        displayName: 'RetailFinance',
        partyId: process.env.RETAILFINANCE_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT3_LEDGER_API!,
        ledgerId: 'participant1'  // Single-node: all parties on participant1
      }
    ];
    
    // Validate all party IDs are present
    for (const party of parties) {
      if (!party.partyId || !party.ledgerApiUrl) {
        throw new Error(`Missing configuration for party: ${party.displayName}`);
      }
    }
    
    // Create ledger connections for each party
    this.ledgers = new Map();
    this.parties = new Map();
    
    for (const party of parties) {
      console.log(`Setting up ledger connection for ${party.displayName}...`);
      console.log(`  Party ID: ${party.partyId}`);
      console.log(`  Ledger API: ${party.ledgerApiUrl}`);
      console.log(`  Ledger ID: ${party.ledgerId}`);
      
      // Create JWT token for this party with correct ledger ID
      const token = createCantonToken(party.partyId, party.ledgerId);
      
      // Create Ledger instance
      // Note: Canton Ledger API requires URLs to end with '/'
      const httpBaseUrl = party.ledgerApiUrl.endsWith('/') 
        ? party.ledgerApiUrl 
        : `${party.ledgerApiUrl}/`;
      
      const ledger = new Ledger({
        token: token,
        httpBaseUrl: httpBaseUrl
      });
      
      this.ledgers.set(party.displayName, ledger);
      this.parties.set(party.displayName, party);
    }
    
    console.log('✓ Canton Ledger Client initialized');
    console.log(`✓ Connected to ${this.ledgers.size} participants`);
  }
  
  /**
   * Get full party ID by display name
   */
  getPartyId(displayName: string): string {
    const party = this.parties.get(displayName);
    if (!party) {
      throw new Error(`Unknown party: ${displayName}`);
    }
    return party.partyId;
  }
  
  /**
   * Submit PaymentRequest contract (sender signs)
   */
  async submitPaymentRequest(
    senderName: string,
    receiverName: string,
    amount: number,
    description: string,
    rwaType?: string,
    rwaDetails?: string
  ): Promise<CantonTransaction> {
    console.log(`Submitting PaymentRequest: ${senderName} → ${receiverName}, $${amount}${rwaType ? ` (${rwaType})` : ''}`);
    
    // Get sender's ledger connection
    const senderLedger = this.ledgers.get(senderName);
    if (!senderLedger) {
      throw new Error(`Unknown sender: ${senderName}`);
    }
    
    // Get party IDs
    const senderPartyId = this.getPartyId(senderName);
    const receiverPartyId = this.getPartyId(receiverName);
    
    try {
      // Submit contract creation to Canton using generated types
      const result = await senderLedger.create(PaymentRequest, {
        sender: senderPartyId,
        receiver: receiverPartyId,
        amount: amount.toString(),
        currency: 'USD',
        description: description,
        submittedAt: new Date().toISOString(),
        rwaType: rwaType || null,
        rwaDetails: rwaDetails || null
      });
      
      console.log(`✓ PaymentRequest created: ${result.contractId}`);
      
      return this.formatPaymentRequest(result, senderName, receiverName);
    } catch (error: any) {
      console.error('Failed to submit PaymentRequest:', error);
      throw new Error(`Canton submission failed: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Accept PaymentRequest (receiver signs, creates Payment)
   */
  async acceptPaymentRequest(
    receiverName: string,
    contractId: string
  ): Promise<CantonTransaction> {
    console.log(`Accepting PaymentRequest: ${contractId} by ${receiverName}`);
    
    // Get receiver's ledger connection
    const receiverLedger = this.ledgers.get(receiverName);
    if (!receiverLedger) {
      throw new Error(`Unknown receiver: ${receiverName}`);
    }
    
    try {
      // Exercise Accept choice on PaymentRequest using generated types
      // Result is a tuple: [ContractId<Payment>, Event[]]
      const [paymentContractId, events] = await receiverLedger.exercise(
        PaymentRequest.Accept,
        contractId as any,  // Cast string to ContractId type
        {}  // Accept choice takes no arguments
      );
      
      console.log(`✓ Accept choice exercised, Payment created: ${paymentContractId}`);
      
      // Query to get full Payment contract details
      const contracts = await receiverLedger.query(Payment);
      
      const payment = contracts.find((c: any) => c.contractId === paymentContractId);
      
      if (!payment) {
        throw new Error('Payment contract not found after accept');
      }
      
      console.log(`✓ Payment contract retrieved: ${payment.contractId}`);
      
      return this.formatPayment(payment);
    } catch (error: any) {
      console.error('Failed to accept PaymentRequest:', error);
      throw new Error(`Canton accept failed: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Query all contracts visible to a party
   * Privacy filtering happens at Canton level
   */
  async getTransactions(partyName?: string): Promise<CantonTransaction[]> {
    console.log(`Querying transactions${partyName ? ` for ${partyName}` : ' (all parties)'}`);
    
    // Get ledger connection
    const ledger = partyName 
      ? this.ledgers.get(partyName)
      : this.ledgers.values().next().value;
    
    if (!ledger) {
      throw new Error(`Unknown party: ${partyName}`);
    }
    
    try {
      // Query both PaymentRequest and Payment contracts using generated types
      const [requests, payments] = await Promise.all([
        ledger.query(PaymentRequest),
        ledger.query(Payment)
      ]);
      
      console.log(`✓ Found ${requests.length} PaymentRequests, ${payments.length} Payments`);
      
      // Format PaymentRequests
      const formattedRequests = requests.map((r: any) => 
        this.formatPaymentRequest(
          r, 
          this.getDisplayName(r.payload.sender), 
          this.getDisplayName(r.payload.receiver)
        )
      );
      
      // Format Payments
      const formattedPayments = payments.map((p: any) => this.formatPayment(p));
      
      // Combine and sort by creation time (newest first)
      const allTransactions = [...formattedRequests, ...formattedPayments].sort((a, b) => 
        new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime()
      );
      
      return allTransactions;
    } catch (error: any) {
      console.error('Failed to query transactions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Canton query failed: ${JSON.stringify(error)}`);
    }
  }
  
  /**
   * Get all parties for UI
   */
  getAllParties(): PartyConfig[] {
    return Array.from(this.parties.values());
  }
  
  /**
   * Format PaymentRequest contract for API response
   */
  private formatPaymentRequest(
    contract: any,
    senderDisplayName: string,
    receiverDisplayName: string
  ): CantonTransaction {
    return {
      contractId: contract.contractId,
      templateId: 'Payment:PaymentRequest',
      transactionId: contract.transactionId || contract.contractId,
      offset: contract.offset || '0',
      recordTime: contract.recordTime || new Date().toISOString(),
      payload: contract.payload,
      signatories: contract.signatories || [contract.payload.sender],
      observers: contract.observers || [contract.payload.receiver],
      status: 'pending',
      senderDisplayName: senderDisplayName,
      receiverDisplayName: receiverDisplayName
    };
  }
  
  /**
   * Format Payment contract for API response
   */
  private formatPayment(contract: any): CantonTransaction {
    return {
      contractId: contract.contractId,
      templateId: 'Payment:Payment',
      transactionId: contract.transactionId || contract.contractId,
      offset: contract.offset || '0',
      recordTime: contract.recordTime || new Date().toISOString(),
      payload: contract.payload,
      signatories: contract.signatories || [contract.payload.sender, contract.payload.receiver],
      observers: contract.observers || [],
      status: 'committed',
      senderDisplayName: this.getDisplayName(contract.payload.sender),
      receiverDisplayName: this.getDisplayName(contract.payload.receiver)
    };
  }
  
  /**
   * Extract display name from party ID
   * Party ID format: "TechBank::1220f8135b39..."
   */
  private getDisplayName(partyId: string): string {
    return partyId.split('::')[0];
  }

  // ========================================
  // EXCHANGE CONTRACT METHODS
  // ========================================

  /**
   * Create an ExchangeProposal contract
   * Proposer's assets are conceptually locked when this contract exists
   */
  async createExchangeProposal(
    proposerName: string,
    responderName: string,
    offering: { type: string; cashAmount?: number; assetId?: string; assetName?: string; assetValue?: number },
    requesting: { type: string; cashAmount?: number; assetId?: string; assetName?: string; assetValue?: number },
    description?: string
  ): Promise<ExchangeTransaction> {
    const proposerLedger = this.ledgers.get(proposerName);
    if (!proposerLedger) {
      throw new Error(`Unknown proposer: ${proposerName}`);
    }

    const proposerPartyId = this.getPartyId(proposerName);
    const responderPartyId = this.getPartyId(responderName);

    const offerTypeMap: Record<string, OfferType> = {
      'cash': 'Cash',
      'real_estate': 'RealEstate',
      'private_equity': 'PrivateEquity'
    };

    const damlOffering: ExchangeOffer = {
      offerType: offerTypeMap[offering.type] || 'Cash',
      cashAmount: offering.cashAmount?.toString() || null,
      assetId: offering.assetId || null,
      assetName: offering.assetName || null,
      assetValue: offering.assetValue?.toString() || null
    };

    const damlRequesting: ExchangeOffer = {
      offerType: offerTypeMap[requesting.type] || 'Cash',
      cashAmount: requesting.cashAmount?.toString() || null,
      assetId: requesting.assetId || null,
      assetName: requesting.assetName || null,
      assetValue: requesting.assetValue?.toString() || null
    };

    try {
      const result = await proposerLedger.create(ExchangeProposalTemplate as any, {
        proposer: proposerPartyId,
        responder: responderPartyId,
        proposerName: proposerName,
        responderName: responderName,
        offering: damlOffering,
        requesting: damlRequesting,
        description: description || null,
        createdAt: new Date().toISOString()
      });

      return this.formatExchangeProposal(result, proposerName, responderName);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create exchange proposal: ${message}`);
    }
  }

  /**
   * Accept an ExchangeProposal (responder signs, creates Exchange)
   */
  async acceptExchangeProposal(
    responderName: string,
    contractId: string
  ): Promise<ExchangeTransaction> {
    const responderLedger = this.ledgers.get(responderName);
    if (!responderLedger) {
      throw new Error(`Unknown responder: ${responderName}`);
    }

    try {
      const [exchangeContractId] = await responderLedger.exercise(
        ExchangeProposalTemplate.AcceptExchange as any,
        contractId as any,
        {}
      );

      // Query to get the completed Exchange contract
      const exchanges = await responderLedger.query(ExchangeTemplate as any);
      const exchange = exchanges.find((e: any) => e.contractId === exchangeContractId);

      if (!exchange) {
        throw new Error('Exchange contract not found after acceptance');
      }

      return this.formatExchange(exchange);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to accept exchange: ${message}`);
    }
  }

  /**
   * Cancel an ExchangeProposal (proposer only)
   */
  async cancelExchangeProposal(
    proposerName: string,
    contractId: string
  ): Promise<void> {
    const proposerLedger = this.ledgers.get(proposerName);
    if (!proposerLedger) {
      throw new Error(`Unknown proposer: ${proposerName}`);
    }

    try {
      await proposerLedger.exercise(
        ExchangeProposalTemplate.CancelExchange as any,
        contractId as any,
        {}
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to cancel exchange: ${message}`);
    }
  }

  /**
   * Reject an ExchangeProposal (responder only)
   */
  async rejectExchangeProposal(
    responderName: string,
    contractId: string
  ): Promise<void> {
    const responderLedger = this.ledgers.get(responderName);
    if (!responderLedger) {
      throw new Error(`Unknown responder: ${responderName}`);
    }

    try {
      await responderLedger.exercise(
        ExchangeProposalTemplate.RejectExchange as any,
        contractId as any,
        {}
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to reject exchange: ${message}`);
    }
  }

  /**
   * Query all exchange contracts
   */
  async getExchanges(partyName?: string): Promise<ExchangeTransaction[]> {
    const ledger = partyName 
      ? this.ledgers.get(partyName)
      : this.ledgers.values().next().value;

    if (!ledger) {
      throw new Error(`Unknown party: ${partyName}`);
    }

    try {
      const [proposals, completed] = await Promise.all([
        ledger.query(ExchangeProposalTemplate as any),
        ledger.query(ExchangeTemplate as any)
      ]);

      const formattedProposals = proposals.map((p: any) => 
        this.formatExchangeProposal(p, p.payload.proposerName, p.payload.responderName)
      );

      const formattedExchanges = completed.map((e: any) => this.formatExchange(e));

      return [...formattedProposals, ...formattedExchanges].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to query exchanges: ${message}`);
    }
  }

  /**
   * Format ExchangeProposal for API response
   */
  private formatExchangeProposal(
    contract: any,
    proposerName: string,
    responderName: string
  ): ExchangeTransaction {
    const payload = contract.payload;
    return {
      id: contract.contractId,
      contractId: contract.contractId,
      fromParty: payload.proposer,
      fromPartyName: proposerName,
      toParty: payload.responder,
      toPartyName: responderName,
      offering: this.convertDamlOffer(payload.offering),
      requesting: this.convertDamlOffer(payload.requesting),
      description: payload.description || undefined,
      status: 'pending',
      createdAt: payload.createdAt
    };
  }

  /**
   * Format completed Exchange for API response
   */
  private formatExchange(contract: any): ExchangeTransaction {
    const payload = contract.payload;
    return {
      id: contract.contractId,
      contractId: contract.contractId,
      fromParty: payload.proposer,
      fromPartyName: payload.proposerName,
      toParty: payload.responder,
      toPartyName: payload.responderName,
      offering: this.convertDamlOffer(payload.offering),
      requesting: this.convertDamlOffer(payload.requesting),
      description: payload.description || undefined,
      status: 'accepted',
      createdAt: payload.createdAt,
      acceptedAt: payload.acceptedAt
    };
  }

  /**
   * Convert DAML ExchangeOffer to API format
   */
  private convertDamlOffer(damlOffer: ExchangeOffer): ExchangeOfferData {
    const typeMap: Record<OfferType, 'cash' | 'real_estate' | 'private_equity'> = {
      'Cash': 'cash',
      'RealEstate': 'real_estate',
      'PrivateEquity': 'private_equity'
    };

    return {
      type: typeMap[damlOffer.offerType] || 'cash',
      cashAmount: damlOffer.cashAmount ? parseFloat(damlOffer.cashAmount) : undefined,
      assetId: damlOffer.assetId || undefined,
      assetName: damlOffer.assetName || undefined,
      assetValue: damlOffer.assetValue ? parseFloat(damlOffer.assetValue) : undefined
    };
  }
}
