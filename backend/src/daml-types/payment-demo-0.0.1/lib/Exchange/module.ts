// Exchange DAML Types
// Manually created to match DAML Exchange.daml contract structure
// Run `daml build` and `generate-daml-types.ps1` to regenerate from DAML source

import * as damlTypes from '@daml/types';
import * as damlLedger from '@daml/ledger';

// Offer type enum
export type OfferType = 'Cash' | 'RealEstate' | 'PrivateEquity';

// Exchange offer data structure
export type ExchangeOffer = {
  offerType: OfferType;
  cashAmount: damlTypes.Optional<damlTypes.Numeric>;
  assetId: damlTypes.Optional<string>;
  assetName: damlTypes.Optional<string>;
  assetValue: damlTypes.Optional<damlTypes.Numeric>;
};

// ExchangeProposal template type
export type ExchangeProposalData = {
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  offering: ExchangeOffer;
  requesting: ExchangeOffer;
  description: damlTypes.Optional<string>;
  createdAt: damlTypes.Time;
};

// Exchange template type (completed)
export type ExchangeData = {
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  offering: ExchangeOffer;
  requesting: ExchangeOffer;
  description: damlTypes.Optional<string>;
  createdAt: damlTypes.Time;
  acceptedAt: damlTypes.Time;
};

// Choice argument types
export type AcceptExchangeArgs = {};
export type CancelExchangeArgs = {};
export type RejectExchangeArgs = {};

// Template ID constants
const PACKAGE_ID = 'payment-demo-0.0.1';
const EXCHANGE_PROPOSAL_TEMPLATE_ID = `${PACKAGE_ID}:Exchange:ExchangeProposal` as const;
const EXCHANGE_TEMPLATE_ID = `${PACKAGE_ID}:Exchange:Exchange` as const;

// ExchangeProposal template object
export const ExchangeProposal = {
  templateId: EXCHANGE_PROPOSAL_TEMPLATE_ID,
  
  // Choice definitions
  AcceptExchange: {
    template: () => ExchangeProposal,
    choiceName: 'AcceptExchange' as const,
    argumentDecoder: () => ({}) as AcceptExchangeArgs,
    resultDecoder: () => '' as damlTypes.ContractId<ExchangeData>,
  },
  
  CancelExchange: {
    template: () => ExchangeProposal,
    choiceName: 'CancelExchange' as const,
    argumentDecoder: () => ({}) as CancelExchangeArgs,
    resultDecoder: () => undefined,
  },
  
  RejectExchange: {
    template: () => ExchangeProposal,
    choiceName: 'RejectExchange' as const,
    argumentDecoder: () => ({}) as RejectExchangeArgs,
    resultDecoder: () => undefined,
  },
};

// Exchange template object (completed exchange)
export const Exchange = {
  templateId: EXCHANGE_TEMPLATE_ID,
};

// Type exports for ledger operations
export namespace ExchangeProposal {
  export type CreateEvent = damlLedger.CreateEvent<ExchangeProposalData, undefined, typeof ExchangeProposal.templateId>;
  export type ArchiveEvent = damlLedger.ArchiveEvent<ExchangeProposalData, typeof ExchangeProposal.templateId>;
  export type Event = damlLedger.Event<ExchangeProposalData, undefined, typeof ExchangeProposal.templateId>;
  export type QueryResult = damlLedger.QueryResult<ExchangeProposalData, undefined, typeof ExchangeProposal.templateId>;
}

export namespace Exchange {
  export type CreateEvent = damlLedger.CreateEvent<ExchangeData, undefined, typeof Exchange.templateId>;
  export type ArchiveEvent = damlLedger.ArchiveEvent<ExchangeData, typeof Exchange.templateId>;
  export type Event = damlLedger.Event<ExchangeData, undefined, typeof Exchange.templateId>;
  export type QueryResult = damlLedger.QueryResult<ExchangeData, undefined, typeof Exchange.templateId>;
}

