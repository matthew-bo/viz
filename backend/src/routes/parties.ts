import { Router } from 'express';
import { ledgerClient } from '../canton';

const router = Router();

/**
 * GET /api/parties
 * Get all parties for UI
 * Returns array of party configurations with display names and full party IDs
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/parties');
    
    const parties = ledgerClient.getAllParties();
    
    console.log(`✓ Returning ${parties.length} parties`);
    res.json(parties);
  } catch (error: any) {
    console.error('Failed to get parties:', error);
    res.status(500).json({ 
      error: 'Failed to get parties',
      details: error?.message || String(error)
    });
  }
});

export default router;

