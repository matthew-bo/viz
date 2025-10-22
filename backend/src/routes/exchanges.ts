/**
 * Exchanges API Routes
 * Handles asset exchange proposals and acceptances
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

    // Validate input
    if (!fromParty || !toParty || !offering || !requesting) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get party display names
    const fromInventory = inventoryService.getInventory(fromParty);
    const toInventory = inventoryService.getInventory(toParty);

    if (!fromInventory || !toInventory) {
      return res.status(404).json({ error: 'Party not found' });
    }

    // Enrich offering with asset details if needed
    if (offering.type !== 'cash' && offering.assetId) {
      const asset = assetService.getAsset(offering.assetId);
      if (asset) {
        offering.assetName = asset.name;
        offering.assetValue = asset.type === 'real_estate' ? asset.value : asset.valuation;
      }
    }

    // Enrich requesting with asset details if needed
    if (requesting.type !== 'cash' && requesting.assetId) {
      const asset = assetService.getAsset(requesting.assetId);
      if (asset) {
        requesting.assetName = asset.name;
        requesting.assetValue = asset.type === 'real_estate' ? asset.value : asset.valuation;
      }
    }

    const exchange = exchangeService.createExchange(
      fromParty,
      fromInventory.displayName,
      toParty,
      toInventory.displayName,
      offering,
      requesting,
      description
    );

    if (!exchange) {
      return res.status(400).json({ error: 'Failed to create exchange - validation failed' });
    }

    // Broadcast SSE event
    broadcast({
      type: 'exchange',
      data: exchange
    });

    console.log(`✓ Exchange created: ${exchange.id}`);
    res.status(201).json(exchange);
  } catch (error: any) {
    console.error('Failed to create exchange:', error);
    res.status(500).json({ 
      error: 'Failed to create exchange',
      details: error?.message || String(error)
    });
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

    // Broadcast SSE event
    broadcast({
      type: 'exchange',
      data: exchange
    });

    // Also broadcast inventory updates
    const fromInventory = inventoryService.getInventorySnapshot(exchange!.fromParty);
    const toInventory = inventoryService.getInventorySnapshot(exchange!.toParty);

    broadcast({
      type: 'inventory_update',
      data: {
        parties: [fromInventory, toInventory]
      }
    });

    console.log(`✓ Exchange accepted: ${id}`);
    res.json(exchange);
  } catch (error: any) {
    console.error('Failed to accept exchange:', error);
    res.status(500).json({ 
      error: 'Failed to accept exchange',
      details: error?.message || String(error)
    });
  }
});

/**
 * GET /api/exchanges
 * Get all exchanges (optionally filtered by party)
 */
router.get('/', async (req, res) => {
  try {
    const { party } = req.query;

    let exchanges;
    if (party) {
      exchanges = exchangeService.getExchangesByParty(party as string);
    } else {
      exchanges = exchangeService.getAllExchanges();
    }

    res.json(exchanges);
  } catch (error: any) {
    console.error('Failed to get exchanges:', error);
    res.status(500).json({ 
      error: 'Failed to get exchanges',
      details: error?.message || String(error)
    });
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
  } catch (error: any) {
    console.error('Failed to get exchange:', error);
    res.status(500).json({ 
      error: 'Failed to get exchange',
      details: error?.message || String(error)
    });
  }
});

export default router;

