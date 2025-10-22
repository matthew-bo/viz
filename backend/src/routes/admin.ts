import { Router } from 'express';
import { generateDemoTransactions } from '../utils/demo-data-generator';
import { ledgerClient } from '../canton';

const router = Router();

/**
 * POST /api/admin/seed-demo
 * Generate demo transactions for testing and visualization
 * Body (optional):
 *   - count: Number of transactions to generate (default: 60, max: 100)
 */
router.post('/seed-demo', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.body.count) || 60, 100);
    
    console.log(`POST /api/admin/seed-demo - generating ${count} transactions`);
    
    // Generate demo data (async operation)
    await generateDemoTransactions(count);
    
    res.json({ 
      success: true, 
      message: `Successfully generated ${count} demo transactions`,
      count 
    });
  } catch (error: any) {
    console.error('Failed to generate demo data:', error);
    res.status(500).json({ 
      error: 'Failed to generate demo data',
      message: error?.message || String(error)
    });
  }
});

/**
 * GET /api/admin/metrics
 * Get aggregated metrics across all transactions
 * Returns business metrics useful for the dashboard
 */
router.get('/metrics', async (req, res) => {
  try {
    console.log('GET /api/admin/metrics');
    
    // Fetch all transactions from Canton
    const transactions = await ledgerClient.getTransactions();
    
    // Calculate metrics
    const metrics = {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'pending').length,
      committed: transactions.filter(t => t.status === 'committed').length,
      
      totalVolume: transactions
        .filter(t => t.status === 'committed')
        .reduce((sum, t) => sum + parseFloat(t.payload.amount || '0'), 0),
      
      byRWAType: {} as Record<string, { count: number; volume: number }>,
      
      byParty: {} as Record<string, { sent: number; received: number; volume: number }>
    };
    
    // Aggregate by RWA type
    transactions.forEach(tx => {
      const rwaType = tx.payload.rwaType || 'unknown';
      if (!metrics.byRWAType[rwaType]) {
        metrics.byRWAType[rwaType] = { count: 0, volume: 0 };
      }
      metrics.byRWAType[rwaType].count++;
      if (tx.status === 'committed') {
        metrics.byRWAType[rwaType].volume += parseFloat(tx.payload.amount || '0');
      }
    });
    
    // Aggregate by party
    transactions.forEach(tx => {
      const sender = tx.senderDisplayName;
      const receiver = tx.receiverDisplayName;
      const amount = parseFloat(tx.payload.amount || '0');
      
      if (!metrics.byParty[sender]) {
        metrics.byParty[sender] = { sent: 0, received: 0, volume: 0 };
      }
      if (!metrics.byParty[receiver]) {
        metrics.byParty[receiver] = { sent: 0, received: 0, volume: 0 };
      }
      
      metrics.byParty[sender].sent++;
      metrics.byParty[receiver].received++;
      
      if (tx.status === 'committed') {
        metrics.byParty[sender].volume += amount;
        metrics.byParty[receiver].volume += amount;
      }
    });
    
    res.json(metrics);
  } catch (error: any) {
    console.error('Failed to calculate metrics:', error);
    res.status(500).json({ 
      error: 'Failed to calculate metrics',
      message: error?.message || String(error)
    });
  }
});

export default router;

