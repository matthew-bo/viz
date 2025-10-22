import { Transaction, Party, ExchangeProposal, ExchangeOffer, PartyInventory, Asset } from '../types';
import { fetchWithTimeout, getErrorMessage } from '../utils/fetchWithTimeout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT = 15000; // 15 seconds default timeout

/**
 * Helper to log API calls to Activity Log
 */
const logApiCall = (method: string, endpoint: string, success: boolean, details?: any) => {
  if (typeof window !== 'undefined' && (window as any).addActivityLog) {
    (window as any).addActivityLog({
      level: success ? 'success' : 'error',
      category: 'api',
      message: `${method} ${endpoint} - ${success ? 'Success' : 'Failed'}`,
      details,
    });
  }
};

/**
 * API Client for Canton Privacy Backend
 * All methods return promises and throw on error
 */
export const apiClient = {
  /**
   * Get transactions (optionally filtered by party)
   */
  async getTransactions(params?: { party?: string; limit?: number }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params?.party) query.append('party', params.party);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const url = `${API_BASE}/api/contracts${query.toString() ? `?${query}` : ''}`;
    
    try {
      const response = await fetchWithTimeout(url, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch transactions' }));
        logApiCall('GET', '/api/contracts', false, { params, error: error.error });
        throw new Error(error.error || 'Failed to fetch transactions');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/contracts', true, { params, count: data.length });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get transactions');
      logApiCall('GET', '/api/contracts', false, { params, error: message });
      throw new Error(message);
    }
  },
  
  /**
   * Submit new PaymentRequest (with optional RWA fields)
   */
  async submitContract(data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
    rwaType?: string;
    rwaDetails?: string;
  }): Promise<Transaction> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to submit transaction' }));
        logApiCall('POST', '/api/contracts', false, { data, error: error.error });
        throw new Error(error.error || 'Failed to submit transaction');
      }
      
      const result = await response.json();
      logApiCall('POST', '/api/contracts', true, { 
        sender: data.sender, 
        receiver: data.receiver, 
        amount: data.amount,
        rwaType: data.rwaType,
        contractId: result.contractId 
      });
      return result;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Submit transaction');
      logApiCall('POST', '/api/contracts', false, { data, error: message });
      throw new Error(message);
    }
  },
  
  /**
   * Accept pending PaymentRequest
   */
  async acceptContract(contractId: string, receiver: string): Promise<Transaction> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/contracts/${contractId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver })
      }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to accept transaction' }));
        logApiCall('POST', `/api/contracts/${contractId}/accept`, false, { receiver, error: error.error });
        throw new Error(error.error || 'Failed to accept transaction');
      }
      
      const result = await response.json();
      logApiCall('POST', `/api/contracts/${contractId}/accept`, true, { contractId, receiver });
      return result;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Accept transaction');
      logApiCall('POST', `/api/contracts/${contractId}/accept`, false, { receiver, error: message });
      throw new Error(message);
    }
  },
  
  /**
   * Get all parties
   */
  async getParties(): Promise<Party[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/parties`, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch parties' }));
        logApiCall('GET', '/api/parties', false, { error: error.error });
        throw new Error(error.error || 'Failed to fetch parties');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/parties', true, { count: data.length, parties: data.map((p: Party) => p.displayName) });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get parties');
      logApiCall('GET', '/api/parties', false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Health check - verify backend is operational
   * Now includes detailed service status for Canton, Inventory, and Exchanges
   */
  async healthCheck(): Promise<{ 
    status: 'healthy' | 'degraded' | 'down';
    timestamp: string;
    version: string;
    services: {
      api: { status: string; message: string };
      canton: { status: string; message: string };
      inventory: { status: string; message: string };
      exchanges: { status: string; message: string };
    }
  }> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, 10000); // Shorter timeout for health checks
      
      if (!response.ok) {
        logApiCall('GET', '/health', false, { statusCode: response.status });
        throw new Error('Backend health check failed');
      }
      
      const data = await response.json();
      // Don't log every health check to avoid spam, only failures
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Health check');
      logApiCall('GET', '/health', false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Seed demo data - generate realistic transactions for testing
   */
  async seedDemoData(count: number = 60): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/admin/seed-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      }, 30000); // Longer timeout for bulk operations
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to seed demo data' }));
        logApiCall('POST', '/api/admin/seed-demo', false, { count, error: error.error });
        throw new Error(error.error || 'Failed to seed demo data');
      }
      
      const data = await response.json();
      logApiCall('POST', '/api/admin/seed-demo', true, { count: data.count });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Seed demo data');
      logApiCall('POST', '/api/admin/seed-demo', false, { count, error: message });
      throw new Error(message);
    }
  },

  /**
   * Get aggregated metrics
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/admin/metrics`, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch metrics' }));
        logApiCall('GET', '/api/admin/metrics', false, { error: error.error });
        throw new Error(error.error || 'Failed to fetch metrics');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/admin/metrics', true, { total: data.total });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get metrics');
      logApiCall('GET', '/api/admin/metrics', false, { error: message });
      throw new Error(message);
    }
  },

  // ========================================
  // EXCHANGE SYSTEM API METHODS
  // ========================================

  /**
   * Get inventory for a party
   */
  async getInventory(partyId: string): Promise<PartyInventory> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/inventory/${partyId}`, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch inventory' }));
        throw new Error(error.error || 'Failed to fetch inventory');
      }
      
      const data = await response.json();
      logApiCall('GET', `/api/inventory/${partyId}`, true, { displayName: data.displayName });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get inventory');
      logApiCall('GET', `/api/inventory/${partyId}`, false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Get all inventories
   */
  async getAllInventories(): Promise<PartyInventory[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/inventory`, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch inventories' }));
        throw new Error(error.error || 'Failed to fetch inventories');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/inventory', true, { count: data.length });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get inventories');
      logApiCall('GET', '/api/inventory', false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Create exchange proposal
   */
  async createExchange(data: {
    fromParty: string;
    toParty: string;
    offering: ExchangeOffer;
    requesting: ExchangeOffer;
    description?: string;
  }): Promise<ExchangeProposal> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/exchanges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create exchange' }));
        logApiCall('POST', '/api/exchanges', false, { error: error.error });
        throw new Error(error.error || 'Failed to create exchange');
      }
      
      const result = await response.json();
      logApiCall('POST', '/api/exchanges', true, { exchangeId: result.id });
      return result;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Create exchange');
      logApiCall('POST', '/api/exchanges', false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Accept exchange
   */
  async acceptExchange(exchangeId: string, acceptingParty: string): Promise<ExchangeProposal> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/exchanges/${exchangeId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingParty })
      }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to accept exchange' }));
        logApiCall('POST', `/api/exchanges/${exchangeId}/accept`, false, { error: error.error });
        throw new Error(error.error || 'Failed to accept exchange');
      }
      
      const result = await response.json();
      logApiCall('POST', `/api/exchanges/${exchangeId}/accept`, true, { exchangeId });
      return result;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Accept exchange');
      logApiCall('POST', `/api/exchanges/${exchangeId}/accept`, false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Get all exchanges
   */
  async getExchanges(partyId?: string): Promise<ExchangeProposal[]> {
    try {
      const url = partyId 
        ? `${API_BASE}/api/exchanges?party=${partyId}`
        : `${API_BASE}/api/exchanges`;
      
      const response = await fetchWithTimeout(url, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch exchanges' }));
        throw new Error(error.error || 'Failed to fetch exchanges');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/exchanges', true, { count: data.length });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get exchanges');
      logApiCall('GET', '/api/exchanges', false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Get asset by ID
   */
  async getAsset(assetId: string): Promise<Asset> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/assets/${assetId}`, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch asset' }));
        throw new Error(error.error || 'Failed to fetch asset');
      }
      
      const data = await response.json();
      logApiCall('GET', `/api/assets/${assetId}`, true, { assetName: data.name });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get asset');
      logApiCall('GET', `/api/assets/${assetId}`, false, { error: message });
      throw new Error(message);
    }
  },

  /**
   * Get asset history
   */
  async getAssetHistory(assetId: string): Promise<any[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/assets/${assetId}/history`, { method: 'GET' }, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch asset history' }));
        throw new Error(error.error || 'Failed to fetch asset history');
      }
      
      const data = await response.json();
      logApiCall('GET', `/api/assets/${assetId}/history`, true, { historyCount: data.length });
      return data;
    } catch (err) {
      const message = getErrorMessage(err instanceof Error ? err : new Error('Unknown error'), 'Get asset history');
      logApiCall('GET', `/api/assets/${assetId}/history`, false, { error: message });
      throw new Error(message);
    }
  }
};

