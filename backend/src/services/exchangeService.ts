/**
 * Exchange Service
 * Manages asset exchange proposals and executions
 */

import { ExchangeProposal, ExchangeOffer, ExchangeValidation } from '../models/Exchange';
import assetService from './assetService';
import inventoryService from './inventoryService';
import { OwnershipHistory } from '../models/Asset';

class ExchangeService {
  private exchanges: Map<string, ExchangeProposal> = new Map();
  private exchangeCounter = 0;

  /**
   * Create a new exchange proposal
   */
  createExchange(
    fromParty: string,
    fromPartyName: string,
    toParty: string,
    toPartyName: string,
    offering: ExchangeOffer,
    requesting: ExchangeOffer,
    description?: string
  ): ExchangeProposal | null {
    // Validate exchange
    const validation = this.validateExchange(fromParty, toParty, offering, requesting);
    if (!validation.valid) {
      console.error('Exchange validation failed:', validation.errors);
      return null;
    }

    const exchangeId = `ex_${Date.now()}_${++this.exchangeCounter}`;
    
    // Lock offered assets/cash in escrow
    if (!this.lockOfferingInEscrow(fromParty, offering)) {
      console.error('Failed to lock offering in escrow');
      return null;
    }

    // Lock requested assets/cash in escrow
    if (!this.lockOfferingInEscrow(toParty, requesting)) {
      console.error('Failed to lock requesting in escrow');
      // Rollback: release the offering
      this.releaseOfferingFromEscrow(fromParty, offering);
      return null;
    }
    
    const exchange: ExchangeProposal = {
      id: exchangeId,
      fromParty,
      fromPartyName,
      toParty,
      toPartyName,
      offering,
      requesting,
      description,
      status: 'pending',
      createdAt: new Date(),
    };

    this.exchanges.set(exchangeId, exchange);
    console.log(`✅ Created exchange ${exchangeId}: ${fromPartyName} ↔ ${toPartyName} (assets locked in escrow)`);
    
    return exchange;
  }

