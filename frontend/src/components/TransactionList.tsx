import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatRWAType } from '../utils/formatters';
import { isExchangeTransaction } from '../utils/exchangeAdapter';

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
        <div className="text-center text-gray-500 max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🏦</div>
          <div className="text-xl font-bold mb-2">Asset Exchange Platform</div>
          <div className="text-base mb-4">
            No Canton transactions found - this is expected for the new exchange system.
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm">
            <div className="font-semibold text-blue-900 mb-2">✨ New Features:</div>
            <ul className="space-y-1 text-blue-800">
              <li>• Click <strong>CREATE</strong> to propose asset exchanges</li>
              <li>• View party inventories in the left sidebar</li>
              <li>• Trade cash, real estate, and private equity</li>
            </ul>
          </div>
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
                  <div className="flex items-center gap-2">
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
                    {isExchangeTransaction(tx) && (
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded"
                        title="Asset Exchange"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </td>

                {/* From → To (or ↔ for exchanges) */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getPartyColor(tx.senderDisplayName) }}
                      />
                      <span className="font-medium">{tx.senderDisplayName}</span>
                    </span>
                    <span className="text-gray-400">
                      {isExchangeTransaction(tx) ? '↔' : '→'}
                    </span>
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

