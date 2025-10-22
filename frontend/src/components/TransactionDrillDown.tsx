import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, FileText, CheckCircle, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatRWAType, parseRWADetails } from '../utils/formatters';
import { Transaction } from '../types';

interface TransactionDrillDownProps {
  transaction: Transaction;
  onClose?: () => void; // Optional - only for overlay mode
  embedded?: boolean; // New: true when used in MainContent, false for overlay
}

/**
 * TransactionDrillDown - Detailed view of a single transaction
 * 
 * Shows:
 * - Full transaction metadata
 * - RWA details (if applicable)
 * - Privacy information
 * - Timeline
 * 
 * Can be used as:
 * - Embedded component in MainContent (embedded=true)
 * - Overlay panel (embedded=false, default for backwards compat)
 */
export const TransactionDrillDown: React.FC<TransactionDrillDownProps> = ({
  transaction,
  onClose,
  embedded = false
}) => {
  const { parties } = useAppStore();

  const getPartyColor = (displayName: string): string => {
    return parties.find(p => p.displayName === displayName)?.color || '#666';
  };

  const rwaDetails = parseRWADetails(transaction.payload.rwaDetails);

  // Embedded mode: no backdrop, just content
  if (embedded) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <DrillDownContent 
          transaction={transaction}
          getPartyColor={getPartyColor}
          rwaDetails={rwaDetails}
          parties={parties}
        />
      </div>
    );
  }

  // Overlay mode: with backdrop
  return (
    <AnimatePresence>
      {transaction && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <p className="text-sm text-gray-500">Full blockchain record</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Reuse DrillDownContent */}
            <DrillDownContent 
              transaction={transaction}
              getPartyColor={getPartyColor}
              rwaDetails={rwaDetails}
              parties={parties}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * DrillDownContent - Reusable content section for transaction details
 * Used by both embedded and overlay modes
 */
interface DrillDownContentProps {
  transaction: Transaction;
  getPartyColor: (displayName: string) => string;
  rwaDetails: any;
  parties: any[];
}

const DrillDownContent: React.FC<DrillDownContentProps> = ({
  transaction,
  getPartyColor,
  rwaDetails
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold
          ${transaction.status === 'committed'
            ? 'bg-green-100 text-green-800'
            : transaction.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
          }
        `}>
          {transaction.status === 'committed' ? (
            <><CheckCircle className="w-4 h-4" /> Committed</>
          ) : (
            <><Clock className="w-4 h-4" /> Pending Acceptance</>
          )}
        </span>
        {transaction.payload.rwaType && (
          <span className="inline-flex px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">
            {formatRWAType(transaction.payload.rwaType)}
          </span>
        )}
      </div>

      {/* Parties */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Transaction Flow</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: getPartyColor(transaction.senderDisplayName) }}
            >
              {transaction.senderDisplayName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {transaction.senderDisplayName}
              </div>
              <div className="text-xs text-gray-500">Sender</div>
            </div>
          </div>

          <div className="text-2xl text-gray-400">→</div>

          <div className="flex items-center gap-2">
            <div>
              <div className="font-semibold text-gray-800 text-right">
                {transaction.receiverDisplayName}
              </div>
              <div className="text-xs text-gray-500 text-right">Receiver</div>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: getPartyColor(transaction.receiverDisplayName) }}
            >
              {transaction.receiverDisplayName.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <DollarSign className="w-5 h-5" />
          <div className="text-sm font-medium">Amount</div>
        </div>
        <div className="text-4xl font-bold text-blue-900">
          {formatCurrency(parseFloat(transaction.payload.amount))}
        </div>
        <div className="text-sm text-blue-700 mt-1">{transaction.payload.currency}</div>
      </div>

      {/* Description */}
      {transaction.payload.description && (
        <div>
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            <div className="text-sm font-semibold">Description</div>
          </div>
          <div className="text-gray-600 bg-gray-50 rounded-lg p-4">
            {transaction.payload.description}
          </div>
        </div>
      )}

      {/* RWA Details */}
      {rwaDetails && (
        <div>
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Info className="w-4 h-4" />
            <div className="text-sm font-semibold">Asset Details</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            {Object.entries(rwaDetails).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-gray-800 font-medium">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <div className="flex items-center gap-2 text-gray-700 mb-3">
          <Calendar className="w-4 h-4" />
          <div className="text-sm font-semibold">Timeline</div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-px h-full bg-blue-200"></div>
            </div>
            <div className="pb-4">
              <div className="font-medium text-gray-800">Submitted</div>
              <div className="text-sm text-gray-600">
                {format(new Date(transaction.payload.submittedAt), 'PPpp')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {transaction.senderDisplayName} created the request
              </div>
            </div>
          </div>

          {transaction.payload.committedAt && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div>
                <div className="font-medium text-gray-800">Committed</div>
                <div className="text-sm text-gray-600">
                  {format(new Date(transaction.payload.committedAt), 'PPpp')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {transaction.receiverDisplayName} accepted the request
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blockchain Metadata */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-gray-700 mb-3">Blockchain Metadata</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Contract ID:</span>
            <span className="text-gray-800 font-mono text-xs">
              {transaction.contractId.slice(0, 20)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="text-gray-800 font-mono text-xs">
              {transaction.transactionId.slice(0, 20)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Template:</span>
            <span className="text-gray-800">{transaction.templateId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Recorded:</span>
            <span className="text-gray-800">
              {format(new Date(transaction.recordTime), 'PPpp')}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Information */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-2">Privacy Information</h3>
        <p className="text-sm text-purple-700">
          This transaction is only visible to {transaction.signatories.length} signator{transaction.signatories.length > 1 ? 'ies' : 'y'} 
          {' '}and {transaction.observers.length} observer{transaction.observers.length > 1 ? 's' : ''} on the Canton Network.
          Other parties cannot see this transaction.
        </p>
      </div>
    </div>
  );
};

