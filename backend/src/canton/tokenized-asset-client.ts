/**
 * Tokenized Asset Client
 * 
 * Manages tokenized assets on the Canton ledger with TRUE escrow.
 * 
 * Escrow Flow:
 * 1. Proposer creates ProposeExchangeWith* helper contract
 * 2. Proposer exercises ExecuteProposal → atomically archives asset + creates proposal
 * 3. Responder exercises Accept* → atomically swaps assets
 * 4. OR: Cancel/Reject → returns escrowed asset to proposer
 */

import Ledger from '@daml/ledger';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../config';
import { PartyConfig } from '../types';

import {
  CashHolding,
  CashHoldingData,
  RealEstateToken,
  RealEstateTokenData,
  PrivateEquityToken,
  PrivateEquityTokenData,
  RequestSpec
} from '../daml-types/payment-demo-0.0.1/lib/Asset';

import {
  EscrowedExchangeProposal,
  EscrowedExchangeProposalData,
  CompletedExchange,
  CompletedExchangeData,
  ProposeExchangeWithCash,
  ProposeExchangeWithRealEstate,
  ProposeExchangeWithPrivateEquity
} from '../daml-types/payment-demo-0.0.1/lib/AtomicExchange';

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface TokenizedCashBalance {
  contractId: string;
  owner: string;
  ownerName: string;
  amount: number;
  currency: string;
}

export interface TokenizedRealEstate {
  contractId: string;
  owner: string;
  ownerName: string;
  assetId: string;
  name: string;
  location: string;
  propertyType: string;
  squareFeet: number;
  value: number;
}

export interface TokenizedPrivateEquity {
  contractId: string;
  owner: string;
  ownerName: string;
  assetId: string;
  companyName: string;
  industry: string;
  ownershipPercentage: number;
  valuation: number;
}

export interface TokenizedInventory {
  partyId: string;
  displayName: string;
  cash: TokenizedCashBalance[];
  realEstate: TokenizedRealEstate[];
  privateEquity: TokenizedPrivateEquity[];
  totalCashValue: number;
  totalAssetValue: number;
}

export interface ExchangeProposalInfo {
  contractId: string;
  proposer: string;
  proposerName: string;
  responder: string;
  responderName: string;
  escrowed: {
    type: 'cash' | 'real_estate' | 'private_equity';
    description: string;
    value: number;
  };
  requesting: {
    type: string;
    amount?: number;
    assetId?: string;
  };
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

// ============================================================
// JWT TOKEN CREATION
// ============================================================

function createToken(partyId: string, ledgerId: string): string {
  const payload = {
    "https://daml.com/ledger-api": {
      actAs: [partyId],
      ledgerId: ledgerId,
      applicationId: "canton-privacy-demo"
    }
  };
  
  return jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn as StringValue | number
  });
}

// ============================================================
// TOKENIZED ASSET CLIENT
// ============================================================

export class TokenizedAssetClient {
  private ledgers: Map<string, Ledger> = new Map();
  private parties: Map<string, PartyConfig & { ledgerId: string }> = new Map();

  constructor() {
    this.initializeLedgerConnections();
  }

  private initializeLedgerConnections(): void {
    const partyConfigs: Array<PartyConfig & { ledgerId: string }> = [
      {
        displayName: 'TechBank',
        partyId: process.env.TECHBANK_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT1_LEDGER_API!,
        ledgerId: 'participant1'
      },
      {
        displayName: 'GlobalCorp',
        partyId: process.env.GLOBALCORP_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT2_LEDGER_API!,
        ledgerId: 'participant1'
      },
      {
        displayName: 'RetailFinance',
        partyId: process.env.RETAILFINANCE_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT3_LEDGER_API!,
        ledgerId: 'participant1'
      }
    ];

    for (const party of partyConfigs) {
      if (!party.partyId || !party.ledgerApiUrl) continue;

      const token = createToken(party.partyId, party.ledgerId);
      const httpBaseUrl = party.ledgerApiUrl.endsWith('/') 
        ? party.ledgerApiUrl 
        : `${party.ledgerApiUrl}/`;

      this.ledgers.set(party.displayName, new Ledger({ token, httpBaseUrl }));
      this.parties.set(party.displayName, party);
    }
  }

