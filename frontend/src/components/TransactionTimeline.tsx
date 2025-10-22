import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, ArrowRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '../types';
import { useAppStore } from '../store/useAppStore';

interface TransactionTimelineProps {
  transaction: Transaction;
  onAccept?: () => void;
}

/**
 * TransactionTimeline - Visual timeline showing transaction progress
 * 
 * Shows:
 * - Who created it and when
 * - Current status in the flow
 * - Next action required
 * - Accept button (if pending and user is receiver)
 */
export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({
  transaction,
  onAccept
}) => {
  const { parties } = useAppStore();
  const isPending = transaction.status === 'pending';
  const isCommitted = transaction.status === 'committed';

  const getSenderColor = () => {
    return parties.find(p => p.displayName === transaction.senderDisplayName)?.color || '#3B82F6';
  };

  const getReceiverColor = () => {
    return parties.find(p => p.displayName === transaction.receiverDisplayName)?.color || '#10B981';
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transaction Timeline
          </h1>
          <p className="text-gray-600">
            Track the progress of this payment request
          </p>
        </motion.div>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold shadow-lg ${
            isCommitted 
              ? 'bg-green-100 text-green-800 border-2 border-green-500' 
              : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
          }`}>
            {isCommitted ? (
              <><CheckCircle className="w-6 h-6" /> Committed</>
            ) : (
              <><Clock className="w-6 h-6 animate-spin" /> Pending Acceptance</>
            )}
          </div>
        </motion.div>

        {/* Visual Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200"
        >
          <div className="flex items-center justify-between">
            {/* Sender */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{ backgroundColor: getSenderColor() }}
              >
                <User className="w-12 h-12" />
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-gray-900">
                  {transaction.senderDisplayName}
                </div>
                <div className="text-sm text-gray-500">Sender</div>
              </div>
              <div className="mt-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium">
                ✓ Submitted
              </div>
            </div>

            {/* Arrow with Amount */}
            <div className="flex flex-col items-center gap-2 px-8">
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ArrowRight className="w-16 h-16 text-blue-500" />
              </motion.div>
              <div className="text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="text-2xl font-bold">
                  ${parseFloat(transaction.payload.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm opacity-90">{transaction.payload.currency}</div>
              </div>
            </div>

            {/* Receiver */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{ backgroundColor: getReceiverColor() }}
              >
                <User className="w-12 h-12" />
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-gray-900">
                  {transaction.receiverDisplayName}
                </div>
                <div className="text-sm text-gray-500">Receiver</div>
              </div>
              <div className={`mt-2 px-3 py-1 rounded-lg text-sm font-medium ${
                isCommitted
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-gray-50 border border-gray-200 text-gray-500'
              }`}>
                {isCommitted ? '✓ Accepted' : '⏳ Pending'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Timeline Events</h3>
          <div className="space-y-6">
            {/* Created Event */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <div className="w-px flex-1 bg-blue-200 mt-2" />
              </div>
              <div className="flex-1 pb-8">
                <div className="font-semibold text-gray-900 text-lg">Transaction Created</div>
                <div className="text-sm text-gray-600 mt-1">
                  {format(new Date(transaction.payload.submittedAt), 'PPpp')}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {transaction.senderDisplayName} submitted a payment request
                </div>
              </div>
            </div>

            {/* Committed Event (if exists) */}
            {isCommitted && transaction.payload.committedAt ? (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-lg">Transaction Accepted</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {format(new Date(transaction.payload.committedAt), 'PPpp')}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {transaction.receiverDisplayName} accepted the payment request
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-700 text-lg">Awaiting Acceptance</div>
                  <div className="text-sm text-gray-500 mt-2">
                    Waiting for {transaction.receiverDisplayName} to accept
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Next Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-2xl shadow-xl p-8 border-2 ${
            isPending 
              ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
          }`}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {isPending ? '⚡ Next Action Required' : '✓ Transaction Complete'}
          </h3>
          {isPending ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>{transaction.receiverDisplayName}</strong> needs to accept this payment request 
                to commit it to the Canton blockchain.
              </p>
              {onAccept && (
                <button
                  onClick={onAccept}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 
                           hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl 
                           shadow-lg hover:shadow-xl transition-all transform hover:scale-105
                           flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-6 h-6" />
                  Accept Transaction
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-700">
              This transaction has been successfully committed to the Canton blockchain. 
              Both parties have signed and the payment is complete.
            </p>
          )}
        </motion.div>

        {/* Contract Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contract Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Contract ID</div>
              <div className="font-mono text-xs text-gray-800 mt-1">
                {transaction.contractId.slice(0, 30)}...
              </div>
            </div>
            <div>
              <div className="text-gray-500">Transaction ID</div>
              <div className="font-mono text-xs text-gray-800 mt-1">
                {transaction.transactionId.slice(0, 30)}...
              </div>
            </div>
            {transaction.payload.description && (
              <div className="col-span-2">
                <div className="text-gray-500">Description</div>
                <div className="text-gray-800 mt-1">{transaction.payload.description}</div>
              </div>
            )}
            {transaction.payload.rwaType && (
              <div className="col-span-2">
                <div className="text-gray-500">Asset Type</div>
                <div className="text-gray-800 mt-1">{transaction.payload.rwaType}</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};


