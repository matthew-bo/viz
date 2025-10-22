import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, TrendingUp, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TransactionList } from './TransactionList';
import { TransactionTimeline } from './TransactionTimeline';
import { RWAFlowDiagram } from './RWAFlowDiagram';
import { AssetHistoryView } from './AssetHistoryView';
import { MetricsDashboard } from './MetricsDashboard';
import { apiClient } from '../api/client';
import { isExchangeTransaction } from '../utils/exchangeAdapter';
import { useIsSmallMobile } from '../hooks/useMediaQuery';
import { useTransactionAction } from '../hooks/useTransactionAction';

type ViewMode = 'list' | 'metrics' | 'flow';

/**
 * MainContent - Central workspace area
 * 
 * Shows:
 * - List view (all transactions in table)
 * - Flow view (RWA asset flow diagram)
 * - Timeline visualization when a transaction is selected
 */
export const MainContent: React.FC = () => {
  const { 
    selectedTransaction, 
    setSelectedTransaction, 
    selectedAsset, 
    setSelectedAsset,
    selectedBusiness 
  } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const isSmallMobile = useIsSmallMobile();

  // When switching tabs, clear drill-downs
  const handleTabChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedTransaction(null);
    setSelectedAsset(null);
  };

  const { executeAction, isProcessing } = useTransactionAction();

  const handleAccept = async () => {
    if (!selectedTransaction) return;

    const isExchange = isExchangeTransaction(selectedTransaction);
    const contractId = selectedTransaction.contractId;

    await executeAction(
      contractId,
      async () => {
        if (isExchange) {
          await apiClient.acceptExchange(contractId, selectedTransaction.payload.receiver);
        } else {
          await apiClient.acceptContract(contractId, selectedTransaction.receiverDisplayName);
        }
      },
      {
        loadingMessage: `Accepting ${isExchange ? 'exchange' : 'transaction'}...`,
        successMessage: `✅ ${isExchange ? 'Exchange' : 'Transaction'} accepted! Inventories will update momentarily...`,
        errorMessage: `Failed to accept ${isExchange ? 'exchange' : 'transaction'}`,
        onSuccess: () => {
          console.log('✅ Exchange/Transaction accepted, SSE will trigger inventory refresh');
          // Clear selection after 2 seconds to show the updated transaction in the list
          setTimeout(() => {
            setSelectedTransaction(null);
          }, 2000);
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Tab Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {selectedAsset
              ? 'Asset Ownership History'
              : selectedTransaction 
                ? 'Transaction Details' 
                : viewMode === 'list' 
                  ? 'Transactions & Exchanges'
                  : viewMode === 'metrics'
                    ? 'Analytics Dashboard'
                    : 'RWA Flow Visualization'}
          </h2>
          {selectedTransaction && (
            <span className="text-sm text-gray-500">
              Contract #{selectedTransaction.contractId.slice(0, 8)}...
            </span>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-0.5 lg:gap-1 px-3 lg:px-6 overflow-x-auto">
          <button
            onClick={() => handleTabChange('list')}
            className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-3 font-medium text-sm 
                       transition-colors border-b-2 min-h-touch whitespace-nowrap ${
              viewMode === 'list' && !selectedTransaction && !selectedAsset
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <List className="w-4 h-4 lg:w-5 lg:h-5" />
            {!isSmallMobile && <span>Transactions</span>}
          </button>

          <button
            onClick={() => handleTabChange('metrics')}
            className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-3 font-medium text-sm 
                       transition-colors border-b-2 min-h-touch whitespace-nowrap ${
              viewMode === 'metrics' && !selectedTransaction && !selectedAsset
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
            {!isSmallMobile && <span>Metrics</span>}
          </button>

          <button
            onClick={() => handleTabChange('flow')}
            className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-3 font-medium text-sm 
                       transition-colors border-b-2 min-h-touch whitespace-nowrap ${
              viewMode === 'flow' && !selectedTransaction && !selectedAsset
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
            {!isSmallMobile && <span>Flow</span>}
          </button>

          {/* Drill-down indicator */}
          {(selectedTransaction || selectedAsset) && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500">Viewing Details</span>
              <button
                onClick={() => {
                  setSelectedTransaction(null);
                  setSelectedAsset(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 
                           hover:bg-blue-50 rounded-md transition-colors"
              >
                ← Back to {viewMode === 'list' ? 'List' : viewMode === 'metrics' ? 'Metrics' : 'Flow'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedAsset ? (
            // Asset History drill-down view
            <motion.div
              key="asset-history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <AssetHistoryView asset={selectedAsset} />
            </motion.div>
          ) : selectedTransaction ? (
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
                isAccepting={isProcessing(selectedTransaction.contractId)}
              />
            </motion.div>
          ) : viewMode === 'list' ? (
            // Transaction List view (includes both Canton transactions and asset exchanges)
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
          ) : viewMode === 'metrics' ? (
            // Metrics Dashboard view
            <motion.div
              key="metrics-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MetricsDashboard selectedParty={selectedBusiness} />
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

