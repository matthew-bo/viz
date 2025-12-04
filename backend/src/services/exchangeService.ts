/**
 * Exchange Service
 * 
 * Manages asset exchange proposals and executions.
 * 
 * Escrow Pattern:
 * - Create: Only proposer's offering is locked (they authorize by creating)
 * - Accept: Responder's assets are locked AND swap is executed atomically
 * - Cancel/Reject: Proposer's escrowed assets are released
 */

import { ExchangeProposal, ExchangeOffer } from '../models/Exchange';
import assetService from './assetService';
import inventoryService from './inventoryService';
import { OwnershipHistory } from '../models/Asset';

class ExchangeService {
  private exchanges: Map<string, ExchangeProposal> = new Map();
  private exchangeCounter = 0;

  /**
   * Create a new exchange proposal
   * Note: Proposer's offering should already be locked by the route handler
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
    const exchangeId = `ex_${Date.now()}_${++this.exchangeCounter}`;
    
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
    return exchange;
  }

  /**
   * Accept exchange and execute transfers
   */
  acceptExchange(exchangeId: string, acceptingPartyId: string): boolean {
    const exchange = this.exchanges.get(exchangeId);
    
    if (!exchange) return false;
    if (exchange.status !== 'pending') return false;
    
    // Check if accepting party matches (compare both full ID and display name)
    const isRecipient = exchange.toParty === acceptingPartyId || 
                        exchange.toPartyName === acceptingPartyId ||
                        exchange.toParty.startsWith(acceptingPartyId + '::');
    if (!isRecipient) return false;

    // Lock responder's assets first (they're authorizing by accepting)
    const responderLock = this.lockOffering(exchange.toParty, exchange.requesting);
    if (!responderLock.success) {
      return false;
    }

    // Execute the swap
    const success = this.executeExchange(exchange);
    
    if (success) {
      exchange.status = 'accepted';
      exchange.acceptedAt = new Date();
      return true;
    } else {
      // Rollback responder's lock on failure
      this.releaseOfferingFromEscrow(exchange.toParty, exchange.requesting);
      return false;
    }
  }

  /**
   * Lock offering in escrow
   */
  private lockOffering(partyId: string, offering: ExchangeOffer): { success: boolean; error?: string } {
    if (offering.type === 'cash') {
      if (!offering.cashAmount || offering.cashAmount <= 0) {
        return { success: false, error: 'Invalid cash amount' };
      }
      return inventoryService.validateAndLockCash(partyId, offering.cashAmount);
    } else {
      if (!offering.assetId) {
        return { success: false, error: 'Asset ID required' };
      }
      const assetType = offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
      return inventoryService.validateAndLockAsset(partyId, offering.assetId, assetType);
    }
  }

