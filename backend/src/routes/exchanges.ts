/**
 * Exchanges API Routes
 * 
 * DUAL MODE OPERATION:
 * - When Canton is available: Uses tokenizedAssetClient for TRUE blockchain escrow
 * - When Canton is unavailable: Falls back to in-memory exchangeService
 * 
 * The frontend doesn't need to know which mode is active - the API is the same.
 */

import { Router } from 'express';
import exchangeService from '../services/exchangeService';
import inventoryService from '../services/inventoryService';
import assetService from '../services/assetService';
import { cantonAssetRegistry } from '../services/cantonAssetRegistry';
import { tokenizedAssetClient } from '../canton/tokenized-asset-client';
import { broadcast } from './events';

const router = Router();

/**
 * POST /api/exchanges
 * Create new exchange proposal
 * 
 * When Canton is available:
 * - Finds the Canton contract ID for the offered asset
 * - Calls tokenizedAssetClient.createExchangeProposal
 * - This archives the asset and creates an EscrowedExchangeProposal
 * 
 * When Canton is unavailable:
 * - Uses in-memory exchangeService
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

    // Try Canton first if available
    if (cantonAssetRegistry.isCantonAvailable()) {
      try {
        let assetContractId: string | null = null;
        let assetType: 'cash' | 'real_estate' | 'private_equity';

        if (offering.type === 'cash') {
          assetContractId = cantonAssetRegistry.getCashContractId(fromPartyName, offering.cashAmount);
          assetType = 'cash';
        } else {
          assetContractId = cantonAssetRegistry.getContractId(offering.assetId);
          assetType = offering.type === 'real_estate' ? 'real_estate' : 'private_equity';
        }

        if (!assetContractId) {
          console.log(`⚠ Canton contract not found for ${offering.assetId || 'cash'}, falling back to in-memory`);
        } else {
          // Create proposal on Canton (TRUE escrow)
          const proposal = await tokenizedAssetClient.createExchangeProposal(
            fromPartyName,
            toPartyName,
            assetContractId,
            assetType,
            {
              type: requesting.type,
              amount: requesting.cashAmount,
              assetId: requesting.assetId
            },
            description
          );

          // Also lock in in-memory for UI consistency
          lockOfferingInEscrow(fromParty, offering);

          // Create a compatible exchange object for the frontend
          const exchange = {
            id: proposal.contractId,
            fromParty,
            fromPartyName,
            toParty,
            toPartyName,
            offering,
            requesting,
            description,
            status: 'pending',
            createdAt: new Date(proposal.createdAt),
            cantonBacked: true
          };

          broadcast({ type: 'exchange', data: exchange });
          console.log(`✓ Canton exchange created: ${proposal.contractId}`);
          return res.status(201).json(exchange);
        }
      } catch (cantonError) {
        console.log(`⚠ Canton exchange failed, falling back: ${cantonError}`);
      }
    }

    // Fallback to in-memory exchange
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

    // Check if this is a Canton-backed exchange (contractId format)
    if (cantonAssetRegistry.isCantonAvailable() && id.startsWith('#')) {
      try {
        // Get the exchange proposal from Canton
        const proposals = await tokenizedAssetClient.getPendingProposals(acceptingParty);
        const proposal = proposals.find(p => p.contractId === id);

        if (!proposal) {
          return res.status(404).json({ error: 'Exchange proposal not found on Canton' });
        }

        // Determine what asset to provide
        const requestType = proposal.requesting.type;
        let assetContractId: string | null = null;

        if (requestType === 'cash') {
          assetContractId = cantonAssetRegistry.getCashContractId(
            acceptingParty,
            proposal.requesting.amount!
          );
        } else {
          assetContractId = cantonAssetRegistry.getContractId(proposal.requesting.assetId!);
        }

        if (!assetContractId) {
          return res.status(400).json({ error: 'Required asset not found for acceptance' });
        }

        // Execute atomic swap on Canton
        let result;
        if (requestType === 'cash') {
          result = await tokenizedAssetClient.acceptWithCash(acceptingParty, id, assetContractId);
        } else if (requestType === 'real_estate') {
          result = await tokenizedAssetClient.acceptWithRealEstate(acceptingParty, id, assetContractId);
        } else {
          result = await tokenizedAssetClient.acceptWithPrivateEquity(acceptingParty, id, assetContractId);
        }

        // Refresh registry to update contract IDs
        await cantonAssetRegistry.refreshFromCanton();

        broadcast({ type: 'exchange', data: { ...result, status: 'accepted' } });
        broadcast({ type: 'inventory_update', data: { parties: [proposal.proposerName, proposal.responderName] } });

        console.log(`✓ Canton exchange accepted: ${id}`);
        return res.json({ ...result, status: 'accepted' });
      } catch (cantonError) {
        console.log(`⚠ Canton accept failed: ${cantonError}`);
        // Fall through to in-memory
      }
    }

    // In-memory fallback
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

    // Try Canton first
    if (cantonAssetRegistry.isCantonAvailable() && id.startsWith('#')) {
      try {
        await tokenizedAssetClient.cancelProposal(requestingParty, id);
        await cantonAssetRegistry.refreshFromCanton();

        broadcast({ type: 'exchange', data: { id, status: 'cancelled' } });
        console.log(`✓ Canton exchange cancelled: ${id}`);
        return res.json({ success: true });
      } catch (cantonError) {
        console.log(`⚠ Canton cancel failed: ${cantonError}`);
      }
    }

    // In-memory fallback
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

    // Try Canton first
    if (cantonAssetRegistry.isCantonAvailable() && id.startsWith('#')) {
      try {
        await tokenizedAssetClient.rejectProposal(rejectingParty, id);
        await cantonAssetRegistry.refreshFromCanton();

        broadcast({ type: 'exchange', data: { id, status: 'rejected' } });
        console.log(`✓ Canton exchange rejected: ${id}`);
        return res.json({ success: true });
      } catch (cantonError) {
        console.log(`⚠ Canton reject failed: ${cantonError}`);
      }
    }

    // In-memory fallback
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

    // Get in-memory exchanges
    let exchanges = party
      ? exchangeService.getExchangesByParty(party as string)
      : exchangeService.getAllExchanges();

    // If Canton is available, also get Canton proposals
    if (cantonAssetRegistry.isCantonAvailable() && party) {
      try {
        const partyName = inventoryService.getInventory(party as string)?.displayName || party;
        const [pending, completed] = await Promise.all([
          tokenizedAssetClient.getPendingProposals(partyName as string),
          tokenizedAssetClient.getCompletedExchanges(partyName as string)
        ]);

        // Convert Canton proposals to exchange format
        const cantonExchanges = [...pending, ...completed].map(p => ({
          id: p.contractId,
          fromParty: p.proposer,
          fromPartyName: p.proposerName,
          toParty: p.responder,
          toPartyName: p.responderName,
          offering: {
            type: p.escrowed.type as 'cash' | 'real_estate' | 'private_equity',
            cashAmount: p.escrowed.type === 'cash' ? p.escrowed.value : undefined,
            assetId: p.escrowed.type !== 'cash' ? p.escrowed.description : undefined,
            assetName: p.escrowed.description,
            assetValue: p.escrowed.value
          },
          requesting: {
            type: p.requesting.type as 'cash' | 'real_estate' | 'private_equity',
            cashAmount: p.requesting.amount,
            assetId: p.requesting.assetId
          },
          status: p.status as 'pending' | 'accepted' | 'rejected' | 'cancelled',
          createdAt: new Date(p.createdAt),
          acceptedAt: p.completedAt ? new Date(p.completedAt) : undefined,
          cantonBacked: true
        }));

        // Merge, preferring Canton exchanges
        const cantonIds = new Set(cantonExchanges.map(e => e.id));
        exchanges = [
          ...cantonExchanges,
          ...exchanges.filter(e => !cantonIds.has(e.id))
        ];
      } catch (cantonError) {
        console.log(`⚠ Failed to fetch Canton exchanges: ${cantonError}`);
      }
    }

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

    // Try Canton first for Canton-style IDs
    if (cantonAssetRegistry.isCantonAvailable() && id.startsWith('#')) {
      try {
        for (const partyName of ['TechBank', 'GlobalCorp', 'RetailFinance']) {
          const pending = await tokenizedAssetClient.getPendingProposals(partyName);
          const found = pending.find(p => p.contractId === id);
          if (found) {
            return res.json({
              id: found.contractId,
              fromParty: found.proposer,
              fromPartyName: found.proposerName,
              toParty: found.responder,
              toPartyName: found.responderName,
              offering: { type: found.escrowed.type, assetName: found.escrowed.description },
              requesting: found.requesting,
              status: found.status,
              createdAt: new Date(found.createdAt),
              cantonBacked: true
            });
          }
        }
      } catch (cantonError) {
        console.log(`⚠ Canton lookup failed: ${cantonError}`);
      }
    }

    // In-memory fallback
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

// Helper functions for escrow management

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
