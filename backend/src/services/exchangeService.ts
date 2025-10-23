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
    const exchangeId = `ex_${Date.now()}_${++this.exchangeCounter}`;
    
    // Atomically validate and lock offered assets/cash in escrow
    const offeringLock = this.atomicLockOffering(fromParty, offering);
    if (!offeringLock.success) {
      console.error('Failed to lock offering:', offeringLock.error);
      return null;
    }

    // Atomically validate and lock requested assets/cash in escrow
    const requestingLock = this.atomicLockOffering(toParty, requesting);
    if (!requestingLock.success) {
      console.error('Failed to lock requesting:', requestingLock.error);
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
   * Atomically validate and lock offering in escrow
   * Prevents race conditions by combining validation and locking
   */
  private atomicLockOffering(partyId: string, offering: ExchangeOffer): { success: boolean; error?: string } {
    if (offering.type === 'cash') {
      // Validate amount
      if (!offering.cashAmount || offering.cashAmount <= 0) {
        return { success: false, error: 'Invalid cash amount' };
      }
      // Atomically validate and lock
      return inventoryService.validateAndLockCash(partyId, offering.cashAmount);
    } else {
      // Validate asset ID
      if (!offering.assetId) {
        return { success: false, error: 'Asset ID required' };
      }
      const assetType = offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
      // Atomically validate and lock
      return inventoryService.validateAndLockAsset(partyId, offering.assetId, assetType);
    }
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
   * Implements rollback mechanism to ensure atomicity
   */
  private executeExchange(exchange: ExchangeProposal): boolean {
    // Track rollback actions in reverse order
    const rollbackActions: Array<() => void> = [];
    
    try {
      // Step 1: Transfer offering from escrow (fromParty → toParty)
      if (exchange.offering.type === 'cash') {
        if (!inventoryService.transferCashFromEscrow(exchange.fromParty, exchange.toParty, exchange.offering.cashAmount!)) {
          throw new Error('Failed to transfer offering cash from escrow');
        }
        // Rollback: reverse the cash transfer
        rollbackActions.push(() => {
          inventoryService.transferCashFromEscrow(exchange.toParty, exchange.fromParty, exchange.offering.cashAmount!);
          console.log('🔄 Rolled back offering cash transfer');
        });
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
          throw new Error('Failed to transfer offering asset ownership');
        }

        if (!inventoryService.transferAssetFromEscrow(exchange.fromParty, exchange.toParty, assetId, assetType)) {
          throw new Error('Failed to transfer offering asset from escrow');
        }
        
            // Rollback: reverse the asset transfer
            rollbackActions.push(() => {
              assetService.transferOwnership(assetId, exchange.fromParty, {
                timestamp: new Date(),
                fromParty: exchange.toPartyName,
                toParty: exchange.fromPartyName,
                exchangeId: exchange.id + '_rollback',
                exchangedFor: { type: 'cash', description: 'Exchange rollback', value: 0 }
              });
              // Move asset back to fromParty's available inventory
              inventoryService.addAsset(exchange.fromParty, assetId, assetType);
              console.log('🔄 Rolled back offering asset transfer');
            });
      }

      // Step 2: Transfer requesting from escrow (toParty → fromParty)
      if (exchange.requesting.type === 'cash') {
        if (!inventoryService.transferCashFromEscrow(exchange.toParty, exchange.fromParty, exchange.requesting.cashAmount!)) {
          throw new Error('Failed to transfer requesting cash from escrow');
        }
        // Rollback: reverse the cash transfer
        rollbackActions.push(() => {
          inventoryService.transferCashFromEscrow(exchange.fromParty, exchange.toParty, exchange.requesting.cashAmount!);
          console.log('🔄 Rolled back requesting cash transfer');
        });
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
          throw new Error('Failed to transfer requesting asset ownership');
        }

        if (!inventoryService.transferAssetFromEscrow(exchange.toParty, exchange.fromParty, assetId, assetType)) {
          throw new Error('Failed to transfer requesting asset from escrow');
        }
        
            // Rollback: reverse the asset transfer
            rollbackActions.push(() => {
              assetService.transferOwnership(assetId, exchange.toParty, {
                timestamp: new Date(),
                fromParty: exchange.fromPartyName,
                toParty: exchange.toPartyName,
                exchangeId: exchange.id + '_rollback',
                exchangedFor: { type: 'cash', description: 'Exchange rollback', value: 0 }
              });
              // Move asset back to toParty's available inventory
              inventoryService.addAsset(exchange.toParty, assetId, assetType);
              console.log('🔄 Rolled back requesting asset transfer');
            });
      }

      // All transfers successful!
      console.log(`✅ Exchange ${exchange.id} executed successfully`);
      return true;
      
    } catch (error) {
      console.error('❌ Exchange execution failed:', error);
      console.log(`🔄 Rolling back ${rollbackActions.length} operation(s)...`);
      
      // Execute rollback actions in reverse order (LIFO)
      rollbackActions.reverse().forEach((rollbackFn, index) => {
        try {
          rollbackFn();
        } catch (rollbackError) {
          console.error(`Failed to execute rollback action ${index + 1}:`, rollbackError);
        }
      });
      
      console.log('🔄 Rollback complete - exchange state restored');
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

