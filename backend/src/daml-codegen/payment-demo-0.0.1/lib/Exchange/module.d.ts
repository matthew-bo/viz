// Generated from Exchange.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@payment-demo/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

export declare type Exchange = {
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

export declare interface ExchangeInterface {
  Archive: damlTypes.Choice<Exchange, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Exchange, undefined>>;
}
export declare const Exchange:
  damlTypes.Template<Exchange, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Exchange:Exchange'> &
  damlTypes.ToInterface<Exchange, never> &
  ExchangeInterface;

export declare namespace Exchange {
  export type CreateEvent = damlLedger.CreateEvent<Exchange, undefined, typeof Exchange.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<Exchange, typeof Exchange.templateId>
  export type Event = damlLedger.Event<Exchange, undefined, typeof Exchange.templateId>
  export type QueryResult = damlLedger.QueryResult<Exchange, undefined, typeof Exchange.templateId>
}



export declare type RejectExchange = {
};

export declare const RejectExchange:
  damlTypes.Serializable<RejectExchange> & {
  }
;


export declare type CancelExchange = {
};

export declare const CancelExchange:
  damlTypes.Serializable<CancelExchange> & {
  }
;


export declare type AcceptExchange = {
};

export declare const AcceptExchange:
  damlTypes.Serializable<AcceptExchange> & {
  }
;


export declare type ExchangeProposal = {
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  offering: ExchangeOffer;
  requesting: ExchangeOffer;
  description: damlTypes.Optional<string>;
  createdAt: damlTypes.Time;
};

export declare interface ExchangeProposalInterface {
  Archive: damlTypes.Choice<ExchangeProposal, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ExchangeProposal, undefined>>;
  CancelExchange: damlTypes.Choice<ExchangeProposal, CancelExchange, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ExchangeProposal, undefined>>;
  RejectExchange: damlTypes.Choice<ExchangeProposal, RejectExchange, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ExchangeProposal, undefined>>;
  AcceptExchange: damlTypes.Choice<ExchangeProposal, AcceptExchange, damlTypes.ContractId<Exchange>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ExchangeProposal, undefined>>;
}
export declare const ExchangeProposal:
  damlTypes.Template<ExchangeProposal, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Exchange:ExchangeProposal'> &
  damlTypes.ToInterface<ExchangeProposal, never> &
  ExchangeProposalInterface;

export declare namespace ExchangeProposal {
  export type CreateEvent = damlLedger.CreateEvent<ExchangeProposal, undefined, typeof ExchangeProposal.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<ExchangeProposal, typeof ExchangeProposal.templateId>
  export type Event = damlLedger.Event<ExchangeProposal, undefined, typeof ExchangeProposal.templateId>
  export type QueryResult = damlLedger.QueryResult<ExchangeProposal, undefined, typeof ExchangeProposal.templateId>
}



export declare type ExchangeOffer = {
  offerType: OfferType;
  cashAmount: damlTypes.Optional<damlTypes.Numeric>;
  assetId: damlTypes.Optional<string>;
  assetName: damlTypes.Optional<string>;
  assetValue: damlTypes.Optional<damlTypes.Numeric>;
};

export declare const ExchangeOffer:
  damlTypes.Serializable<ExchangeOffer> & {
  }
;


export declare type OfferType =
  | 'Cash'
  | 'RealEstate'
  | 'PrivateEquity'
;

export declare const OfferType:
  damlTypes.Serializable<OfferType> & {
  }
& { readonly keys: OfferType[] } & { readonly [e in OfferType]: e }
;