  /**
   * Validate exchange proposal
   */
  validateExchange(
    fromParty: string,
    toParty: string,
    offering: ExchangeOffer,
    requesting: ExchangeOffer
  ): ExchangeValidation {
    const errors: string[] = [];

    // Validate offering
    if (offering.type === 'cash') {
      if (!offering.cashAmount || offering.cashAmount <= 0) {
        errors.push('Invalid cash amount offered');
      } else if (!inventoryService.hasSufficientCash(fromParty, offering.cashAmount)) {
        errors.push('Insufficient cash balance to offer');
      }
    } else {
      if (!offering.assetId) {
        errors.push('Asset ID required for offering');
      } else if (!inventoryService.ownsAsset(fromParty, offering.assetId)) {
        errors.push('Cannot offer asset you do not own');
      }
    }

    // Validate requesting
    if (requesting.type === 'cash') {
      if (!requesting.cashAmount || requesting.cashAmount <= 0) {
        errors.push('Invalid cash amount requested');
      } else if (!inventoryService.hasSufficientCash(toParty, requesting.cashAmount)) {
        errors.push('Receiver does not have sufficient cash');
      }
    } else {
      if (!requesting.assetId) {
        errors.push('Asset ID required for requesting');
      } else if (!inventoryService.ownsAsset(toParty, requesting.assetId)) {
        errors.push('Cannot request asset that receiver does not own');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Accept exchange and execute transfers
   */
  acceptExchange(exchangeId: string, acceptingPartyId: string): boolean {
    const exchange = this.exchanges.get(exchangeId);
    
    if (!exchange) {
      console.error(`Exchange ${exchangeId} not found`);
      return false;
    }

    if (exchange.status !== 'pending') {
      console.error(`Exchange ${exchangeId} is not pending (status: ${exchange.status})`);
      return false;
    }

    if (exchange.toParty !== acceptingPartyId) {
      console.error(`Only ${exchange.toParty} can accept this exchange`);
      return false;
    }

    // Don't re-validate - assets are already in escrow!
    // The validation was done during createExchange and assets were locked.
    // Re-validating here would fail because ownership has already moved to escrow.
    console.log(`✓ Skipping re-validation - assets already locked in escrow`);

    console.log(`Executing exchange ${exchangeId}...`);

    // Execute the exchange
    const success = this.executeExchange(exchange);
    
    if (success) {
      exchange.status = 'accepted';
      exchange.acceptedAt = new Date();
      console.log(`Exchange ${exchangeId} completed successfully`);
      return true;
    } else {
      console.error(`Failed to execute exchange ${exchangeId}`);
      return false;
    }
  }

  /**
   * Execute the actual asset/cash transfers from escrow
   */
  private executeExchange(exchange: ExchangeProposal): boolean {
    try {
      // Transfer offering from escrow (fromParty → toParty)
      if (exchange.offering.type === 'cash') {
        if (!inventoryService.transferCashFromEscrow(exchange.fromParty, exchange.toParty, exchange.offering.cashAmount!)) {
          throw new Error('Failed to transfer cash from escrow');
        }
      } else {
        // Transfer asset ownership
        const assetId = exchange.offering.assetId!;
        const assetType = exchange.offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
        
        // Add history entry
        const historyEntry: OwnershipHistory = {
          timestamp: new Date(),
          fromParty: exchange.fromPartyName,
          toParty: exchange.toPartyName,
          exchangeId: exchange.id,
          exchangedFor: {
            type: exchange.requesting.type,
            description: exchange.requesting.type === 'cash' 
              ? `$${exchange.requesting.cashAmount?.toLocaleString()}`
              : exchange.requesting.assetName || 'Unknown Asset',
            value: exchange.requesting.type === 'cash' ? exchange.requesting.cashAmount : exchange.requesting.assetValue,
          },
        };

        if (!assetService.transferOwnership(assetId, exchange.toParty, historyEntry)) {
          throw new Error('Failed to transfer asset ownership');
        }

        if (!inventoryService.transferAssetFromEscrow(exchange.fromParty, exchange.toParty, assetId, assetType)) {
          throw new Error('Failed to transfer asset from escrow');
        }
      }

      // Transfer requesting from escrow (toParty → fromParty)
      if (exchange.requesting.type === 'cash') {
        if (!inventoryService.transferCashFromEscrow(exchange.toParty, exchange.fromParty, exchange.requesting.cashAmount!)) {
          throw new Error('Failed to transfer cash from escrow');
        }
      } else {
        // Transfer asset ownership
        const assetId = exchange.requesting.assetId!;
        const assetType = exchange.requesting.type === 'real_estate' ? 'real_estate' : 'private_equity';
        
        // Add history entry
        const historyEntry: OwnershipHistory = {
          timestamp: new Date(),
          fromParty: exchange.toPartyName,
          toParty: exchange.fromPartyName,
          exchangeId: exchange.id,
          exchangedFor: {
            type: exchange.offering.type,
            description: exchange.offering.type === 'cash' 
              ? `$${exchange.offering.cashAmount?.toLocaleString()}`
              : exchange.offering.assetName || 'Unknown Asset',
            value: exchange.offering.type === 'cash' ? exchange.offering.cashAmount : exchange.offering.assetValue,
          },
        };

        if (!assetService.transferOwnership(assetId, exchange.fromParty, historyEntry)) {
          throw new Error('Failed to transfer asset ownership');
        }

        if (!inventoryService.transferAssetFromEscrow(exchange.toParty, exchange.fromParty, assetId, assetType)) {
          throw new Error('Failed to transfer asset from escrow');
        }
      }

      return true;
    } catch (error) {
      console.error('Exchange execution failed:', error);
      return false;
    }
  }

  /**
   * Get exchange by ID
   */
  getExchange(exchangeId: string): ExchangeProposal | null {
    return this.exchanges.get(exchangeId) || null;
  }

  /**
   * Get all exchanges
   */
  getAllExchanges(): ExchangeProposal[] {
    return Array.from(this.exchanges.values());
  }

  /**
   * Get exchanges by party
   */
  getExchangesByParty(partyId: string): ExchangeProposal[] {
    return this.getAllExchanges().filter(
      ex => ex.fromParty === partyId || ex.toParty === partyId
    );
  }

  /**
   * Cancel exchange (only by creator before acceptance)
   */
  cancelExchange(exchangeId: string, requestingPartyId: string): boolean {
    const exchange = this.exchanges.get(exchangeId);
    
    if (!exchange) return false;
    if (exchange.status !== 'pending') return false;
    if (exchange.fromParty !== requestingPartyId) return false;

    // Release both offerings from escrow
    this.releaseOfferingFromEscrow(exchange.fromParty, exchange.offering);
    this.releaseOfferingFromEscrow(exchange.toParty, exchange.requesting);

    exchange.status = 'cancelled';
    console.log(`Exchange ${exchangeId} cancelled and assets released from escrow`);
    return true;
  }

  /**
   * Lock offering in escrow (cash or asset)
   */
  private lockOfferingInEscrow(partyId: string, offering: ExchangeOffer): boolean {
    if (offering.type === 'cash') {
      return inventoryService.lockCashInEscrow(partyId, offering.cashAmount!);
    } else {
      const assetType = offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
      return inventoryService.lockAssetInEscrow(partyId, offering.assetId!, assetType);
    }
  }

  /**
   * Release offering from escrow (cash or asset)
   */
  private releaseOfferingFromEscrow(partyId: string, offering: ExchangeOffer): boolean {
    if (offering.type === 'cash') {
      return inventoryService.releaseCashFromEscrow(partyId, offering.cashAmount!);
    } else {
      const assetType = offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
      return inventoryService.releaseAssetFromEscrow(partyId, offering.assetId!, assetType);
    }
  }
}

export default new ExchangeService();

