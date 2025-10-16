/**
 * Configuration for Canton Privacy Backend
 * Centralizes all configuration values to avoid magic numbers
 */

export const config = {
  // API Configuration
  api: {
    defaultLimit: parseInt(process.env.API_DEFAULT_LIMIT || '50'),
    maxLimit: parseInt(process.env.API_MAX_LIMIT || '200')
  },

  // JWT Configuration
  jwt: {
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
    secret: (process.env.JWT_SECRET || 'demo-secret-key') as string
  },

  // Server-Sent Events Configuration
  sse: {
    keepaliveInterval: parseInt(process.env.SSE_KEEPALIVE_MS || '30000'), // 30 seconds
    maxClients: parseInt(process.env.SSE_MAX_CLIENTS || '100') // Max concurrent SSE connections
  },

  // Canton Configuration
  canton: {
    ledgerId: process.env.CANTON_LEDGER_ID || 'participant1'
  },

  // Idempotency Configuration
  idempotency: {
    cacheTtl: parseInt(process.env.IDEMPOTENCY_CACHE_TTL_MS || '300000') // 5 minutes
  },

  // Security Configuration
  security: {
    requestSizeLimit: process.env.REQUEST_SIZE_LIMIT || '1mb',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  }
};

