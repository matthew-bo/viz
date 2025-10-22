import { Router } from 'express';
import { ledgerClient } from '../canton';
import { broadcastTransaction } from './events';
import { idempotencyMiddleware, cacheIdempotentResult } from '../middleware/idempotency';
import { handleCantonError } from '../utils/error-handler';
import { validatePartyNames, validatePartyQuery } from '../utils/party-validator';
import { config } from '../config';

const router = Router();

/**
 * GET /api/contracts
 * Query transactions from Canton ledger
 * Query params:
 *   - party: Filter by party name (optional)
 *   - limit: Max number of transactions (default: 50)
 */
router.get('/', validatePartyQuery, async (req, res) => {
  try {
    const party = req.query.party as string | undefined;
    const limit = Math.min(
      parseInt(req.query.limit as string) || config.api.defaultLimit,
      config.api.maxLimit
    );
    
    console.log(`GET /api/contracts - party: ${party || 'all'}, limit: ${limit}`);
    
    // Query Canton ledger directly (no cache)
    const transactions = await ledgerClient.getTransactions(party);
    
    // Apply limit
    const limited = transactions.slice(0, limit);
    
    console.log(`✓ Returning ${limited.length} transactions`);
    res.json(limited);
  } catch (error: any) {
    handleCantonError(error, res, 'query transactions');
  }
});

/**
 * POST /api/contracts
 * Submit PaymentRequest contract (sender signs)
 * Body:
 *   - sender: Party display name (e.g., "TechBank")
 *   - receiver: Party display name
 *   - amount: Number (positive)
 *   - description: String (optional)
 *   - rwaType: String (optional, e.g., "cash", "corporate_bonds")
 *   - rwaDetails: String (optional, JSON string with RWA metadata)
 * 
 * Includes idempotency protection to prevent duplicate submissions
 */
router.post('/', validatePartyNames, idempotencyMiddleware, async (req, res) => {
  try {
    const { sender, receiver, amount, description, rwaType, rwaDetails } = req.body;
    
    console.log(`POST /api/contracts - ${sender} → ${receiver}, $${amount}${rwaType ? ` (${rwaType})` : ''}`);
    
    // Validate required fields
    if (!sender || !receiver || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['sender', 'receiver', 'amount']
      });
    }
    
    // Validate sender and receiver are different
    if (sender === receiver) {
      return res.status(400).json({ 
        error: 'Sender and receiver must be different'
      });
    }
    
    // Validate amount is positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number'
      });
    }
    
    // Submit to Canton (sender signs) with optional RWA fields
    const transaction = await ledgerClient.submitPaymentRequest(
      sender,
      receiver,
      numAmount,
      description || '',
      rwaType,
      rwaDetails
    );
    
    // Cache result for idempotency (prevents duplicate submissions)
    cacheIdempotentResult(req, transaction.contractId);
    
    // Broadcast to all SSE clients for real-time updates
    broadcastTransaction(transaction);
    
    console.log(`✓ Transaction created: ${transaction.contractId}`);
    res.status(201).json(transaction);
  } catch (error: any) {
    handleCantonError(error, res, 'submit transaction');
  }
});

/**
 * POST /api/contracts/:id/accept
 * Accept PaymentRequest (receiver signs, creates Payment)
 * URL params:
 *   - id: Contract ID
 * Body:
 *   - receiver: Party display name (must match original receiver)
 */
router.post('/:id/accept', validatePartyNames, async (req, res) => {
  try {
    const contractId = req.params.id;
    const { receiver } = req.body;
    
    console.log(`POST /api/contracts/${contractId}/accept - receiver: ${receiver}`);
    
    // Validate receiver provided
    if (!receiver) {
      return res.status(400).json({ 
        error: 'Receiver party name required'
      });
    }
    
    // Submit Accept choice to Canton (receiver signs)
    const transaction = await ledgerClient.acceptPaymentRequest(
      receiver,
      contractId
    );
    
    // Broadcast to all SSE clients for real-time updates
    broadcastTransaction(transaction);
    
    console.log(`✓ Transaction accepted: ${transaction.contractId}`);
    res.json(transaction);
  } catch (error: any) {
    handleCantonError(error, res, 'accept transaction');
  }
});

export default router;

