// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables before starting
const requiredEnvVars = [
  'TECHBANK_PARTY_ID',
  'GLOBALCORP_PARTY_ID',
  'RETAILFINANCE_PARTY_ID',
  'PARTICIPANT1_LEDGER_API',
  'PARTICIPANT2_LEDGER_API',
  'PARTICIPANT3_LEDGER_API'
];

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Copy backend/env.template to backend/.env and configure it.');
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import contractsRouter from './routes/contracts';
import partiesRouter from './routes/parties';
import eventsRouter from './routes/events';
import adminRouter from './routes/admin';
import exchangesRouter from './routes/exchanges';
import atomicExchangesRouter from './routes/atomicExchanges';
import inventoryRouter from './routes/inventory';
import assetsRouter from './routes/assets';
import { config } from './config';
import { ledgerClient } from './canton';
import { seedAssets } from './scripts/seedAssets';
import { initializeTokenizedAssetsIfNeeded } from './services/tokenizedAssetInitializer';
import inventoryService from './services/inventoryService';
import exchangeService from './services/exchangeService';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: config.security.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: config.security.requestSizeLimit }));

// Initialize assets (in-memory)
const parties = ledgerClient.getAllParties().map(p => ({
  partyId: p.partyId,
  displayName: p.displayName
}));
seedAssets(parties);

// Try to tokenize assets on Canton (async, non-blocking)
initializeTokenizedAssetsIfNeeded().then(result => {
  if (result) {
    if (result.success) {
      console.log(`✓ Tokenized assets on Canton: ${result.cashHoldings} cash, ${result.realEstateTokens} RE, ${result.privateEquityTokens} PE`);
    } else {
      console.log(`⚠ Partial tokenization: ${result.errors.length} errors`);
    }
  }
}).catch(() => {
  // Canton not available - using in-memory assets only
});

// Routes
app.use('/api/contracts', contractsRouter);
app.use('/api/parties', partiesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/exchanges', exchangesRouter);
app.use('/api/atomic', atomicExchangesRouter);  // Tokenized atomic exchanges
app.use('/api/inventory', inventoryRouter);
app.use('/api/assets', assetsRouter);

// Enhanced health check endpoint - checks all critical services
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'down',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: { status: 'healthy' as 'healthy' | 'down', message: 'API server running' },
      canton: { status: 'unknown' as 'healthy' | 'degraded' | 'down' | 'unknown', message: 'Not checked' },
      inventory: { status: 'unknown' as 'healthy' | 'down' | 'unknown', message: 'Not checked' },
      exchanges: { status: 'unknown' as 'healthy' | 'down' | 'unknown', message: 'Not checked' },
    }
  };

  // Check Canton ledger connectivity
  try {
    const parties = await ledgerClient.getAllParties();
    if (parties && parties.length > 0) {
      health.services.canton = { status: 'healthy', message: `${parties.length} participants active` };
    } else {
      health.services.canton = { status: 'degraded', message: 'No participants found' };
      health.status = 'degraded';
    }
  } catch (error: any) {
    health.services.canton = { status: 'down', message: error.message || 'Canton unreachable' };
    health.status = 'degraded'; // Don't mark as 'down' if only Canton is unavailable
  }

  // Check inventory service
  try {
    const inventories = await inventoryService.getAllInventories();
    health.services.inventory = { 
      status: 'healthy', 
      message: `${inventories.length} inventories tracked` 
    };
  } catch (error: any) {
    health.services.inventory = { status: 'down', message: 'Inventory service error' };
    health.status = 'degraded';
  }

  // Check exchange service
  try {
    const exchanges = await exchangeService.getAllExchanges();
    health.services.exchanges = { 
      status: 'healthy', 
      message: `${exchanges.length} active exchanges` 
    };
  } catch (error: any) {
    health.services.exchanges = { status: 'down', message: 'Exchange service error' };
    health.status = 'degraded';
  }

  // Return appropriate HTTP status code
  const httpStatus = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  res.status(httpStatus).json(health);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

