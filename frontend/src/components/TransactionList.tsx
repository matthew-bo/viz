import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatRWAType } from '../utils/formatters';

/**
 * TransactionList - Table-based view of all transactions
 * 
 * Features:
 * - Sortable columns
 * - Privacy-aware filtering
 * - Click to view details
 * - Status badges
 */
export const TransactionList: React.FC = () => {
  const { 
    getFilteredTransactions,
    setSelectedTransaction,
    parties
  } = useAppStore();

  const transactions = getFilteredTransactions();

  const getPartyColor = (displayName: string): string => {
    return parties.find(p => p.displayName === displayName)?.color || '#666';
  };

  if (transactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <div className="text-lg font-medium">No transactions found</div>
          <div className="text-sm">Try adjusting your filters</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                From → To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                RWA Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Submitted
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((tx, index) => (
              <motion.tr
                key={tx.contractId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedTransaction(tx)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`
                    inline-flex px-2 py-1 text-xs font-medium rounded-full
                    ${tx.status === 'committed'
                      ? 'bg-green-100 text-green-800'
                      : tx.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                    }
                  `}>
                    {tx.status === 'committed' ? '✓' : '⏳'} {tx.status}
                  </span>
                </td>

                {/* From → To */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getPartyColor(tx.senderDisplayName) }}
                      />
                      <span className="font-medium">{tx.senderDisplayName}</span>
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getPartyColor(tx.receiverDisplayName) }}
                      />
                      <span className="font-medium">{tx.receiverDisplayName}</span>
                    </span>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(parseFloat(tx.payload.amount))}
                  </span>
                </td>

                {/* RWA Type */}
                <td className="px-4 py-3">
                  <span className={`
                    inline-flex px-2 py-1 text-xs font-medium rounded
                    ${tx.payload.rwaType 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {formatRWAType(tx.payload.rwaType)}
                  </span>
                </td>

                {/* Description */}
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {tx.payload.description || '-'}
                </td>

                {/* Submitted Time */}
                <td className="px-4 py-3 text-sm text-gray-500">
                  {format(new Date(tx.payload.submittedAt), 'MMM d, h:mm a')}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

