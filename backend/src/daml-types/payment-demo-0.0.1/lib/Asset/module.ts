/**
 * Tokenized Asset Types
 * Matches daml/Asset.daml
 */

import * as damlTypes from '@daml/types';

// ============================================================
// ESCROWED DATA TYPES (used in exchange proposals)
// ============================================================

export type EscrowedCash = {
  amount: damlTypes.Numeric;
  currency: string;
};

export type EscrowedRealEstate = {
  assetId: string;
  name: string;
  location: string;
  propertyType: string;
  squareFeet: number;
  value: damlTypes.Numeric;
};

export type EscrowedPrivateEquity = {
  assetId: string;
  companyName: string;
  industry: string;
  ownershipPercentage: damlTypes.Numeric;
  valuation: damlTypes.Numeric;
};

export type RequestSpec = {
  requestType: string;  // "cash" | "real_estate" | "private_equity"
  amount: damlTypes.Optional<damlTypes.Numeric>;
  assetId: damlTypes.Optional<string>;
};

// ============================================================
// CASH HOLDING
// ============================================================

export type CashHoldingData = {
  owner: damlTypes.Party;
  amount: damlTypes.Numeric;
  currency: string;
};

export type TransferCashArgs = {
  recipient: damlTypes.Party;
};

const CASH_HOLDING_TEMPLATE_ID = 'Asset:CashHolding' as const;

export const CashHolding = {
  templateId: CASH_HOLDING_TEMPLATE_ID,
  
  TransferCash: {
    template: () => CashHolding,
    choiceName: 'TransferCash' as const,
  },
};

// ============================================================
// REAL ESTATE TOKEN
// ============================================================

export type RealEstateTokenData = {
  owner: damlTypes.Party;
  assetId: string;
  name: string;
  location: string;
  propertyType: string;
  squareFeet: number;
  value: damlTypes.Numeric;
};

export type TransferRealEstateArgs = {
  newOwner: damlTypes.Party;
};

const REAL_ESTATE_TOKEN_TEMPLATE_ID = 'Asset:RealEstateToken' as const;

export const RealEstateToken = {
  templateId: REAL_ESTATE_TOKEN_TEMPLATE_ID,
  
  TransferRealEstate: {
    template: () => RealEstateToken,
    choiceName: 'TransferRealEstate' as const,
  },
};

// ============================================================
// PRIVATE EQUITY TOKEN
// ============================================================

export type PrivateEquityTokenData = {
  owner: damlTypes.Party;
  assetId: string;
  companyName: string;
  industry: string;
  ownershipPercentage: damlTypes.Numeric;
  valuation: damlTypes.Numeric;
};

export type TransferPrivateEquityArgs = {
  newOwner: damlTypes.Party;
};

const PRIVATE_EQUITY_TOKEN_TEMPLATE_ID = 'Asset:PrivateEquityToken' as const;

export const PrivateEquityToken = {
  templateId: PRIVATE_EQUITY_TOKEN_TEMPLATE_ID,
  
  TransferPrivateEquity: {
    template: () => PrivateEquityToken,
    choiceName: 'TransferPrivateEquity' as const,
  },
};
