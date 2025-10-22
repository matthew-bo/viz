/**
 * Inventory API Routes
 * Handles party inventory queries
 */

import { Router } from 'express';
import inventoryService from '../services/inventoryService';

const router = Router();

/**
 * GET /api/inventory/:partyId
 * Get inventory for a specific party
 */
router.get('/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;

    const snapshot = inventoryService.getInventorySnapshot(partyId);

    if (!snapshot) {
      return res.status(404).json({ error: 'Inventory not found for party' });
    }

    console.log(`✓ Retrieved inventory for ${snapshot.displayName}`);
    res.json(snapshot);
  } catch (error: any) {
    console.error('Failed to get inventory:', error);
    res.status(500).json({ 
      error: 'Failed to get inventory',
      details: error?.message || String(error)
    });
  }
});

/**
 * GET /api/inventory
 * Get all inventories (for admin/debugging)
 */
router.get('/', async (req, res) => {
  try {
    const inventories = inventoryService.getAllInventories();
    
    // Get detailed snapshots for all
    const snapshots = inventories
      .map(inv => inventoryService.getInventorySnapshot(inv.partyId))
      .filter(s => s !== null);

    res.json(snapshots);
  } catch (error: any) {
    console.error('Failed to get inventories:', error);
    res.status(500).json({ 
      error: 'Failed to get inventories',
      details: error?.message || String(error)
    });
  }
});

export default router;

