/**
 * Unit Tests: Zustand App Store
 * Tests state management, transaction handling, and filtering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../store/useAppStore';
import type { Transaction } from '../../types';

describe('useAppStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useAppStore.setState({
      transactions: [],
      parties: [],
      selectedBusiness: null,
      selectedRWA: null,
      activeView: 'grid',
      selectedTransaction: null,
      selectedAsset: null,
      connectionStatus: 'connecting',
    });
  });

  const mockTransaction: Transaction = {
    contractId: 'test-contract-123',
    templateId: 'Payment.PaymentRequest',
    senderDisplayName: 'TechBank',
    receiverDisplayName: 'GlobalCorp',
    payload: {
      sender: 'TechBank::1220abc',
      receiver: 'GlobalCorp::1220def',
      amount: '1000.00',
      description: 'Test Payment',
      rwaType: 'real_estate'
    },
    status: 'pending',
    recordTime: '2024-01-15T10:30:00Z',
  };

  const mockCommittedTransaction: Transaction = {
    ...mockTransaction,
    contractId: 'test-contract-456',
    status: 'committed',
    templateId: 'Payment.Payment',
  };

  describe('Transaction Management', () => {
    it('should add a transaction', () => {
      useAppStore.getState().addTransaction(mockTransaction);
      
      const transactions = useAppStore.getState().transactions;
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual(mockTransaction);
    });

    it('should add new transaction at the beginning', () => {
      const tx1 = { ...mockTransaction, contractId: 'tx1' };
      const tx2 = { ...mockTransaction, contractId: 'tx2' };
      
      useAppStore.getState().addTransaction(tx1);
      useAppStore.getState().addTransaction(tx2);
      
      const transactions = useAppStore.getState().transactions;
      expect(transactions[0].contractId).toBe('tx2');
      expect(transactions[1].contractId).toBe('tx1');
    });

    it('should update an existing transaction', () => {
      useAppStore.getState().addTransaction(mockTransaction);
      
      const updated = { ...mockTransaction, status: 'committed' as const };
      useAppStore.getState().updateTransaction(mockTransaction.contractId, updated);
      
      const transactions = useAppStore.getState().transactions;
      expect(transactions[0].status).toBe('committed');
    });

    it('should remove a transaction', () => {
      useAppStore.getState().addTransaction(mockTransaction);
      expect(useAppStore.getState().transactions).toHaveLength(1);
      
      useAppStore.getState().removeTransaction(mockTransaction.contractId);
      expect(useAppStore.getState().transactions).toHaveLength(0);
    });

    it('should replace multiple transactions with setTransactions', () => {
      const txs = [
        { ...mockTransaction, contractId: 'tx1' },
        { ...mockTransaction, contractId: 'tx2' },
        { ...mockTransaction, contractId: 'tx3' },
      ];
      
      useAppStore.getState().setTransactions(txs);
      expect(useAppStore.getState().transactions).toHaveLength(3);
    });
  });

  describe('addOrUpdateTransaction', () => {
    it('should add new transaction if not exists', () => {
      useAppStore.getState().addOrUpdateTransaction(mockTransaction);
      
      const transactions = useAppStore.getState().transactions;
      expect(transactions).toHaveLength(1);
      expect(transactions[0].contractId).toBe('test-contract-123');
    });

    it('should update existing transaction by contractId', () => {
      useAppStore.getState().addTransaction(mockTransaction);
      
      const updated = { ...mockTransaction, payload: { ...mockTransaction.payload, amount: '2000.00' } };
      useAppStore.getState().addOrUpdateTransaction(updated);
      
      const transactions = useAppStore.getState().transactions;
      expect(transactions).toHaveLength(1);
      expect(transactions[0].payload.amount).toBe('2000.00');
    });

    it('should replace pending request with committed payment', () => {
      // Add pending request
      useAppStore.getState().addTransaction(mockTransaction);
      expect(useAppStore.getState().transactions).toHaveLength(1);
      
      // Add committed payment with matching details
      useAppStore.getState().addOrUpdateTransaction(mockCommittedTransaction);
      
      const transactions = useAppStore.getState().transactions;
      // Should have 1 transaction (committed replaces pending)
      expect(transactions).toHaveLength(1);
      expect(transactions[0].status).toBe('committed');
      expect(transactions[0].contractId).toBe('test-contract-456');
    });

    it('should not replace pending if details do not match', () => {
      useAppStore.getState().addTransaction(mockTransaction);
      
      const differentCommitted = {
        ...mockCommittedTransaction,
        payload: { ...mockCommittedTransaction.payload, amount: '5000.00' } // Different amount
      };
      
      useAppStore.getState().addOrUpdateTransaction(differentCommitted);
      
      const transactions = useAppStore.getState().transactions;
      // Should have both transactions since they don't match
      expect(transactions).toHaveLength(2);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      const txs: Transaction[] = [
        {
          ...mockTransaction,
          contractId: 'tx1',
          senderDisplayName: 'TechBank',
          receiverDisplayName: 'GlobalCorp',
          payload: { ...mockTransaction.payload, rwaType: 'real_estate' },
          recordTime: '2024-01-15T10:00:00Z'
        },
        {
          ...mockTransaction,
          contractId: 'tx2',
          senderDisplayName: 'GlobalCorp',
          receiverDisplayName: 'RetailFinance',
          payload: { ...mockTransaction.payload, rwaType: 'private_equity' },
          recordTime: '2024-01-15T11:00:00Z'
        },
        {
          ...mockTransaction,
          contractId: 'tx3',
          senderDisplayName: 'RetailFinance',
          receiverDisplayName: 'TechBank',
          payload: { ...mockTransaction.payload, rwaType: 'real_estate' },
          recordTime: '2024-01-15T12:00:00Z'
        },
      ];
      
      useAppStore.getState().setTransactions(txs);
    });

    it('should filter by selected business (sender)', () => {
      useAppStore.getState().setSelectedBusiness('TechBank');
      
      const filtered = useAppStore.getState().getFilteredTransactions();
      expect(filtered).toHaveLength(2); // tx1 and tx3
      expect(filtered.every(t => 
        t.senderDisplayName === 'TechBank' || t.receiverDisplayName === 'TechBank'
      )).toBe(true);
    });

    it('should filter by RWA type', () => {
      useAppStore.getState().setSelectedRWA('private_equity');
      
      const filtered = useAppStore.getState().getFilteredTransactions();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].payload.rwaType).toBe('private_equity');
    });

    it('should filter by both business and RWA type', () => {
      useAppStore.getState().setSelectedBusiness('TechBank');
      useAppStore.getState().setSelectedRWA('real_estate');
      
      const filtered = useAppStore.getState().getFilteredTransactions();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.payload.rwaType === 'real_estate')).toBe(true);
    });

    it('should sort by record time (newest first)', () => {
      const filtered = useAppStore.getState().getFilteredTransactions();
      
      expect(filtered[0].contractId).toBe('tx3'); // 12:00
      expect(filtered[1].contractId).toBe('tx2'); // 11:00
      expect(filtered[2].contractId).toBe('tx1'); // 10:00
    });

    it('should handle invalid dates when sorting', () => {
      const txsWithInvalidDates: Transaction[] = [
        { ...mockTransaction, contractId: 'tx1', recordTime: '2024-01-15T10:00:00Z' },
        { ...mockTransaction, contractId: 'tx2', recordTime: 'invalid-date' },
        { ...mockTransaction, contractId: 'tx3', recordTime: '2024-01-15T12:00:00Z' },
      ];
      
      useAppStore.getState().setTransactions(txsWithInvalidDates);
      
      const filtered = useAppStore.getState().getFilteredTransactions();
      // Valid dates should come first
      expect(new Date(filtered[0].recordTime).getTime()).not.toBeNaN();
      expect(new Date(filtered[1].recordTime).getTime()).not.toBeNaN();
      // Invalid date should be at the end
      expect(filtered[2].recordTime).toBe('invalid-date');
    });
  });

  describe('Metrics', () => {
    beforeEach(() => {
      const txs: Transaction[] = [
        {
          ...mockTransaction,
          contractId: 'tx1',
          senderDisplayName: 'TechBank',
          receiverDisplayName: 'GlobalCorp',
          payload: { ...mockTransaction.payload, amount: '1000' },
          status: 'committed'
        },
        {
          ...mockTransaction,
          contractId: 'tx2',
          senderDisplayName: 'GlobalCorp',
          receiverDisplayName: 'TechBank',
          payload: { ...mockTransaction.payload, amount: '500' },
          status: 'committed'
        },
        {
          ...mockTransaction,
          contractId: 'tx3',
          senderDisplayName: 'TechBank',
          receiverDisplayName: 'RetailFinance',
          payload: { ...mockTransaction.payload, amount: '2000' },
          status: 'pending' // Not counted in volume
        },
      ];
      
      useAppStore.getState().setTransactions(txs);
    });

    it('should calculate sent transactions', () => {
      const metrics = useAppStore.getState().getMetricsForParty('TechBank');
      expect(metrics.sent).toBe(2); // tx1 and tx3
    });

    it('should calculate received transactions', () => {
      const metrics = useAppStore.getState().getMetricsForParty('TechBank');
      expect(metrics.received).toBe(1); // tx2
    });

    it('should calculate volume (only committed)', () => {
      const metrics = useAppStore.getState().getMetricsForParty('TechBank');
      // tx1: 1000 (sent, committed) + tx2: 500 (received, committed)
      // tx3: 2000 (sent, but pending - not counted)
      expect(metrics.volume).toBe(1500);
    });

    it('should return zero metrics for unknown party', () => {
      const metrics = useAppStore.getState().getMetricsForParty('UnknownParty');
      expect(metrics.sent).toBe(0);
      expect(metrics.received).toBe(0);
      expect(metrics.volume).toBe(0);
    });
  });

  describe('State Setters', () => {
    it('should set parties', () => {
      const parties = [
        { name: 'TechBank', id: 'TechBank::123' },
        { name: 'GlobalCorp', id: 'GlobalCorp::456' },
      ];
      
      useAppStore.getState().setParties(parties);
      expect(useAppStore.getState().parties).toEqual(parties);
    });

    it('should set active view', () => {
      useAppStore.getState().setActiveView('list');
      expect(useAppStore.getState().activeView).toBe('list');
      
      useAppStore.getState().setActiveView('flow');
      expect(useAppStore.getState().activeView).toBe('flow');
    });

    it('should set selected transaction', () => {
      useAppStore.getState().setSelectedTransaction(mockTransaction);
      expect(useAppStore.getState().selectedTransaction).toEqual(mockTransaction);
      
      useAppStore.getState().setSelectedTransaction(null);
      expect(useAppStore.getState().selectedTransaction).toBeNull();
    });

    it('should set connection status', () => {
      useAppStore.getState().setConnectionStatus('connected');
      expect(useAppStore.getState().connectionStatus).toBe('connected');
      
      useAppStore.getState().setConnectionStatus('disconnected');
      expect(useAppStore.getState().connectionStatus).toBe('disconnected');
    });
  });
});

