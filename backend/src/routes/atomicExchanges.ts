/**
 * Atomic Exchange Routes (Canton Tokenized Assets)
 * 
 * Provides API for querying Canton-tokenized assets.
 * Exchange functionality is handled by the main /api/exchanges routes.
 */

import { Router } from 'express';
import * as cantonAssetService from '../canton/canton-asset-service';

const router = Router();

/**
 * GET /api/atomic/inventory/:partyName
 * Get tokenized inventory for a party from Canton
 */
router.get('/inventory/:partyName', async (req, res) => {
  try {
    const { partyName } = req.params;
    const inventory = await cantonAssetService.getCantonInventory(partyName);
    res.json(inventory);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to get inventory', details: message });
  }
});

/**
 * GET /api/atomic/inventory
 * Get all tokenized inventories from Canton
 */
router.get('/inventory', async (req, res) => {
  try {
    const parties = cantonAssetService.getAllParties();
    const inventories = await Promise.all(
      parties.map(p => cantonAssetService.getCantonInventory(p.displayName))
    );
    res.json(inventories);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Failed to get inventories', details: message });
  }
});

/**
 * GET /api/atomic/health
 * Check Canton health
 */
router.get('/health', async (req, res) => {
  try {
    const healthy = await cantonAssetService.checkCantonHealth();
    res.json({ 
      status: healthy ? 'healthy' : 'unavailable',
      message: healthy ? 'Canton ledger is available' : 'Canton ledger not available'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: 'error', message });
  }
});

export default router;
