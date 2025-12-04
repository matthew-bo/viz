// Generated from Asset.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@payment-demo/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

export declare type TransferPrivateEquity = {
  newOwner: damlTypes.Party;
};

export declare const TransferPrivateEquity:
  damlTypes.Serializable<TransferPrivateEquity> & {
  }
;


export declare type PrivateEquityToken = {
  owner: damlTypes.Party;
  assetId: string;
  companyName: string;
  industry: string;
  ownershipPercentage: damlTypes.Numeric;
  valuation: damlTypes.Numeric;
};

export declare interface PrivateEquityTokenInterface {
  Archive: damlTypes.Choice<PrivateEquityToken, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PrivateEquityToken, undefined>>;
  TransferPrivateEquity: damlTypes.Choice<PrivateEquityToken, TransferPrivateEquity, damlTypes.ContractId<PrivateEquityToken>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PrivateEquityToken, undefined>>;
}
export declare const PrivateEquityToken:
  damlTypes.Template<PrivateEquityToken, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Asset:PrivateEquityToken'> &
  damlTypes.ToInterface<PrivateEquityToken, never> &
  PrivateEquityTokenInterface;

export declare namespace PrivateEquityToken {
  export type CreateEvent = damlLedger.CreateEvent<PrivateEquityToken, undefined, typeof PrivateEquityToken.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<PrivateEquityToken, typeof PrivateEquityToken.templateId>
  export type Event = damlLedger.Event<PrivateEquityToken, undefined, typeof PrivateEquityToken.templateId>
  export type QueryResult = damlLedger.QueryResult<PrivateEquityToken, undefined, typeof PrivateEquityToken.templateId>
}



export declare type TransferRealEstate = {
  newOwner: damlTypes.Party;
};

export declare const TransferRealEstate:
  damlTypes.Serializable<TransferRealEstate> & {
  }
;


export declare type RealEstateToken = {
  owner: damlTypes.Party;
  assetId: string;
  name: string;
  location: string;
  propertyType: string;
  squareFeet: damlTypes.Int;
  value: damlTypes.Numeric;
};

export declare interface RealEstateTokenInterface {
  TransferRealEstate: damlTypes.Choice<RealEstateToken, TransferRealEstate, damlTypes.ContractId<RealEstateToken>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<RealEstateToken, undefined>>;
  Archive: damlTypes.Choice<RealEstateToken, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<RealEstateToken, undefined>>;
}
export declare const RealEstateToken:
  damlTypes.Template<RealEstateToken, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Asset:RealEstateToken'> &
  damlTypes.ToInterface<RealEstateToken, never> &
  RealEstateTokenInterface;

export declare namespace RealEstateToken {
  export type CreateEvent = damlLedger.CreateEvent<RealEstateToken, undefined, typeof RealEstateToken.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<RealEstateToken, typeof RealEstateToken.templateId>
  export type Event = damlLedger.Event<RealEstateToken, undefined, typeof RealEstateToken.templateId>
  export type QueryResult = damlLedger.QueryResult<RealEstateToken, undefined, typeof RealEstateToken.templateId>
}



export declare type TransferCash = {
  recipient: damlTypes.Party;
};

export declare const TransferCash:
  damlTypes.Serializable<TransferCash> & {
  }
;


export declare type CashHolding = {
  owner: damlTypes.Party;
  amount: damlTypes.Numeric;
  currency: string;
};

export declare interface CashHoldingInterface {
  TransferCash: damlTypes.Choice<CashHolding, TransferCash, damlTypes.ContractId<CashHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
  Archive: damlTypes.Choice<CashHolding, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
}
export declare const CashHolding:
  damlTypes.Template<CashHolding, undefined, '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Asset:CashHolding'> &
  damlTypes.ToInterface<CashHolding, never> &
  CashHoldingInterface;

export declare namespace CashHolding {
  export type CreateEvent = damlLedger.CreateEvent<CashHolding, undefined, typeof CashHolding.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<CashHolding, typeof CashHolding.templateId>
  export type Event = damlLedger.Event<CashHolding, undefined, typeof CashHolding.templateId>
  export type QueryResult = damlLedger.QueryResult<CashHolding, undefined, typeof CashHolding.templateId>
}



export declare type RequestSpec = {
  requestType: string;
  amount: damlTypes.Optional<damlTypes.Numeric>;
  assetId: damlTypes.Optional<string>;
};

export declare const RequestSpec:
  damlTypes.Serializable<RequestSpec> & {
  }
;


export declare type EscrowedPrivateEquity = {
  assetId: string;
  companyName: string;
  industry: string;
  ownershipPercentage: damlTypes.Numeric;
  valuation: damlTypes.Numeric;
};

export declare const EscrowedPrivateEquity:
  damlTypes.Serializable<EscrowedPrivateEquity> & {
  }
;


export declare type EscrowedRealEstate = {
  assetId: string;
  name: string;
  location: string;
  propertyType: string;
  squareFeet: damlTypes.Int;
  value: damlTypes.Numeric;
};

export declare const EscrowedRealEstate:
  damlTypes.Serializable<EscrowedRealEstate> & {
  }
;


export declare type EscrowedCash = {
  amount: damlTypes.Numeric;
  currency: string;
};

export declare const EscrowedCash:
  damlTypes.Serializable<EscrowedCash> & {
  }
;

