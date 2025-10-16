import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * In-memory cache for idempotency keys
 * In production, use Redis or similar distributed cache
 */
const idempotencyCache = new Map<string, {
  contractId: string;
  timestamp: number;
}>();

/**
 * Generate idempotency key from request
 * Combines critical fields to detect duplicate submissions
 */
function generateIdempotencyKey(req: Request): string {
  const { sender, receiver, amount, description } = req.body;
  
  // Include timestamp rounded to nearest second to catch rapid duplicates
  const timestampKey = Math.floor(Date.now() / 1000);
  
  return `${sender}-${receiver}-${amount}-${description || 'none'}-${timestampKey}`;
}

/**
 * Clean up expired cache entries
 * Runs periodically to prevent memory leaks
 */
function cleanupCache(): void {
  const now = Date.now();
  const ttl = config.idempotency.cacheTtl;
  
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > ttl) {
      idempotencyCache.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupCache, 60000);

/**
 * Idempotency middleware
 * Prevents duplicate transaction submissions by caching recent requests
 * 
 * If a duplicate request is detected within the TTL window:
 * - Returns the original transaction result (cached contractId)
 * - Sets X-Idempotent-Replayed header to indicate it's a duplicate
 * 
 * Use this middleware BEFORE the actual handler:
 * router.post('/', idempotencyMiddleware, async (req, res) => { ... })
 */
export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const idempotencyKey = generateIdempotencyKey(req);
  
  // Check if this request was recently processed
  const cached = idempotencyCache.get(idempotencyKey);
  
  if (cached) {
    console.log(`⚠️  Duplicate request detected: ${idempotencyKey}`);
    console.log(`   Returning cached contractId: ${cached.contractId}`);
    
    // Return cached response
    return res.status(200).json({
      contractId: cached.contractId,
      deduplicated: true,
      message: 'This request was already processed'
    }) as any;
  }
  
  // Store idempotency key in request for later use
  (req as any).idempotencyKey = idempotencyKey;
  
  // Continue to actual handler
  next();
}

/**
 * Cache successful transaction for idempotency
 * Call this AFTER successfully creating a transaction
 */
export function cacheIdempotentResult(
  req: Request,
  contractId: string
): void {
  const idempotencyKey = (req as any).idempotencyKey;
  
  if (idempotencyKey) {
    idempotencyCache.set(idempotencyKey, {
      contractId: contractId,
      timestamp: Date.now()
    });
    
    console.log(`✓ Cached idempotency key: ${idempotencyKey}`);
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      idempotencyCache.delete(idempotencyKey);
      console.log(`🗑️  Expired idempotency key: ${idempotencyKey}`);
    }, config.idempotency.cacheTtl);
  }
}

/**
 * Get cache stats (for debugging/monitoring)
 */
export function getIdempotencyStats() {
  return {
    cacheSize: idempotencyCache.size,
    ttl: config.idempotency.cacheTtl
  };
}

