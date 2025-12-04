/**
 * Exchanges API Routes
 * 
 * Uses in-memory exchangeService for exchange management.
 * Assets are locked in escrow during pending exchanges.
 */

import { Router } from 'express';
import exchangeService from '../services/exchangeService';
import inventoryService from '../services/inventoryService';
import assetService from '../services/assetService';
import { broadcast } from './events';

const router = Router();

/**
 * POST /api/exchanges
 * Create new exchange proposal
 */
router.post('/', async (req, res) => {
  try {
    const { fromParty, toParty, offering, requesting, description } = req.body;

    if (!fromParty || !toParty || !offering || !requesting) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get party display names
    const fromInventory = inventoryService.getInventory(fromParty);
    const toInventory = inventoryService.getInventory(toParty);

    if (!fromInventory || !toInventory) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const fromPartyName = fromInventory.displayName;
    const toPartyName = toInventory.displayName;

    // Enrich offering with asset details
    if (offering.type !== 'cash' && offering.assetId) {
      const asset = assetService.getAsset(offering.assetId);
      if (asset) {
        offering.assetName = asset.name;
        offering.assetValue = asset.type === 'real_estate' ? asset.value : asset.valuation;
      }
    }

    // Enrich requesting with asset details
    if (requesting.type !== 'cash' && requesting.assetId) {
      const asset = assetService.getAsset(requesting.assetId);
      if (asset) {
        requesting.assetName = asset.name;
        requesting.assetValue = asset.type === 'real_estate' ? asset.value : asset.valuation;
      }
    }

    // Lock proposer's offering in escrow
    const lockResult = lockOfferingInEscrow(fromParty, offering);
    if (!lockResult.success) {
      return res.status(400).json({ error: lockResult.error });
    }

    try {
      const exchange = exchangeService.createExchange(
        fromParty,
        fromPartyName,
        toParty,
        toPartyName,
        offering,
        requesting,
        description
      );

      if (!exchange) {
        releaseOfferingFromEscrow(fromParty, offering);
        return res.status(400).json({ error: 'Failed to create exchange' });
      }

      broadcast({ type: 'exchange', data: exchange });
      res.status(201).json(exchange);
    } catch (error) {
      releaseOfferingFromEscrow(fromParty, offering);
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to create exchange', details: message });
  }
});

/**
 * POST /api/exchanges/:id/accept
 * Accept an exchange proposal
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { acceptingParty } = req.body;

    if (!acceptingParty) {
      return res.status(400).json({ error: 'Missing acceptingParty' });
    }

    const success = exchangeService.acceptExchange(id, acceptingParty);

    if (!success) {
      return res.status(400).json({ error: 'Failed to accept exchange' });
    }

    const exchange = exchangeService.getExchange(id);

    broadcast({ type: 'exchange', data: exchange });
    broadcast({
      type: 'inventory_update',
      data: { 
        parties: [
          inventoryService.getInventorySnapshot(exchange!.fromParty),
          inventoryService.getInventorySnapshot(exchange!.toParty)
        ] 
      }
    });

    res.json(exchange);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to accept exchange', details: message });
  }
});

/**
 * POST /api/exchanges/:id/cancel
 * Cancel an exchange proposal (proposer only)
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { requestingParty } = req.body;

    if (!requestingParty) {
      return res.status(400).json({ error: 'Missing requestingParty' });
    }

    const success = exchangeService.cancelExchange(id, requestingParty);

    if (!success) {
      return res.status(400).json({ error: 'Failed to cancel exchange' });
    }

    broadcast({ type: 'exchange', data: { id, status: 'cancelled' } });
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to cancel exchange', details: message });
  }
});

/**
 * POST /api/exchanges/:id/reject
 * Reject an exchange proposal (responder only)
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectingParty } = req.body;

    if (!rejectingParty) {
      return res.status(400).json({ error: 'Missing rejectingParty' });
    }

    const success = exchangeService.rejectExchange(id, rejectingParty);

    if (!success) {
      return res.status(400).json({ error: 'Failed to reject exchange' });
    }

    broadcast({ type: 'exchange', data: { id, status: 'rejected' } });
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to reject exchange', details: message });
  }
});

/**
 * GET /api/exchanges
 * Get all exchanges (optionally filtered by party)
 */
router.get('/', async (req, res) => {
  try {
    const { party } = req.query;

    const exchanges = party
      ? exchangeService.getExchangesByParty(party as string)
      : exchangeService.getAllExchanges();

    res.json(exchanges);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to get exchanges', details: message });
  }
});

/**
 * GET /api/exchanges/:id
 * Get exchange by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exchange = exchangeService.getExchange(id);

    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    res.json(exchange);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to get exchange', details: message });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function lockOfferingInEscrow(
  partyId: string, 
  offering: { type: string; cashAmount?: number; assetId?: string }
): { success: boolean; error?: string } {
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

function releaseOfferingFromEscrow(
  partyId: string,
  offering: { type: string; cashAmount?: number; assetId?: string }
): boolean {
  if (offering.type === 'cash' && offering.cashAmount) {
    return inventoryService.releaseCashFromEscrow(partyId, offering.cashAmount);
  } else if (offering.assetId) {
    const assetType = offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
    return inventoryService.releaseAssetFromEscrow(partyId, offering.assetId, assetType);
  }
  return false;
}

export default router;
