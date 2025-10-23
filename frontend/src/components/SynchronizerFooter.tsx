import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { apiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import { isExchangeTransaction } from '../utils/exchangeAdapter';
import { useTransactionAction } from '../hooks/useTransactionAction';

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
    transactions, 
    connectionStatus,
    selectedTransaction,
    setSelectedTransaction,
    selectedBusiness
  } = useAppStore();
  
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to right on new transactions
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [transactions.length]);

  // Filter transactions based on global selectedBusiness filter
  const filteredTransactions = transactions.filter(tx => {
    if (!selectedBusiness) return true;
    return tx.senderDisplayName === selectedBusiness || tx.receiverDisplayName === selectedBusiness;
  });

  const committedTxs = filteredTransactions.filter(tx => tx.status === 'committed');
  const pendingTxs = filteredTransactions.filter(tx => tx.status === 'pending');

  // Use transaction action hook for race condition prevention
  const { executeAction, isProcessing } = useTransactionAction();

  // Handle accept action from contract block (works for both Canton transactions and exchanges)
  const handleAccept = async (contractId: string) => {
    // Find the transaction to get receiver name
    const tx = transactions.find(t => t.contractId === contractId);
    if (!tx) {
      toast.error('Transaction not found');
      return;
    }
    
    const isExchange = isExchangeTransaction(tx);
    
    await executeAction(
      contractId,
      async () => {
        if (isExchange) {
          await apiClient.acceptExchange(contractId, tx.payload.receiver);
        } else {
          await apiClient.acceptContract(contractId, tx.receiverDisplayName);
        }
      },
      {
        loadingMessage: `Accepting ${isExchange ? 'exchange' : 'transaction'}...`,
        successMessage: `✅ ${isExchange ? 'Exchange accepted! Assets transferred.' : 'Transaction accepted! View updated in timeline.'}`,
        errorMessage: `Failed to accept ${isExchange ? 'exchange' : 'transaction'}`,
        onSuccess: () => {
          // Auto-select the accepted transaction to show details
          setTimeout(() => {
            setSelectedTransaction(tx);
          }, 2000);
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-t-2 border-gray-300">
      {/* Header with Stats - Compact */}
      <div className="px-2 md:px-4 py-1.5 md:py-2 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>🔄</span>
              <span>Synchronizer</span>
            </h3>
            {selectedBusiness && (
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                {selectedBusiness}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {filteredTransactions.length} tx
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <span>✅</span>
              <span className="font-bold text-green-600">{committedTxs.length}</span>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <span>⏳</span>
              <span className="font-bold text-yellow-600">{pendingTxs.length}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-300">
              <div className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className="text-xs font-medium text-gray-700 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-2 md:p-4 bg-gradient-to-r from-gray-50 to-blue-50"
      >
        <div className="h-full flex items-center gap-2 md:gap-3 min-w-max">
          {/* Start Marker */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center px-2 md:px-4">
            <div className="text-xl md:text-2xl mb-1">🏁</div>
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
              isAccepting={isProcessing(tx.contractId)}
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
              isAccepting={isProcessing(tx.contractId)}
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
  isAccepting?: boolean;
}

const ContractBlock: React.FC<ContractBlockProps> = ({ 
  transaction, 
  index, 
  isSelected, 
  onClick,
  onAccept,
  isAccepting = false
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
        flex-shrink-0 w-44 md:w-48 bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all cursor-pointer
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
        {/* Status Badge - Compact */}
        <div className="flex items-center justify-between mb-1.5">
          <div className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
            isCommitted 
              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300' 
              : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-300'
          }`}>
            {isCommitted ? '✅' : '⏳'}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            #{transaction.contractId.slice(0, 5)}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-1.5">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(parseFloat(transaction.payload.amount))}
          </div>
          <div className="text-xs text-gray-500 uppercase font-medium">
            {transaction.payload.currency}
          </div>
        </div>

        {/* Parties */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">From:</span>
            <span className="font-semibold text-gray-900 truncate">
              {transaction.senderDisplayName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">To:</span>
            <span className="font-semibold text-gray-900 truncate">
              {transaction.receiverDisplayName}
            </span>
          </div>
        </div>

        {/* RWA Type if exists */}
        {transaction.payload.rwaType && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-200">
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
          disabled={isAccepting}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600
                     hover:to-green-700 text-white font-bold py-1.5 px-3 text-xs
                     transition-all transform hover:scale-105 border-t border-green-600
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1.5"
        >
          {isAccepting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Accepting...
            </>
          ) : (
            <>✓ Accept</>
          )}
        </button>
      )}
    </motion.div>
  );
};

