// Generated from AtomicExchange.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@payment-demo/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

import * as Asset from '../Asset/module';

export declare type ExecuteProposalPE = {
};

export declare const ExecuteProposalPE:
  damlTypes.Serializable<ExecuteProposalPE> & {
  }
;


export declare type ProposeExchangeWithPrivateEquity = {
  privateEquityToEscrow: damlTypes.ContractId<Asset.PrivateEquityToken>;
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  requesting: Asset.RequestSpec;
  description: damlTypes.Optional<string>;
};

export declare interface ProposeExchangeWithPrivateEquityInterface {
  Archive: damlTypes.Choice<ProposeExchangeWithPrivateEquity, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ProposeExchangeWithPrivateEquity, undefined>>;
  ExecuteProposalPE: damlTypes.Choice<ProposeExchangeWithPrivateEquity, ExecuteProposalPE, damlTypes.ContractId<EscrowedExchangeProposal>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ProposeExchangeWithPrivateEquity, undefined>>;
}
export declare const ProposeExchangeWithPrivateEquity:
  damlTypes.Template<ProposeExchangeWithPrivateEquity, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:ProposeExchangeWithPrivateEquity'> &
  damlTypes.ToInterface<ProposeExchangeWithPrivateEquity, never> &
  ProposeExchangeWithPrivateEquityInterface;

export declare namespace ProposeExchangeWithPrivateEquity {
  export type CreateEvent = damlLedger.CreateEvent<ProposeExchangeWithPrivateEquity, undefined, typeof ProposeExchangeWithPrivateEquity.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<ProposeExchangeWithPrivateEquity, typeof ProposeExchangeWithPrivateEquity.templateId>
  export type Event = damlLedger.Event<ProposeExchangeWithPrivateEquity, undefined, typeof ProposeExchangeWithPrivateEquity.templateId>
  export type QueryResult = damlLedger.QueryResult<ProposeExchangeWithPrivateEquity, undefined, typeof ProposeExchangeWithPrivateEquity.templateId>
}



export declare type ExecuteProposalRE = {
};

export declare const ExecuteProposalRE:
  damlTypes.Serializable<ExecuteProposalRE> & {
  }
;


export declare type ProposeExchangeWithRealEstate = {
  realEstateToEscrow: damlTypes.ContractId<Asset.RealEstateToken>;
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  requesting: Asset.RequestSpec;
  description: damlTypes.Optional<string>;
};

export declare interface ProposeExchangeWithRealEstateInterface {
  ExecuteProposalRE: damlTypes.Choice<ProposeExchangeWithRealEstate, ExecuteProposalRE, damlTypes.ContractId<EscrowedExchangeProposal>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ProposeExchangeWithRealEstate, undefined>>;
  Archive: damlTypes.Choice<ProposeExchangeWithRealEstate, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ProposeExchangeWithRealEstate, undefined>>;
}
export declare const ProposeExchangeWithRealEstate:
  damlTypes.Template<ProposeExchangeWithRealEstate, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:ProposeExchangeWithRealEstate'> &
  damlTypes.ToInterface<ProposeExchangeWithRealEstate, never> &
  ProposeExchangeWithRealEstateInterface;

export declare namespace ProposeExchangeWithRealEstate {
  export type CreateEvent = damlLedger.CreateEvent<ProposeExchangeWithRealEstate, undefined, typeof ProposeExchangeWithRealEstate.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<ProposeExchangeWithRealEstate, typeof ProposeExchangeWithRealEstate.templateId>
  export type Event = damlLedger.Event<ProposeExchangeWithRealEstate, undefined, typeof ProposeExchangeWithRealEstate.templateId>
  export type QueryResult = damlLedger.QueryResult<ProposeExchangeWithRealEstate, undefined, typeof ProposeExchangeWithRealEstate.templateId>
}



export declare type ExecuteProposal = {
};

export declare const ExecuteProposal:
  damlTypes.Serializable<ExecuteProposal> & {
  }
;


export declare type ProposeExchangeWithCash = {
  cashToEscrow: damlTypes.ContractId<Asset.CashHolding>;
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  requesting: Asset.RequestSpec;
  description: damlTypes.Optional<string>;
};

export declare interface ProposeExchangeWithCashInterface {
  ExecuteProposal: damlTypes.Choice<ProposeExchangeWithCash, ExecuteProposal, damlTypes.ContractId<EscrowedExchangeProposal>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ProposeExchangeWithCash, undefined>>;
  Archive: damlTypes.Choice<ProposeExchangeWithCash, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ProposeExchangeWithCash, undefined>>;
}
export declare const ProposeExchangeWithCash:
  damlTypes.Template<ProposeExchangeWithCash, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:ProposeExchangeWithCash'> &
  damlTypes.ToInterface<ProposeExchangeWithCash, never> &
  ProposeExchangeWithCashInterface;

