import { memo } from 'react';
import { Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import TransactionCard from './TransactionCard';

/**
 * TransactionGrid - Display grid of transactions with privacy filtering
 * Now uses Zustand for state management
 */
function TransactionGrid() {
  const { getFilteredTransactions, selectedBusiness, setSelectedTransaction } = useAppStore();
  const { toast } = useToast();
  
  const transactions = getFilteredTransactions();

  const handleAccept = async (contractId: string, receiver: string) => {
    try {
      await apiClient.acceptContract(contractId, receiver);
      toast.success('Payment accepted successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to accept payment';
      toast.error(message);
      throw err;
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No transactions to display
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {selectedBusiness
                ? `${selectedBusiness} has no visible transactions. Try submitting a new payment request.`
                : 'No transactions found. Click CREATE to submit a payment request.'}
            </p>
          </div>
        </div>
      )}

      {/* Transaction Cards Grid */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.contractId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedTransaction(transaction)}
            >
              <TransactionCard
                transaction={transaction}
                selectedParty={selectedBusiness}
                onAccept={handleAccept}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(TransactionGrid);

