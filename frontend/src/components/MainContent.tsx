import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TransactionList } from './TransactionList';
import { TransactionTimeline } from './TransactionTimeline';
import { RWAFlowDiagram } from './RWAFlowDiagram';
import { apiClient } from '../api/client';
import { useToast } from '../hooks/useToast';

type ViewMode = 'list' | 'flow';

/**
 * MainContent - Central workspace area
 * 
 * Shows:
 * - List view (all transactions in table)
 * - Flow view (RWA asset flow diagram)
 * - Timeline visualization when a transaction is selected
 */
export const MainContent: React.FC = () => {
  const { selectedTransaction, setSelectedTransaction } = useAppStore();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const handleAccept = async () => {
    if (!selectedTransaction) return;

    try {
      toast.info('Accepting transaction...');
      await apiClient.acceptContract(selectedTransaction.contractId, selectedTransaction.receiverDisplayName);
      toast.success('✅ Transaction accepted! Returning to list...');
      
      // Clear selection after 2 seconds to show the updated transaction in the list
      setTimeout(() => {
        setSelectedTransaction(null);
      }, 2000);
      
      // Transaction will update via SSE
    } catch (error) {
      console.error('Failed to accept transaction:', error);
      toast.error('Failed to accept transaction');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              {selectedTransaction 
                ? 'Transaction Details' 
                : viewMode === 'list' 
                  ? 'All Transactions' 
                  : 'RWA Flow Visualization'}
            </h2>
            {selectedTransaction && (
              <span className="text-sm text-gray-500">
                Contract #{selectedTransaction.contractId.slice(0, 8)}...
              </span>
            )}
          </div>
          
          {/* View toggle buttons (only show when no transaction selected) */}
          {!selectedTransaction && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('flow')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'flow'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                RWA Flow
              </button>
            </div>
          )}
          
          {/* Back button when drill-down is active */}
          {selectedTransaction && (
            <button
              onClick={() => setSelectedTransaction(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 
                         bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors
                         flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to List</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedTransaction ? (
            // Transaction drill-down view
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <TransactionTimeline 
                transaction={selectedTransaction} 
                onAccept={selectedTransaction.status === 'pending' ? handleAccept : undefined}
              />
            </motion.div>
          ) : viewMode === 'list' ? (
            // List view
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <TransactionList />
            </motion.div>
          ) : (
            // RWA Flow view
            <motion.div
              key="flow-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <RWAFlowDiagram />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

