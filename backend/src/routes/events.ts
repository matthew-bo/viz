import { Router, Request, Response } from 'express';
import { CantonTransaction } from '../types';
import { config } from '../config';

const router = Router();

// Store active SSE connections
const clients: Response[] = [];

// SSE connection limits
const MAX_SSE_CLIENTS = config.sse.maxClients;
const KEEPALIVE_INTERVAL = config.sse.keepaliveInterval;

/**
 * GET /api/events
 * Server-Sent Events (SSE) endpoint for real-time updates
 * Clients connect here to receive transaction updates
 * 
 * Connection limit enforced to prevent DoS attacks
 */
router.get('/', (req: Request, res: Response) => {
  console.log('SSE client connecting...');
  
  // Enforce connection limit (DoS prevention)
  if (clients.length >= MAX_SSE_CLIENTS) {
    console.warn(`⚠️  SSE connection limit reached (${MAX_SSE_CLIENTS})`);
    return res.status(429).json({
      error: 'Too many active SSE connections',
      maxClients: MAX_SSE_CLIENTS,
      currentClients: clients.length,
      retry: true,
      retryAfter: 30
    });
  }
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Enable CORS for SSE
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection success event
  res.write('data: {"type":"connected"}\n\n');
  
  // Add client to active connections
  clients.push(res);
  console.log(`✓ SSE client connected. Total clients: ${clients.length}/${MAX_SSE_CLIENTS}`);
  
  // Send keepalive ping to prevent timeout
  const keepaliveInterval = setInterval(() => {
    try {
      // Check if connection is still writable
      if (!res.writable) {
        clearInterval(keepaliveInterval);
        return;
      }
      res.write(': keepalive\n\n');
    } catch (error) {
      console.error('Keepalive failed:', error);
      clearInterval(keepaliveInterval);
    }
  }, KEEPALIVE_INTERVAL);
  
  // Remove client on disconnect
  req.on('close', () => {
    clearInterval(keepaliveInterval);
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log(`✗ SSE client disconnected. Total clients: ${clients.length}/${MAX_SSE_CLIENTS}`);
    }
  });
});

/**
 * Broadcast transaction to all connected SSE clients
 * Called from contracts.ts after submit/accept
 * 
 * Filters out dead/unwritable clients before broadcasting
 */
export function broadcastTransaction(transaction: CantonTransaction): void {
  const message = `data: ${JSON.stringify({
    type: 'transaction',
    data: transaction
  })}\n\n`;
  
  console.log(`📡 Broadcasting transaction ${transaction.contractId} to ${clients.length} clients`);
  
  // Filter out dead clients first (prevents errors)
  const activeClients = clients.filter(client => client.writable);
  
  // Send to all active clients
  let successCount = 0;
  let failCount = 0;
  
  activeClients.forEach((client, index) => {
    try {
      client.write(message);
      successCount++;
    } catch (error) {
      console.error(`Failed to send to client ${index}:`, error);
      failCount++;
    }
  });
  
  console.log(`✓ Broadcast complete: ${successCount} sent, ${failCount} failed`);
  
  // Remove dead clients from array
  if (failCount > 0) {
    const deadClients = clients.length - activeClients.length + failCount;
    console.log(`🗑️  Cleaning up ${deadClients} dead connections`);
  }
}

export default router;