  /**
   * Execute the asset/cash transfers from escrow
   */
  private executeExchange(exchange: ExchangeProposal): boolean {
    const rollbackActions: Array<() => void> = [];
    
    try {
      // Transfer proposer's offering to responder
      if (exchange.offering.type === 'cash') {
        if (!inventoryService.transferCashFromEscrow(exchange.fromParty, exchange.toParty, exchange.offering.cashAmount!)) {
          throw new Error('Failed to transfer offering cash');
        }
        rollbackActions.push(() => {
          inventoryService.transferCashFromEscrow(exchange.toParty, exchange.fromParty, exchange.offering.cashAmount!);
        });
      } else {
        const assetId = exchange.offering.assetId!;
        const assetType = exchange.offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
        
        const historyEntry: OwnershipHistory = {
          timestamp: new Date(),
          fromParty: exchange.fromPartyName,
          toParty: exchange.toPartyName,
          exchangeId: exchange.id,
          exchangedFor: {
            type: exchange.requesting.type,
            description: exchange.requesting.type === 'cash' 
              ? `$${exchange.requesting.cashAmount?.toLocaleString()}`
              : exchange.requesting.assetName || 'Asset',
            value: exchange.requesting.type === 'cash' ? exchange.requesting.cashAmount : exchange.requesting.assetValue,
          },
        };

        if (!assetService.transferOwnership(assetId, exchange.toParty, historyEntry)) {
          throw new Error('Failed to transfer offering asset');
        }

        if (!inventoryService.transferAssetFromEscrow(exchange.fromParty, exchange.toParty, assetId, assetType)) {
          throw new Error('Failed to transfer offering asset from escrow');
        }
        
        rollbackActions.push(() => {
          assetService.transferOwnership(assetId, exchange.fromParty, {
            timestamp: new Date(),
            fromParty: exchange.toPartyName,
            toParty: exchange.fromPartyName,
            exchangeId: exchange.id + '_rollback',
            exchangedFor: { type: 'cash', description: 'Rollback', value: 0 }
          });
          inventoryService.addAsset(exchange.fromParty, assetId, assetType);
        });
      }

      // Transfer responder's requesting to proposer
      if (exchange.requesting.type === 'cash') {
        if (!inventoryService.transferCashFromEscrow(exchange.toParty, exchange.fromParty, exchange.requesting.cashAmount!)) {
          throw new Error('Failed to transfer requesting cash');
        }
        rollbackActions.push(() => {
          inventoryService.transferCashFromEscrow(exchange.fromParty, exchange.toParty, exchange.requesting.cashAmount!);
        });
      } else {
        const assetId = exchange.requesting.assetId!;
        const assetType = exchange.requesting.type === 'real_estate' ? 'real_estate' : 'private_equity';
        
        const historyEntry: OwnershipHistory = {
          timestamp: new Date(),
          fromParty: exchange.toPartyName,
          toParty: exchange.fromPartyName,
          exchangeId: exchange.id,
          exchangedFor: {
            type: exchange.offering.type,
            description: exchange.offering.type === 'cash' 
              ? `$${exchange.offering.cashAmount?.toLocaleString()}`
              : exchange.offering.assetName || 'Asset',
            value: exchange.offering.type === 'cash' ? exchange.offering.cashAmount : exchange.offering.assetValue,
          },
        };

        if (!assetService.transferOwnership(assetId, exchange.fromParty, historyEntry)) {
          throw new Error('Failed to transfer requesting asset');
        }

        if (!inventoryService.transferAssetFromEscrow(exchange.toParty, exchange.fromParty, assetId, assetType)) {
          throw new Error('Failed to transfer requesting asset from escrow');
        }
        
        rollbackActions.push(() => {
          assetService.transferOwnership(assetId, exchange.toParty, {
            timestamp: new Date(),
            fromParty: exchange.fromPartyName,
            toParty: exchange.toPartyName,
            exchangeId: exchange.id + '_rollback',
            exchangedFor: { type: 'cash', description: 'Rollback', value: 0 }
          });
          inventoryService.addAsset(exchange.toParty, assetId, assetType);
        });
      }

      return true;
      
    } catch (error) {
      // Execute rollbacks in reverse order
      rollbackActions.reverse().forEach(fn => {
        try { fn(); } catch { /* ignore rollback errors */ }
      });
      return false;
    }
  }

  getExchange(exchangeId: string): ExchangeProposal | null {
    return this.exchanges.get(exchangeId) || null;
  }

  getAllExchanges(): ExchangeProposal[] {
    return Array.from(this.exchanges.values());
  }

  getExchangesByParty(partyId: string): ExchangeProposal[] {
    return this.getAllExchanges().filter(
      ex => ex.fromParty === partyId || ex.toParty === partyId
    );
  }

  /**
   * Cancel exchange (only by proposer before acceptance)
   */
  cancelExchange(exchangeId: string, requestingPartyId: string): boolean {
    const exchange = this.exchanges.get(exchangeId);
    
    if (!exchange) return false;
    if (exchange.status !== 'pending') return false;
    
    // Check if requesting party is the proposer (compare both full ID and display name)
    const isProposer = exchange.fromParty === requestingPartyId || 
                       exchange.fromPartyName === requestingPartyId ||
                       exchange.fromParty.startsWith(requestingPartyId + '::');
    if (!isProposer) return false;

    // Release proposer's offering from escrow
    this.releaseOfferingFromEscrow(exchange.fromParty, exchange.offering);

    exchange.status = 'cancelled';
    return true;
  }

  /**
   * Reject exchange (only by responder before acceptance)
   */
  rejectExchange(exchangeId: string, rejectingPartyId: string): boolean {
    const exchange = this.exchanges.get(exchangeId);
    
    if (!exchange) return false;
    if (exchange.status !== 'pending') return false;
    
    // Check if rejecting party is the responder (compare both full ID and display name)
    const isRecipient = exchange.toParty === rejectingPartyId || 
                        exchange.toPartyName === rejectingPartyId ||
                        exchange.toParty.startsWith(rejectingPartyId + '::');
    if (!isRecipient) return false;

    // Release proposer's offering from escrow (return to proposer)
    this.releaseOfferingFromEscrow(exchange.fromParty, exchange.offering);

    exchange.status = 'rejected';
    return true;
  }

  /**
   * Release offering from escrow
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
