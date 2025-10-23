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
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('  ❌ CONFIGURATION ERROR: Missing Environment Variables');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('');
  console.error('The following required environment variables are not set:');
  console.error('');
  missingEnvVars.forEach(key => {
    console.error(`  - ${key}`);
  });
  console.error('');
  console.error('Please ensure your .env file is properly configured:');
  console.error('  1. Check if backend/.env exists');
  console.error('  2. Copy from backend/env.template if needed');
  console.error('  3. Fill in the real Canton party IDs from:');
  console.error('     infrastructure/canton/party-ids.json');
  console.error('');
  console.error('Run this command to initialize Canton and get party IDs:');
  console.error('  .\\infrastructure\\init-canton-final.ps1');
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('');
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import contractsRouter from './routes/contracts';
import partiesRouter from './routes/parties';
import eventsRouter from './routes/events';
import adminRouter from './routes/admin';
import exchangesRouter from './routes/exchanges';
import inventoryRouter from './routes/inventory';
import assetsRouter from './routes/assets';
import { config } from './config';
import { ledgerClient } from './canton';
import { seedAssets } from './scripts/seedAssets';
import inventoryService from './services/inventoryService';
import exchangeService from './services/exchangeService';

const app = express();
const PORT = process.env.PORT || 3001;

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Canton Privacy Blockchain Visualizer - Backend Server');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// CORS configuration
const corsOptions = {
  origin: config.security.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: config.security.requestSizeLimit }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Seed assets on startup
console.log('Initializing asset registry...');
const parties = ledgerClient.getAllParties().map(p => ({
  partyId: p.partyId,
  displayName: p.displayName
}));
seedAssets(parties);

// Routes
console.log('Mounting API routes...');
app.use('/api/contracts', contractsRouter);
console.log('✓ /api/contracts');

app.use('/api/parties', partiesRouter);
console.log('✓ /api/parties');

app.use('/api/events', eventsRouter);
console.log('✓ /api/events');

app.use('/api/admin', adminRouter);
console.log('✓ /api/admin');

app.use('/api/exchanges', exchangesRouter);
console.log('✓ /api/exchanges');

app.use('/api/inventory', inventoryRouter);
console.log('✓ /api/inventory');

app.use('/api/assets', assetsRouter);
console.log('✓ /api/assets');

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
console.log('✓ /health (enhanced with service checks)');

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
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✓ Backend server running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API endpoints: http://localhost:${PORT}/api`);
  console.log(`✓ SSE endpoint: http://localhost:${PORT}/api/events`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Environment:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  PORT: ${PORT}`);
  console.log(`  Participant1: ${process.env.PARTICIPANT1_LEDGER_API}`);
  console.log(`  Participant2: ${process.env.PARTICIPANT2_LEDGER_API}`);
  console.log(`  Participant3: ${process.env.PARTICIPANT3_LEDGER_API}`);
  console.log('');
  console.log('Ready to accept requests!');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

