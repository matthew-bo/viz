/**
 * Assets API Routes
 * Handles asset queries and history
 */

import { Router } from 'express';
import assetService from '../services/assetService';

const router = Router();

/**
 * GET /api/assets/:assetId
 * Get asset details including ownership history
 */
router.get('/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    const asset = assetService.getAsset(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error: any) {
    console.error('Failed to get asset:', error);
    res.status(500).json({ 
      error: 'Failed to get asset',
      details: error?.message || String(error)
    });
  }
});

/**
 * GET /api/assets/:assetId/history
 * Get ownership history for an asset
 */
router.get('/:assetId/history', async (req, res) => {
  try {
    const { assetId } = req.params;

    const history = assetService.getAssetHistory(assetId);

    if (!history) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(history);
  } catch (error: any) {
    console.error('Failed to get asset history:', error);
    res.status(500).json({ 
      error: 'Failed to get asset history',
      details: error?.message || String(error)
    });
  }
});

/**
 * GET /api/assets
 * Get all assets (with optional filtering)
 */
router.get('/', async (req, res) => {
  try {
    const { type, owner } = req.query;

    let realEstate = assetService.getAllRealEstate();
    let privateEquity = assetService.getAllPrivateEquity();

    // Filter by owner if specified
    if (owner) {
      const ownerId = owner as string;
      realEstate = realEstate.filter(a => a.ownerId === ownerId);
      privateEquity = privateEquity.filter(a => a.ownerId === ownerId);
    }

    // Return based on type filter
    if (type === 'real_estate') {
      res.json({ realEstate });
    } else if (type === 'private_equity') {
      res.json({ privateEquity });
    } else {
      res.json({ realEstate, privateEquity });
    }
  } catch (error: any) {
    console.error('Failed to get assets:', error);
    res.status(500).json({ 
      error: 'Failed to get assets',
      details: error?.message || String(error)
    });
  }
});

export default router;

