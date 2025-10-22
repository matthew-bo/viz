import { Transaction, Party } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch transactions' }));
        logApiCall('GET', '/api/contracts', false, { params, error: error.error });
        throw new Error(error.error || 'Failed to fetch transactions');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/contracts', true, { params, count: data.length });
      return data;
    } catch (err) {
      logApiCall('GET', '/api/contracts', false, { params, error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
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
      const response = await fetch(`${API_BASE}/api/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
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
      logApiCall('POST', '/api/contracts', false, { data, error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },
  
  /**
   * Accept pending PaymentRequest
   */
  async acceptContract(contractId: string, receiver: string): Promise<Transaction> {
    try {
      const response = await fetch(`${API_BASE}/api/contracts/${contractId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to accept transaction' }));
        logApiCall('POST', `/api/contracts/${contractId}/accept`, false, { receiver, error: error.error });
        throw new Error(error.error || 'Failed to accept transaction');
      }
      
      const result = await response.json();
      logApiCall('POST', `/api/contracts/${contractId}/accept`, true, { contractId, receiver });
      return result;
    } catch (err) {
      logApiCall('POST', `/api/contracts/${contractId}/accept`, false, { receiver, error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },
  
  /**
   * Get all parties
   */
  async getParties(): Promise<Party[]> {
    try {
      const response = await fetch(`${API_BASE}/api/parties`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch parties' }));
        logApiCall('GET', '/api/parties', false, { error: error.error });
        throw new Error(error.error || 'Failed to fetch parties');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/parties', true, { count: data.length, parties: data.map((p: Party) => p.displayName) });
      return data;
    } catch (err) {
      logApiCall('GET', '/api/parties', false, { error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },

  /**
   * Health check - verify backend is operational
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        logApiCall('GET', '/health', false, { statusCode: response.status });
        throw new Error('Backend health check failed');
      }
      
      const data = await response.json();
      // Don't log every health check to avoid spam, only failures
      return data;
    } catch (err) {
      logApiCall('GET', '/health', false, { error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },

  /**
   * Seed demo data - generate realistic transactions for testing
   */
  async seedDemoData(count: number = 60): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/seed-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to seed demo data' }));
        logApiCall('POST', '/api/admin/seed-demo', false, { count, error: error.error });
        throw new Error(error.error || 'Failed to seed demo data');
      }
      
      const data = await response.json();
      logApiCall('POST', '/api/admin/seed-demo', true, { count: data.count });
      return data;
    } catch (err) {
      logApiCall('POST', '/api/admin/seed-demo', false, { count, error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  },

  /**
   * Get aggregated metrics
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/metrics`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch metrics' }));
        logApiCall('GET', '/api/admin/metrics', false, { error: error.error });
        throw new Error(error.error || 'Failed to fetch metrics');
      }
      
      const data = await response.json();
      logApiCall('GET', '/api/admin/metrics', true, { total: data.total });
      return data;
    } catch (err) {
      logApiCall('GET', '/api/admin/metrics', false, { error: err instanceof Error ? err.message : 'Unknown error' });
      throw err;
    }
  }
};

