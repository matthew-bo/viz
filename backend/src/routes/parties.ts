import { Router } from 'express';
import { ledgerClient } from '../canton';

const router = Router();

// Assign consistent colors to parties for UI visualization
const PARTY_COLORS: Record<string, string> = {
  'TechBank': '#3b82f6',      // Blue
  'GlobalCorp': '#10b981',    // Green
  'RetailChain': '#f59e0b'    // Amber
};

/**
 * GET /api/parties
 * Get all parties for UI
 * Returns array of party configurations with display names, full party IDs, and colors
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/parties');
    
    const parties = ledgerClient.getAllParties();
    
    // Add colors to parties
    const partiesWithColors = parties.map(party => ({
      ...party,
      color: PARTY_COLORS[party.displayName] || '#6b7280' // Default gray
    }));
    
    console.log(`✓ Returning ${partiesWithColors.length} parties with colors`);
    res.json(partiesWithColors);
  } catch (error: any) {
    console.error('Failed to get parties:', error);
    res.status(500).json({ 
      error: 'Failed to get parties',
      details: error?.message || String(error)
    });
  }
});

export default router;

