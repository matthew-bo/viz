/**
 * Integration Test: Full Payment Workflow
 * Tests complete transaction lifecycle from submission to acceptance
 * 
 * Prerequisites:
 * - Canton infrastructure running (docker-compose up)
 * - Backend server must be running
 * - Real party IDs configured in .env
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT = 15000;

// Helper to make API calls with timeout
async function apiCall(endpoint: string, options: any = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

describe('Full Payment Workflow Integration', () => {
  // Increase timeout for Canton operations
  jest.setTimeout(30000);

  let submittedContractId: string;

  beforeAll(async () => {
    // Verify backend is healthy
    const health = await apiCall('/health');
    expect(health.ok).toBe(true);
  });

  describe('Phase 1: Submit Payment Request', () => {
    it('should submit payment request from TechBank to GlobalCorp', async () => {
      const response = await apiCall('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'TechBank',
          receiver: 'GlobalCorp',
          amount: 2500,
          description: 'Integration test payment - Full workflow'
        })
      });

      expect(response.status).toBe(201);
      
      const transaction = await response.json();
      
      expect(transaction.contractId).toBeDefined();
      expect(transaction.status).toBe('pending');
      expect(transaction.senderDisplayName).toBe('TechBank');
      expect(transaction.receiverDisplayName).toBe('GlobalCorp');
      expect(transaction.payload.amount).toBe('2500');
      
      submittedContractId = transaction.contractId;
      console.log(`✓ Payment request submitted: ${submittedContractId}`);
    });

    it('should prevent duplicate submission with idempotency key', async () => {
      const idempotencyKey = `test-${Date.now()}-${Math.random()}`;
      
      // First request
      const response1 = await apiCall('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          sender: 'GlobalCorp',
          receiver: 'RetailFinance',
          amount: 100,
          description: 'Idempotency test'
        })
      });

      expect(response1.status).toBe(201);
      const tx1 = await response1.json();

      // Duplicate request with same key
      const response2 = await apiCall('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          sender: 'GlobalCorp',
          receiver: 'RetailFinance',
          amount: 999, // Different amount, should be ignored
          description: 'Duplicate request'
        })
      });

      expect(response2.status).toBe(200);
      const tx2 = await response2.json();
      
      // Should return same contract ID
      expect(tx2.contractId).toBe(tx1.contractId);
      expect(tx2.payload.amount).toBe('100'); // Original amount, not 999
      
      console.log('✓ Idempotency protection working');
    });
  });

  describe('Phase 2: Query Transactions', () => {
    it('should query all transactions', async () => {
      const response = await apiCall('/api/contracts?limit=50');
      
      expect(response.ok).toBe(true);
      
      const transactions = await response.json();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      
      console.log(`✓ Retrieved ${transactions.length} transactions`);
    });

    it('should query transactions by party (TechBank)', async () => {
      const response = await apiCall('/api/contracts?party=TechBank');
      
      expect(response.ok).toBe(true);
      
      const transactions = await response.json();
      
      // All transactions should involve TechBank
      transactions.forEach((tx: any) => {
        const involvesTechBank = 
          tx.senderDisplayName === 'TechBank' || 
          tx.receiverDisplayName === 'TechBank';
        expect(involvesTechBank).toBe(true);
      });
      
      console.log(`✓ TechBank sees ${transactions.length} transactions`);
    });

    it('should find our submitted transaction', async () => {
      const response = await apiCall('/api/contracts?party=TechBank');
      const transactions = await response.json();
      
      const foundTx = transactions.find((tx: any) => tx.contractId === submittedContractId);
      
      expect(foundTx).toBeDefined();
      expect(foundTx.status).toBe('pending');
      
      console.log('✓ Submitted transaction found in query');
    });
  });

  describe('Phase 3: Privacy Filtering', () => {
    it('should enforce privacy - RetailFinance cannot see TechBank→GlobalCorp', async () => {
      const response = await apiCall('/api/contracts?party=RetailFinance');
      const transactions = await response.json();
      
      // RetailFinance should NOT see our test transaction
      const foundTx = transactions.find((tx: any) => tx.contractId === submittedContractId);
      
      expect(foundTx).toBeUndefined();
      
      console.log('✓ Privacy enforced: RetailFinance cannot see TechBank→GlobalCorp transaction');
    });

    it('should allow receiver (GlobalCorp) to see transaction', async () => {
      const response = await apiCall('/api/contracts?party=GlobalCorp');
      const transactions = await response.json();
      
      const foundTx = transactions.find((tx: any) => tx.contractId === submittedContractId);
      
      expect(foundTx).toBeDefined();
      expect(foundTx.status).toBe('pending');
      
      console.log('✓ Receiver (GlobalCorp) can see pending transaction');
    });
  });

  describe('Phase 4: Accept Payment', () => {
    it('should accept payment request as GlobalCorp', async () => {
      const response = await apiCall(`/api/contracts/${submittedContractId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'GlobalCorp'
        })
      });

      expect(response.ok).toBe(true);
      
      const payment = await response.json();
      
      expect(payment.status).toBe('committed');
      expect(payment.payload.committedAt).toBeDefined();
      
      // Both parties should be signatories
      expect(payment.signatories).toContain(payment.payload.sender);
      expect(payment.signatories).toContain(payment.payload.receiver);
      
      console.log(`✓ Payment accepted and committed: ${payment.contractId}`);
    });

    it('should not allow double-acceptance', async () => {
      // Try to accept already committed transaction
      const response = await apiCall(`/api/contracts/${submittedContractId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'GlobalCorp'
        })
      });

      // Should return error (contract no longer active)
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      
      console.log('✓ Double-acceptance prevented');
    });
  });

  describe('Phase 5: Verify Final State', () => {
    it('should show committed transaction in queries', async () => {
      const response = await apiCall('/api/contracts?party=TechBank');
      const transactions = await response.json();
      
      // Look for committed payment (not the pending request)
      const committed = transactions.find((tx: any) => 
        tx.status === 'committed' && 
        tx.senderDisplayName === 'TechBank' &&
        tx.receiverDisplayName === 'GlobalCorp' &&
        tx.payload.amount === '2500'
      );
      
      expect(committed).toBeDefined();
      expect(committed.payload.committedAt).toBeDefined();
      
      console.log('✓ Committed transaction visible in final state');
    });

    it('should maintain privacy for committed transactions', async () => {
      const response = await apiCall('/api/contracts?party=RetailFinance');
      const transactions = await response.json();
      
      // RetailFinance should still NOT see this committed transaction
      const found = transactions.find((tx: any) =>
        tx.senderDisplayName === 'TechBank' &&
        tx.receiverDisplayName === 'GlobalCorp' &&
        tx.payload.amount === '2500' &&
        tx.status === 'committed'
      );
      
      expect(found).toBeUndefined();
      
      console.log('✓ Privacy maintained for committed transactions');
    });
  });

  describe('Phase 6: Validation & Error Handling', () => {
    it('should reject invalid party names', async () => {
      const response = await apiCall('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'InvalidBank',
          receiver: 'GlobalCorp',
          amount: 100,
          description: 'Should fail'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('Invalid');
    });

    it('should reject negative amounts', async () => {
      const response = await apiCall('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'TechBank',
          receiver: 'GlobalCorp',
          amount: -100,
          description: 'Negative amount'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should reject sender === receiver', async () => {
      const response = await apiCall('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'TechBank',
          receiver: 'TechBank',
          amount: 100,
          description: 'Self-send'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle non-existent contract ID', async () => {
      const response = await apiCall('/api/contracts/non-existent-id/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'GlobalCorp'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('Phase 7: Metrics & Health', () => {
    it('should retrieve system metrics', async () => {
      const response = await apiCall('/api/admin/metrics');
      
      expect(response.ok).toBe(true);
      
      const metrics = await response.json();
      
      expect(metrics.total).toBeDefined();
      expect(metrics.total.transactions).toBeGreaterThan(0);
      expect(metrics.byParty).toBeDefined();
      expect(metrics.byStatus).toBeDefined();
      
      console.log(`✓ System metrics: ${metrics.total.transactions} total transactions`);
    });

    it('should perform health check', async () => {
      const response = await apiCall('/health');
      
      expect(response.ok).toBe(true);
      
      const health = await response.json();
      
      expect(health.status).toBe('healthy');
      expect(health.services.canton.status).toBe('healthy');
      
      console.log('✓ System health check passed');
    });
  });
});