export declare namespace ProposeExchangeWithCash {
  export type CreateEvent = damlLedger.CreateEvent<ProposeExchangeWithCash, undefined, typeof ProposeExchangeWithCash.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<ProposeExchangeWithCash, typeof ProposeExchangeWithCash.templateId>
  export type Event = damlLedger.Event<ProposeExchangeWithCash, undefined, typeof ProposeExchangeWithCash.templateId>
  export type QueryResult = damlLedger.QueryResult<ProposeExchangeWithCash, undefined, typeof ProposeExchangeWithCash.templateId>
}



export declare type CompletedExchange = {
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

export declare interface CompletedExchangeInterface {
  Archive: damlTypes.Choice<CompletedExchange, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CompletedExchange, undefined>>;
}
export declare const CompletedExchange:
  damlTypes.Template<CompletedExchange, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:CompletedExchange'> &
  damlTypes.ToInterface<CompletedExchange, never> &
  CompletedExchangeInterface;

export declare namespace CompletedExchange {
  export type CreateEvent = damlLedger.CreateEvent<CompletedExchange, undefined, typeof CompletedExchange.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<CompletedExchange, typeof CompletedExchange.templateId>
  export type Event = damlLedger.Event<CompletedExchange, undefined, typeof CompletedExchange.templateId>
  export type QueryResult = damlLedger.QueryResult<CompletedExchange, undefined, typeof CompletedExchange.templateId>
}



export declare type RejectProposal = {
};

export declare const RejectProposal:
  damlTypes.Serializable<RejectProposal> & {
  }
;


export declare type CancelProposal = {
};

export declare const CancelProposal:
  damlTypes.Serializable<CancelProposal> & {
  }
;


export declare type AcceptWithPrivateEquity = {
  responderPE: damlTypes.ContractId<Asset.PrivateEquityToken>;
};

export declare const AcceptWithPrivateEquity:
  damlTypes.Serializable<AcceptWithPrivateEquity> & {
  }
;


export declare type AcceptWithRealEstate = {
  responderRE: damlTypes.ContractId<Asset.RealEstateToken>;
};

export declare const AcceptWithRealEstate:
  damlTypes.Serializable<AcceptWithRealEstate> & {
  }
;


export declare type AcceptWithCash = {
  responderCash: damlTypes.ContractId<Asset.CashHolding>;
};

export declare const AcceptWithCash:
  damlTypes.Serializable<AcceptWithCash> & {
  }
;


export declare type EscrowedExchangeProposal = {
  proposer: damlTypes.Party;
  responder: damlTypes.Party;
  proposerName: string;
  responderName: string;
  escrowedCash: damlTypes.Optional<Asset.EscrowedCash>;
  escrowedRealEstate: damlTypes.Optional<Asset.EscrowedRealEstate>;
  escrowedPrivateEquity: damlTypes.Optional<Asset.EscrowedPrivateEquity>;
  requesting: Asset.RequestSpec;
  description: damlTypes.Optional<string>;
  createdAt: damlTypes.Time;
};

export declare interface EscrowedExchangeProposalInterface {
  AcceptWithCash: damlTypes.Choice<EscrowedExchangeProposal, AcceptWithCash, damlTypes.ContractId<CompletedExchange>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<EscrowedExchangeProposal, undefined>>;
  AcceptWithRealEstate: damlTypes.Choice<EscrowedExchangeProposal, AcceptWithRealEstate, damlTypes.ContractId<CompletedExchange>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<EscrowedExchangeProposal, undefined>>;
  AcceptWithPrivateEquity: damlTypes.Choice<EscrowedExchangeProposal, AcceptWithPrivateEquity, damlTypes.ContractId<CompletedExchange>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<EscrowedExchangeProposal, undefined>>;
  CancelProposal: damlTypes.Choice<EscrowedExchangeProposal, CancelProposal, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<EscrowedExchangeProposal, undefined>>;
  RejectProposal: damlTypes.Choice<EscrowedExchangeProposal, RejectProposal, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<EscrowedExchangeProposal, undefined>>;
  Archive: damlTypes.Choice<EscrowedExchangeProposal, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<EscrowedExchangeProposal, undefined>>;
}
export declare const EscrowedExchangeProposal:
  damlTypes.Template<EscrowedExchangeProposal, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:EscrowedExchangeProposal'> &
  damlTypes.ToInterface<EscrowedExchangeProposal, never> &
  EscrowedExchangeProposalInterface;

export declare namespace EscrowedExchangeProposal {
  export type CreateEvent = damlLedger.CreateEvent<EscrowedExchangeProposal, undefined, typeof EscrowedExchangeProposal.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<EscrowedExchangeProposal, typeof EscrowedExchangeProposal.templateId>
  export type Event = damlLedger.Event<EscrowedExchangeProposal, undefined, typeof EscrowedExchangeProposal.templateId>
  export type QueryResult = damlLedger.QueryResult<EscrowedExchangeProposal, undefined, typeof EscrowedExchangeProposal.templateId>
}


