/**
 * Canton Asset Service
 * 
 * Manages tokenized assets on Canton using direct HTTP calls.
 * No generated TypeScript bindings required.
 */

import { rawCantonClient } from './raw-canton-client';

// Template IDs (format: Module:Template)
const TEMPLATES = {
  CashHolding: 'Asset:CashHolding',
  RealEstateToken: 'Asset:RealEstateToken',
  PrivateEquityToken: 'Asset:PrivateEquityToken',
  EscrowedExchangeProposal: 'AtomicExchange:EscrowedExchangeProposal',
  CompletedExchange: 'AtomicExchange:CompletedExchange',
  ProposeExchangeWithCash: 'AtomicExchange:ProposeExchangeWithCash',
  ProposeExchangeWithRealEstate: 'AtomicExchange:ProposeExchangeWithRealEstate',
  ProposeExchangeWithPrivateEquity: 'AtomicExchange:ProposeExchangeWithPrivateEquity'
};

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface CashHoldingInfo {
  contractId: string;
  owner: string;
  ownerName: string;
  amount: number;
  currency: string;
}

export interface RealEstateInfo {
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

export interface PrivateEquityInfo {
  contractId: string;
  owner: string;
  ownerName: string;
  assetId: string;
  companyName: string;
  industry: string;
  ownershipPercentage: number;
  valuation: number;
}

export interface CantonInventory {
  partyId: string;
  displayName: string;
  cash: CashHoldingInfo[];
  realEstate: RealEstateInfo[];
  privateEquity: PrivateEquityInfo[];
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
}

// ============================================================
// ASSET CREATION
// ============================================================

export async function createCashHolding(
  ownerName: string,
  amount: number,
  currency: string = 'USD'
): Promise<CashHoldingInfo> {
  const ownerPartyId = rawCantonClient.getPartyId(ownerName);
  
  const result = await rawCantonClient.create(ownerName, TEMPLATES.CashHolding, {
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

export async function createRealEstateToken(
  ownerName: string,
  assetId: string,
  name: string,
  location: string,
  propertyType: string,
  squareFeet: number,
  value: number
): Promise<RealEstateInfo> {
  const ownerPartyId = rawCantonClient.getPartyId(ownerName);
  
  const result = await rawCantonClient.create(ownerName, TEMPLATES.RealEstateToken, {
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

export async function createPrivateEquityToken(
  ownerName: string,
  assetId: string,
  companyName: string,
  industry: string,
  ownershipPercentage: number,
  valuation: number
): Promise<PrivateEquityInfo> {
  const ownerPartyId = rawCantonClient.getPartyId(ownerName);
  
  const result = await rawCantonClient.create(ownerName, TEMPLATES.PrivateEquityToken, {
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
// INVENTORY QUERIES
// ============================================================

export async function getCantonInventory(partyName: string): Promise<CantonInventory> {
  const partyId = rawCantonClient.getPartyId(partyName);

  const [cashContracts, realEstateContracts, privateEquityContracts] = await Promise.all([
    rawCantonClient.query(partyName, TEMPLATES.CashHolding),
    rawCantonClient.query(partyName, TEMPLATES.RealEstateToken),
    rawCantonClient.query(partyName, TEMPLATES.PrivateEquityToken)
  ]);

  const cash: CashHoldingInfo[] = cashContracts
    .filter(c => c.payload.owner === partyId)
    .map(c => ({
      contractId: c.contractId,
      owner: c.payload.owner,
      ownerName: partyName,
      amount: parseFloat(c.payload.amount),
      currency: c.payload.currency
    }));

  const realEstate: RealEstateInfo[] = realEstateContracts
    .filter(c => c.payload.owner === partyId)
    .map(c => ({
      contractId: c.contractId,
      owner: c.payload.owner,
      ownerName: partyName,
      assetId: c.payload.assetId,
      name: c.payload.name,
      location: c.payload.location,
      propertyType: c.payload.propertyType,
      squareFeet: c.payload.squareFeet,
      value: parseFloat(c.payload.value)
    }));

  const privateEquity: PrivateEquityInfo[] = privateEquityContracts
    .filter(c => c.payload.owner === partyId)
    .map(c => ({
      contractId: c.contractId,
      owner: c.payload.owner,
      ownerName: partyName,
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
// SIMPLE TRANSFERS (not exchanges)
// ============================================================

export async function transferCash(
  ownerName: string,
  contractId: string,
  recipientName: string
): Promise<string> {
  const recipientPartyId = rawCantonClient.getPartyId(recipientName);
  
  const result = await rawCantonClient.exercise(
    ownerName,
    TEMPLATES.CashHolding,
    contractId,
    'TransferCash',
    { recipient: recipientPartyId }
  );

  return result.exerciseResult;
}

export async function transferRealEstate(
  ownerName: string,
  contractId: string,
  newOwnerName: string
): Promise<string> {
  const newOwnerPartyId = rawCantonClient.getPartyId(newOwnerName);
  
  const result = await rawCantonClient.exercise(
    ownerName,
    TEMPLATES.RealEstateToken,
    contractId,
    'TransferRealEstate',
    { newOwner: newOwnerPartyId }
  );

  return result.exerciseResult;
}

export async function transferPrivateEquity(
  ownerName: string,
  contractId: string,
  newOwnerName: string
): Promise<string> {
  const newOwnerPartyId = rawCantonClient.getPartyId(newOwnerName);
  
  const result = await rawCantonClient.exercise(
    ownerName,
    TEMPLATES.PrivateEquityToken,
    contractId,
    'TransferPrivateEquity',
    { newOwner: newOwnerPartyId }
  );

  return result.exerciseResult;
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function checkCantonHealth(): Promise<boolean> {
  return rawCantonClient.checkHealth();
}

export function getAllParties() {
  return rawCantonClient.getAllParties();
}

