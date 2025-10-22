import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { apiClient } from '../api/client';
import { useToast } from '../hooks/useToast';

/**
 * SynchronizerFooter - Horizontal timeline of smart contracts
 * 
 * Features:
 * - Filter buttons (All, AssetOracle, RetailChain, WholesaleFinance)
 * - Horizontal infinite scroll (left → right)
 * - Contract blocks with status colors (yellow=pending, green=committed)
 * - Click block to show details in main area
 * - Accept button on pending blocks
 * - Pending contracts grouped separately
 */
export const SynchronizerFooter: React.FC = () => {
  const { 
    parties, 
    transactions, 
    connectionStatus,
    selectedTransaction,
    setSelectedTransaction 
  } = useAppStore();
  
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>('All');

  // Auto-scroll to right on new transactions
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [transactions.length]);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'All') return true;
    return tx.senderDisplayName === filter || tx.receiverDisplayName === filter;
  });

  const committedTxs = filteredTransactions.filter(tx => tx.status === 'committed');
  const pendingTxs = filteredTransactions.filter(tx => tx.status === 'pending');

  // Handle accept action from contract block
  const handleAccept = async (contractId: string) => {
    try {
      // Find the transaction to get receiver name
      const tx = transactions.find(t => t.contractId === contractId);
      if (!tx) {
        toast.error('Transaction not found');
        return;
      }
      
      toast.info('Accepting transaction...');
      await apiClient.acceptContract(contractId, tx.receiverDisplayName);
      toast.success('✅ Transaction accepted! View updated in timeline.');
      
      // Auto-select the accepted transaction to show details
      setSelectedTransaction(tx);
      
      // Transaction will update via SSE
    } catch (error) {
      console.error('Failed to accept transaction:', error);
      toast.error('Failed to accept transaction');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-t-2 border-gray-300">
      {/* Header with Filters */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Filter Buttons (Top-Left) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 mr-1">Filter:</span>
            <button
              onClick={() => setFilter('All')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                filter === 'All'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All
            </button>
            {parties.map(party => (
              <button
                key={party.displayName}
                onClick={() => setFilter(party.displayName)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
                  filter === party.displayName
                    ? 'bg-white text-gray-800 shadow-sm border-2 border-blue-500'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: party.color }}
                />
                {party.displayName}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>✅ Committed: <strong>{committedTxs.length}</strong></span>
            <span>⏳ Pending: <strong>{pendingTxs.length}</strong></span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-gradient-to-r from-gray-50 to-blue-50"
      >
        <div className="h-full flex items-center gap-3 min-w-max">
          {/* Start Marker */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center px-4">
            <div className="text-2xl mb-1">🏁</div>
            <div className="text-xs font-semibold text-gray-500">Start</div>
          </div>

          {/* Committed Contracts Timeline */}
          {committedTxs.map((tx, index) => (
            <ContractBlock
              key={tx.contractId}
              transaction={tx}
              index={index}
              isSelected={selectedTransaction?.contractId === tx.contractId}
              onClick={() => setSelectedTransaction(tx)}
              onAccept={handleAccept}
            />
          ))}

          {/* Separator if there are pending */}
          {pendingTxs.length > 0 && (
            <div className="flex-shrink-0 flex flex-col items-center justify-center px-4">
              <div className="h-px w-8 bg-gradient-to-r from-gray-300 via-yellow-400 to-yellow-500 mb-2" />
              <div className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-300">
                Pending Sync
              </div>
              <div className="h-px w-8 bg-gradient-to-r from-yellow-500 via-yellow-400 to-gray-300 mt-2" />
            </div>
          )}

          {/* Pending Contracts (Not Yet Synced) */}
          {pendingTxs.map((tx, index) => (
            <ContractBlock
              key={tx.contractId}
              transaction={tx}
              index={index}
              isSelected={selectedTransaction?.contractId === tx.contractId}
              onClick={() => setSelectedTransaction(tx)}
              onAccept={handleAccept}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * ContractBlock - Individual contract in the timeline
 */
interface ContractBlockProps {
  transaction: Transaction;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onAccept?: (contractId: string) => void;
}

const ContractBlock: React.FC<ContractBlockProps> = ({ 
  transaction, 
  index, 
  isSelected, 
  onClick,
  onAccept
}) => {
  const isCommitted = transaction.status === 'committed';
  const isPending = transaction.status === 'pending';

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onClick from firing
    if (onAccept) {
      onAccept(transaction.contractId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ scale: 1.05, y: -4 }}
      className={`
        flex-shrink-0 w-52 bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all cursor-pointer
        ${isSelected 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-500 ring-opacity-50' 
          : isPending 
            ? 'border-yellow-400 hover:border-yellow-500 hover:shadow-md'
            : 'border-green-400 hover:border-green-500 hover:shadow-md'
        }
      `}
      onClick={onClick}
    >
      {/* Main Content */}
      <div className="p-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            isCommitted 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isCommitted ? '✅ Committed' : '⏳ Pending'}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            #{transaction.contractId.slice(0, 6)}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-2">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(parseFloat(transaction.payload.amount))}
          </div>
          <div className="text-xs text-gray-500 uppercase">
            {transaction.payload.currency}
          </div>
        </div>

        {/* Parties */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">From:</span>
            <span className="font-semibold text-gray-800 truncate">
              {transaction.senderDisplayName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">To:</span>
            <span className="font-semibold text-gray-800 truncate">
              {transaction.receiverDisplayName}
            </span>
          </div>
        </div>

        {/* RWA Type if exists */}
        {transaction.payload.rwaType && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 truncate">
              🏛️ {transaction.payload.rwaType}
            </div>
          </div>
        )}
      </div>

      {/* Accept Button for Pending Transactions */}
      {isPending && onAccept && (
        <button
          onClick={handleAcceptClick}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 
                     hover:to-green-700 text-white font-bold py-2 px-3 text-sm
                     transition-all transform hover:scale-105 border-t border-green-600"
        >
          ✓ Accept
        </button>
      )}
    </motion.div>
  );
};

