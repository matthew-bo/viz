import { CantonLedgerClient } from './ledger-client';

/**
 * Singleton instance of Canton Ledger Client
 * Shared across all route handlers to avoid duplicate connections
 */
export const ledgerClient = new CantonLedgerClient();

export { CantonLedgerClient };