  private getLedger(partyName: string): Ledger {
    const ledger = this.ledgers.get(partyName);
    if (!ledger) throw new Error(`Unknown party: ${partyName}`);
    return ledger;
  }

  private getPartyId(partyName: string): string {
    const party = this.parties.get(partyName);
    if (!party) throw new Error(`Unknown party: ${partyName}`);
    return party.partyId;
  }

  private getPartyName(partyId: string): string {
    return partyId.split('::')[0];
  }

  // ============================================================
  // ASSET CREATION
  // ============================================================

  async createCashHolding(
    ownerName: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<TokenizedCashBalance> {
    const ledger = this.getLedger(ownerName);
    const ownerPartyId = this.getPartyId(ownerName);

    const result = await ledger.create(CashHolding as any, {
      owner: ownerPartyId,
      amount: amount.toString(),
      currency
    });

    return {
      contractId: result.contractId,
      owner: ownerPartyId,
      ownerName,
      amount,
      currency
    };
  }

  async createRealEstateToken(
    ownerName: string,
    assetId: string,
    name: string,
    location: string,
    propertyType: string,
    squareFeet: number,
    value: number
  ): Promise<TokenizedRealEstate> {
    const ledger = this.getLedger(ownerName);
    const ownerPartyId = this.getPartyId(ownerName);

    const result = await ledger.create(RealEstateToken as any, {
      owner: ownerPartyId,
      assetId,
      name,
      location,
      propertyType,
      squareFeet,
      value: value.toString()
    });

    return {
      contractId: result.contractId,
      owner: ownerPartyId,
      ownerName,
      assetId,
      name,
      location,
      propertyType,
      squareFeet,
      value
    };
  }

  async createPrivateEquityToken(
    ownerName: string,
    assetId: string,
    companyName: string,
    industry: string,
    ownershipPercentage: number,
    valuation: number
  ): Promise<TokenizedPrivateEquity> {
    const ledger = this.getLedger(ownerName);
    const ownerPartyId = this.getPartyId(ownerName);

    const result = await ledger.create(PrivateEquityToken as any, {
      owner: ownerPartyId,
      assetId,
      companyName,
      industry,
      ownershipPercentage: ownershipPercentage.toString(),
      valuation: valuation.toString()
    });

    return {
      contractId: result.contractId,
      owner: ownerPartyId,
      ownerName,
      assetId,
      companyName,
      industry,
      ownershipPercentage,
      valuation
    };
  }

  // ============================================================
  // ASSET QUERIES
  // ============================================================

  async getTokenizedInventory(partyName: string): Promise<TokenizedInventory> {
    const ledger = this.getLedger(partyName);
    const partyId = this.getPartyId(partyName);

    const [cashContracts, realEstateContracts, privateEquityContracts] = await Promise.all([
      ledger.query(CashHolding as any),
      ledger.query(RealEstateToken as any),
      ledger.query(PrivateEquityToken as any)
    ]);

    const cash: TokenizedCashBalance[] = cashContracts
      .filter((c: any) => c.payload.owner === partyId)
      .map((c: any) => ({
        contractId: c.contractId,
        owner: c.payload.owner,
        ownerName: this.getPartyName(c.payload.owner),
        amount: parseFloat(c.payload.amount),
        currency: c.payload.currency
      }));

    const realEstate: TokenizedRealEstate[] = realEstateContracts
      .filter((c: any) => c.payload.owner === partyId)
      .map((c: any) => ({
        contractId: c.contractId,
        owner: c.payload.owner,
        ownerName: this.getPartyName(c.payload.owner),
        assetId: c.payload.assetId,
        name: c.payload.name,
        location: c.payload.location,
        propertyType: c.payload.propertyType,
        squareFeet: c.payload.squareFeet,
        value: parseFloat(c.payload.value)
      }));

    const privateEquity: TokenizedPrivateEquity[] = privateEquityContracts
      .filter((c: any) => c.payload.owner === partyId)
      .map((c: any) => ({
        contractId: c.contractId,
        owner: c.payload.owner,
        ownerName: this.getPartyName(c.payload.owner),
        assetId: c.payload.assetId,
        companyName: c.payload.companyName,
        industry: c.payload.industry,
        ownershipPercentage: parseFloat(c.payload.ownershipPercentage),
        valuation: parseFloat(c.payload.valuation)
      }));

    return {
      partyId,
      displayName: partyName,
      cash,
      realEstate,
      privateEquity,
      totalCashValue: cash.reduce((sum, c) => sum + c.amount, 0),
      totalAssetValue: 
        realEstate.reduce((sum, r) => sum + r.value, 0) +
        privateEquity.reduce((sum, p) => sum + p.valuation, 0)
    };
  }

  // ============================================================
  // ATOMIC EXCHANGE - TRUE ESCROW
  // ============================================================

  /**
   * Create exchange proposal with TRUE escrow.
   * This atomically archives the proposer's asset and creates the proposal.
   */
  async createExchangeProposal(
    proposerName: string,
    responderName: string,
    assetContractId: string,
    assetType: 'cash' | 'real_estate' | 'private_equity',
    requesting: { type: string; amount?: number; assetId?: string },
    description?: string
  ): Promise<ExchangeProposalInfo> {
    const ledger = this.getLedger(proposerName);
    const proposerPartyId = this.getPartyId(proposerName);
    const responderPartyId = this.getPartyId(responderName);

    const requestSpec: RequestSpec = {
      requestType: requesting.type,
      amount: requesting.amount?.toString() || null,
      assetId: requesting.assetId || null
    };

    let proposalContractId: string;

    if (assetType === 'cash') {
      // Create helper contract
      const helper = await ledger.create(ProposeExchangeWithCash as any, {
        cashToEscrow: assetContractId,
        proposer: proposerPartyId,
        responder: responderPartyId,
        proposerName,
        responderName,
        requesting: requestSpec,
        description: description || null
      });

      // Execute to atomically escrow and create proposal
      const result = await ledger.exercise(
        ProposeExchangeWithCash.ExecuteProposal as any,
        helper.contractId as any,
        {}
      );
      proposalContractId = result[0] as string;

    } else if (assetType === 'real_estate') {
      const helper = await ledger.create(ProposeExchangeWithRealEstate as any, {
        realEstateToEscrow: assetContractId,
        proposer: proposerPartyId,
        responder: responderPartyId,
        proposerName,
        responderName,
        requesting: requestSpec,
        description: description || null
      });

      const result = await ledger.exercise(
        ProposeExchangeWithRealEstate.ExecuteProposalRE as any,
        helper.contractId as any,
        {}
      );
      proposalContractId = result[0] as string;

    } else {
      const helper = await ledger.create(ProposeExchangeWithPrivateEquity as any, {
        privateEquityToEscrow: assetContractId,
        proposer: proposerPartyId,
        responder: responderPartyId,
        proposerName,
        responderName,
        requesting: requestSpec,
        description: description || null
      });

      const result = await ledger.exercise(
        ProposeExchangeWithPrivateEquity.ExecuteProposalPE as any,
        helper.contractId as any,
        {}
      );
      proposalContractId = result[0] as string;
    }

    // Fetch the created proposal
    const proposals = await ledger.query(EscrowedExchangeProposal as any);
    const proposal = proposals.find((p: any) => p.contractId === proposalContractId);

    return this.formatProposal(proposal);
  }

  /**
   * Accept exchange with cash
   */
  async acceptWithCash(
    responderName: string,
    proposalContractId: string,
    cashContractId: string
  ): Promise<ExchangeProposalInfo> {
    const ledger = this.getLedger(responderName);

    await ledger.exercise(
      EscrowedExchangeProposal.AcceptWithCash as any,
      proposalContractId as any,
      { responderCash: cashContractId }
    );

    const completed = await ledger.query(CompletedExchange as any);
    const latest = completed[completed.length - 1];
    return this.formatCompletedExchange(latest);
  }

  /**
   * Accept exchange with real estate
   */
  async acceptWithRealEstate(
    responderName: string,
    proposalContractId: string,
    realEstateContractId: string
  ): Promise<ExchangeProposalInfo> {
    const ledger = this.getLedger(responderName);

    await ledger.exercise(
      EscrowedExchangeProposal.AcceptWithRealEstate as any,
      proposalContractId as any,
      { responderRE: realEstateContractId }
    );

    const completed = await ledger.query(CompletedExchange as any);
    const latest = completed[completed.length - 1];
    return this.formatCompletedExchange(latest);
  }

  /**
   * Accept exchange with private equity
   */
  async acceptWithPrivateEquity(
    responderName: string,
    proposalContractId: string,
    privateEquityContractId: string
  ): Promise<ExchangeProposalInfo> {
    const ledger = this.getLedger(responderName);

    await ledger.exercise(
      EscrowedExchangeProposal.AcceptWithPrivateEquity as any,
      proposalContractId as any,
      { responderPE: privateEquityContractId }
    );

    const completed = await ledger.query(CompletedExchange as any);
    const latest = completed[completed.length - 1];
    return this.formatCompletedExchange(latest);
  }

  /**
   * Cancel proposal (returns escrowed asset to proposer)
   */
  async cancelProposal(proposerName: string, proposalContractId: string): Promise<void> {
    const ledger = this.getLedger(proposerName);
    await ledger.exercise(
      EscrowedExchangeProposal.CancelProposal as any,
      proposalContractId as any,
      {}
    );
  }

  /**
   * Reject proposal (returns escrowed asset to proposer)
   */
  async rejectProposal(responderName: string, proposalContractId: string): Promise<void> {
    const ledger = this.getLedger(responderName);
    await ledger.exercise(
      EscrowedExchangeProposal.RejectProposal as any,
      proposalContractId as any,
      {}
    );
  }

  /**
   * Get pending proposals
   */
  async getPendingProposals(partyName: string): Promise<ExchangeProposalInfo[]> {
    const ledger = this.getLedger(partyName);
    const proposals = await ledger.query(EscrowedExchangeProposal as any);
    return proposals.map((p: any) => this.formatProposal(p));
  }

  /**
   * Get completed exchanges
   */
  async getCompletedExchanges(partyName: string): Promise<ExchangeProposalInfo[]> {
    const ledger = this.getLedger(partyName);
    const exchanges = await ledger.query(CompletedExchange as any);
    return exchanges.map((e: any) => this.formatCompletedExchange(e));
  }

  // ============================================================
  // FORMATTING HELPERS
  // ============================================================

  private formatProposal(contract: any): ExchangeProposalInfo {
    const p = contract.payload;
    
    let escrowed: ExchangeProposalInfo['escrowed'];
    if (p.escrowedCash) {
      escrowed = {
        type: 'cash',
        description: `${p.escrowedCash.amount} ${p.escrowedCash.currency}`,
        value: parseFloat(p.escrowedCash.amount)
      };
    } else if (p.escrowedRealEstate) {
      escrowed = {
        type: 'real_estate',
        description: p.escrowedRealEstate.name,
        value: parseFloat(p.escrowedRealEstate.value)
      };
    } else {
      escrowed = {
        type: 'private_equity',
        description: p.escrowedPrivateEquity.companyName,
        value: parseFloat(p.escrowedPrivateEquity.valuation)
      };
    }

    return {
      contractId: contract.contractId,
      proposer: p.proposer,
      proposerName: p.proposerName,
      responder: p.responder,
      responderName: p.responderName,
      escrowed,
      requesting: {
        type: p.requesting.requestType,
        amount: p.requesting.amount ? parseFloat(p.requesting.amount) : undefined,
        assetId: p.requesting.assetId || undefined
      },
      status: 'pending',
      createdAt: p.createdAt
    };
  }

  private formatCompletedExchange(contract: any): ExchangeProposalInfo {
    const p = contract.payload;
    return {
      contractId: contract.contractId,
      proposer: p.proposer,
      proposerName: p.proposerName,
      responder: p.responder,
      responderName: p.responderName,
      escrowed: {
        type: 'cash', // Simplified for completed
        description: p.proposerGave,
        value: 0
      },
      requesting: {
        type: 'cash',
        amount: 0
      },
      status: 'completed',
      createdAt: p.createdAt,
      completedAt: p.completedAt
    };
  }

  getAllParties(): PartyConfig[] {
    return Array.from(this.parties.values());
  }
}

export const tokenizedAssetClient = new TokenizedAssetClient();
