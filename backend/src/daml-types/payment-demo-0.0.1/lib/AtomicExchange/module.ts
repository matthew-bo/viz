/**
 * Atomic Exchange Types
 * Matches daml/AtomicExchange.daml
 */

import * as damlTypes from '@daml/types';
import { 
  EscrowedCash, 
  EscrowedRealEstate, 
  EscrowedPrivateEquity,
  RequestSpec,
  CashHoldingData,
  RealEstateTokenData,
  PrivateEquityTokenData
} from '../Asset';

// ============================================================
// ESCROWED EXCHANGE PROPOSAL
// ============================================================

export type EscrowedExchangeProposalData = {
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  escrowedCash: damlTypes.Optional<EscrowedCash>;
  escrowedRealEstate: damlTypes.Optional<EscrowedRealEstate>;
  escrowedPrivateEquity: damlTypes.Optional<EscrowedPrivateEquity>;
  requesting: RequestSpec;
  description: damlTypes.Optional<string>;
  createdAt: damlTypes.Time;
};

export type AcceptWithCashArgs = {
  responderCash: damlTypes.ContractId<CashHoldingData>;
};

export type AcceptWithRealEstateArgs = {
  responderRE: damlTypes.ContractId<RealEstateTokenData>;
};

export type AcceptWithPrivateEquityArgs = {
  responderPE: damlTypes.ContractId<PrivateEquityTokenData>;
};

const ESCROWED_PROPOSAL_TEMPLATE_ID = 'payment-demo-0.0.1:AtomicExchange:EscrowedExchangeProposal' as const;

export const EscrowedExchangeProposal = {
  templateId: ESCROWED_PROPOSAL_TEMPLATE_ID,
  
  AcceptWithCash: {
    template: () => EscrowedExchangeProposal,
    choiceName: 'AcceptWithCash' as const,
  },
  
  AcceptWithRealEstate: {
    template: () => EscrowedExchangeProposal,
    choiceName: 'AcceptWithRealEstate' as const,
  },
  
  AcceptWithPrivateEquity: {
    template: () => EscrowedExchangeProposal,
    choiceName: 'AcceptWithPrivateEquity' as const,
  },
  
  CancelProposal: {
    template: () => EscrowedExchangeProposal,
    choiceName: 'CancelProposal' as const,
  },
  
  RejectProposal: {
    template: () => EscrowedExchangeProposal,
    choiceName: 'RejectProposal' as const,
  },
};

// ============================================================
// COMPLETED EXCHANGE
// ============================================================

export type CompletedExchangeData = {
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  proposerGave: string;
  responderGave: string;
  description: damlTypes.Optional<string>;
  createdAt: damlTypes.Time;
  completedAt: damlTypes.Time;
};

const COMPLETED_EXCHANGE_TEMPLATE_ID = 'payment-demo-0.0.1:AtomicExchange:CompletedExchange' as const;

export const CompletedExchange = {
  templateId: COMPLETED_EXCHANGE_TEMPLATE_ID,
};

// ============================================================
// PROPOSAL CREATION HELPERS
// ============================================================

export type ProposeExchangeWithCashData = {
  cashToEscrow: damlTypes.ContractId<CashHoldingData>;
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  requesting: RequestSpec;
  description: damlTypes.Optional<string>;
};

const PROPOSE_WITH_CASH_TEMPLATE_ID = 'payment-demo-0.0.1:AtomicExchange:ProposeExchangeWithCash' as const;

export const ProposeExchangeWithCash = {
  templateId: PROPOSE_WITH_CASH_TEMPLATE_ID,
  
  ExecuteProposal: {
    template: () => ProposeExchangeWithCash,
    choiceName: 'ExecuteProposal' as const,
  },
};

export type ProposeExchangeWithRealEstateData = {
  realEstateToEscrow: damlTypes.ContractId<RealEstateTokenData>;
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  requesting: RequestSpec;
  description: damlTypes.Optional<string>;
};

const PROPOSE_WITH_RE_TEMPLATE_ID = 'payment-demo-0.0.1:AtomicExchange:ProposeExchangeWithRealEstate' as const;

export const ProposeExchangeWithRealEstate = {
  templateId: PROPOSE_WITH_RE_TEMPLATE_ID,
  
  ExecuteProposalRE: {
    template: () => ProposeExchangeWithRealEstate,
    choiceName: 'ExecuteProposalRE' as const,
  },
};

export type ProposeExchangeWithPrivateEquityData = {
  privateEquityToEscrow: damlTypes.ContractId<PrivateEquityTokenData>;
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  requesting: RequestSpec;
  description: damlTypes.Optional<string>;
};

const PROPOSE_WITH_PE_TEMPLATE_ID = 'payment-demo-0.0.1:AtomicExchange:ProposeExchangeWithPrivateEquity' as const;

export const ProposeExchangeWithPrivateEquity = {
  templateId: PROPOSE_WITH_PE_TEMPLATE_ID,
  
  ExecuteProposalPE: {
    template: () => ProposeExchangeWithPrivateEquity,
    choiceName: 'ExecuteProposalPE' as const,
  },
};
