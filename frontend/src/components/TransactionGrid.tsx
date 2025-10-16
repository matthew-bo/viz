import { memo } from 'react';
import { Inbox } from 'lucide-react';
import { Transaction } from '../types';
import TransactionCard from './TransactionCard';

interface Props {
  transactions: Transaction[];
  selectedParty: string | null;
  onAccept: (contractId: string, receiver: string) => Promise<void>;
}

/**
 * TransactionGrid - Display grid of transactions with privacy filtering
 * Filters transactions based on selected party's visibility
 */
function TransactionGrid({ transactions, selectedParty, onAccept }: Props) {
  // Filter transactions based on privacy (party visibility)
  const filteredTransactions = transactions.filter((tx) => {
    if (!selectedParty) return true; // Show all if no filter

    // Party can see if they're sender or receiver
    return (
      tx.senderDisplayName === selectedParty ||
      tx.receiverDisplayName === selectedParty
    );
  });

  // Sort by record time (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime();
  });

  return (
    <div className="lg:col-span-3">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Transactions
          <span className="ml-2 text-sm font-normal text-gray-500" role="status" aria-live="polite">
            ({sortedTransactions.length} visible)
          </span>
        </h2>
        {selectedParty && (
          <p className="text-sm text-gray-600 mt-1" role="status" aria-live="polite">
            Viewing as <strong className="text-canton-blue">{selectedParty}</strong>
          </p>
        )}
      </div>

      {/* Empty State */}
      {sortedTransactions.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center" role="status">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Inbox className="w-8 h-8 text-gray-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No transactions to display
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {selectedParty
              ? `${selectedParty} has no visible transactions. Try submitting a new payment request or select a different party.`
              : 'No transactions found. Start by submitting a payment request above.'}
          </p>
        </div>
      )}

      {/* Transaction Cards Grid */}
      {sortedTransactions.length > 0 && (
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          role="list"
          aria-label="Transaction list"
        >
          {sortedTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.contractId}
              transaction={transaction}
              selectedParty={selectedParty}
              onAccept={onAccept}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(TransactionGrid);

