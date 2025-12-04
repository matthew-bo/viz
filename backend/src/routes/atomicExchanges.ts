/**
 * Atomic Exchange Routes
 * 
 * TRUE ESCROW FLOW:
 * 1. POST /exchanges - Creates proposal, atomically escrowing proposer's asset
 * 2. POST /exchanges/:id/accept - Atomically swaps assets
 * 3. POST /exchanges/:id/cancel - Returns escrowed asset to proposer
 */

import { Router } from 'express';
import { tokenizedAssetClient } from '../canton/tokenized-asset-client';
import { broadcast } from './events';

const router = Router();

/**
 * GET /api/atomic/inventory/:partyName
 * Get tokenized inventory for a party
 */
router.get('/inventory/:partyName', async (req, res) => {
  try {
    const { partyName } = req.params;
    const inventory = await tokenizedAssetClient.getTokenizedInventory(partyName);
    res.json(inventory);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to get inventory', details: message });
  }
});

/**
 * GET /api/atomic/inventory
 * Get all tokenized inventories
 */
router.get('/inventory', async (req, res) => {
  try {
    const parties = tokenizedAssetClient.getAllParties();
    const inventories = await Promise.all(
      parties.map(p => tokenizedAssetClient.getTokenizedInventory(p.displayName))
    );
    res.json(inventories);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to get inventories', details: message });
  }
});

/**
 * POST /api/atomic/exchanges
 * Create exchange proposal with TRUE escrow
 * 
 * Body:
 * - proposerName: string
 * - responderName: string
 * - assetContractId: string (the proposer's asset to escrow)
 * - assetType: "cash" | "real_estate" | "private_equity"
 * - requesting: { type, amount?, assetId? }
 * - description?: string
 */
router.post('/exchanges', async (req, res) => {
  try {
    const { 
      proposerName, 
      responderName, 
      assetContractId,
      assetType,
      requesting,
      description 
    } = req.body;

    if (!proposerName || !responderName || !assetContractId || !assetType || !requesting) {
      return res.status(400).json({ 
        error: 'Missing required fields: proposerName, responderName, assetContractId, assetType, requesting' 
      });
    }

    const proposal = await tokenizedAssetClient.createExchangeProposal(
      proposerName,
      responderName,
      assetContractId,
      assetType,
      requesting,
      description
    );

    broadcast({ type: 'atomic_exchange', data: proposal });
    res.status(201).json(proposal);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to create exchange', details: message });
  }
});

/**
 * POST /api/atomic/exchanges/:contractId/accept
 * Accept exchange - atomically swap assets
 * 
 * Body:
 * - responderName: string
 * - assetType: "cash" | "real_estate" | "private_equity"
 * - assetContractId: string (responder's asset to swap)
 */
router.post('/exchanges/:contractId/accept', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { responderName, assetType, assetContractId } = req.body;

    if (!responderName || !assetType || !assetContractId) {
      return res.status(400).json({ 
        error: 'Missing required fields: responderName, assetType, assetContractId' 
      });
    }

    let result;
    
    switch (assetType) {
      case 'cash':
        result = await tokenizedAssetClient.acceptWithCash(
          responderName,
          contractId,
          assetContractId
        );
        break;
      case 'real_estate':
        result = await tokenizedAssetClient.acceptWithRealEstate(
          responderName,
          contractId,
          assetContractId
        );
        break;
      case 'private_equity':
        result = await tokenizedAssetClient.acceptWithPrivateEquity(
          responderName,
          contractId,
          assetContractId
        );
        break;
      default:
        return res.status(400).json({ error: `Invalid asset type: ${assetType}` });
    }

    broadcast({ type: 'atomic_exchange', data: result });
    broadcast({ type: 'inventory_update', data: { type: 'swap_complete' } });

    res.json(result);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to accept exchange', details: message });
  }
});

/**
 * POST /api/atomic/exchanges/:contractId/cancel
 * Cancel proposal - returns escrowed asset to proposer
 */
router.post('/exchanges/:contractId/cancel', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { proposerName } = req.body;

    if (!proposerName) {
      return res.status(400).json({ error: 'Missing proposerName' });
    }

    await tokenizedAssetClient.cancelProposal(proposerName, contractId);

    broadcast({ type: 'atomic_exchange', data: { contractId, status: 'cancelled' } });
    res.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to cancel exchange', details: message });
  }
});

/**
 * POST /api/atomic/exchanges/:contractId/reject
 * Reject proposal - returns escrowed asset to proposer
 */
router.post('/exchanges/:contractId/reject', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { responderName } = req.body;

    if (!responderName) {
      return res.status(400).json({ error: 'Missing responderName' });
    }

    await tokenizedAssetClient.rejectProposal(responderName, contractId);

    broadcast({ type: 'atomic_exchange', data: { contractId, status: 'rejected' } });
    res.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to reject exchange', details: message });
  }
});

/**
 * GET /api/atomic/exchanges
 * Get all proposals and completed exchanges
 */
router.get('/exchanges', async (req, res) => {
  try {
    const { partyName } = req.query;
    
    if (!partyName || typeof partyName !== 'string') {
      return res.status(400).json({ error: 'partyName query parameter required' });
    }

    const [pending, completed] = await Promise.all([
      tokenizedAssetClient.getPendingProposals(partyName),
      tokenizedAssetClient.getCompletedExchanges(partyName)
    ]);

    res.json({
      pending,
      completed,
      all: [...pending, ...completed].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to get exchanges', details: message });
  }
});

export default router;
