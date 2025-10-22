/**
 * Exchange Proposal Model
 * Represents a two-sided asset exchange between parties
 */

import { AssetType } from './Asset';

export interface ExchangeOffer {
  type: AssetType;
  // For cash
  cashAmount?: number;
  // For assets
  assetId?: string;
  assetName?: string;
  assetValue?: number;
}

export interface ExchangeProposal {
  id: string;
  fromParty: string;
  fromPartyName: string;
  toParty: string;
  toPartyName: string;
  
  // What the sender is offering
  offering: ExchangeOffer;
  
  // What the sender is requesting
  requesting: ExchangeOffer;
  
  description?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  
  createdAt: Date;
  acceptedAt?: Date;
  
  // For Canton integration (keep compatible with existing system)
  contractId?: string;
  transactionId?: string;
}

export interface ExchangeValidation {
  valid: boolean;
  errors: string[];
}

