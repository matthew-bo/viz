// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import contractsRouter from './routes/contracts';
import partiesRouter from './routes/parties';
import eventsRouter from './routes/events';
import { config } from './config';

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

// Routes
console.log('Mounting API routes...');
app.use('/api/contracts', contractsRouter);
console.log('✓ /api/contracts');

app.use('/api/parties', partiesRouter);
console.log('✓ /api/parties');

app.use('/api/events', eventsRouter);
console.log('✓ /api/events');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
console.log('✓ /health');

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

