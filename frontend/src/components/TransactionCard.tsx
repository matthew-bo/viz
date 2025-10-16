import { useState, memo } from 'react';
import { ArrowRight, Calendar, CheckCircle2, ChevronDown, ChevronUp, Hash, Loader2 } from 'lucide-react';
import { Transaction } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  transaction: Transaction;
  selectedParty: string | null;
  onAccept: (contractId: string, receiver: string) => Promise<void>;
}

/**
 * TransactionCard - Individual transaction display
 * Shows all transaction details with accept button for pending requests
 */
function TransactionCard({ transaction, selectedParty, onAccept }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Format amount with commas
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if current party can accept
  const canAccept =
    transaction.status === 'pending' &&
    selectedParty === transaction.receiverDisplayName;

  // Handle accept click
  const handleAccept = async () => {
    if (!canAccept) return;

    setIsAccepting(true);
    try {
      await onAccept(transaction.contractId, transaction.receiverDisplayName);
    } catch (error: any) {
      console.error('Failed to accept:', error);
      // Show error in UI instead of alert - more professional
      const errorMsg = error?.message || 'Failed to accept transaction. Please try again.';
      console.error('Accept error:', errorMsg);
      // TODO: Add toast notification here
    } finally {
      setIsAccepting(false);
    }
  };

  // Check which parties can see this transaction
  const getVisibilityIndicators = () => {
    return [
      { name: 'TechBank', canSee: transaction.senderDisplayName === 'TechBank' || transaction.receiverDisplayName === 'TechBank' },
      { name: 'GlobalCorp', canSee: transaction.senderDisplayName === 'GlobalCorp' || transaction.receiverDisplayName === 'GlobalCorp' },
      { name: 'RetailFinance', canSee: transaction.senderDisplayName === 'RetailFinance' || transaction.receiverDisplayName === 'RetailFinance' },
    ];
  };

  return (
    <article 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden animate-fade-in"
      aria-label={`Transaction from ${transaction.senderDisplayName} to ${transaction.receiverDisplayName}`}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <StatusBadge status={transaction.status} />
          <span className="text-xs text-gray-500 font-mono" aria-label="Contract ID prefix">
            {transaction.contractId.substring(0, 8)}...
          </span>
        </div>

        {/* Sender → Receiver */}
        <div className="flex items-center gap-3 my-4" role="group" aria-label="Transaction parties">
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-500">From</div>
            <div className="font-bold text-gray-900 text-lg">
              {transaction.senderDisplayName}
            </div>
          </div>
          
          <div className="bg-canton-blue-light text-white p-2 rounded-full" aria-hidden="true">
            <ArrowRight className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="text-sm text-gray-500">To</div>
            <div className="font-bold text-gray-900 text-lg">
              {transaction.receiverDisplayName}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div 
          className="bg-gradient-to-r from-canton-blue to-canton-blue-dark text-white p-4 rounded-lg text-center"
          role="group"
          aria-label={`Amount: ${formatAmount(transaction.payload.amount)} ${transaction.payload.currency}`}
        >
          <div className="text-3xl font-bold">
            ${formatAmount(transaction.payload.amount)}
          </div>
          <div className="text-sm text-blue-100">
            {transaction.payload.currency}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4">
        {/* Description */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Description
          </div>
          <div className="text-sm text-gray-900">
            {transaction.payload.description || 'No description provided'}
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 gap-3" role="group" aria-label="Transaction timestamps">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <span className="text-gray-600">Submitted:</span>
            <time className="text-gray-900 font-medium" dateTime={transaction.payload.submittedAt}>
              {formatTimestamp(transaction.payload.submittedAt)}
            </time>
          </div>
          
          {transaction.payload.committedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
              <span className="text-gray-600">Committed:</span>
              <time className="text-gray-900 font-medium" dateTime={transaction.payload.committedAt}>
                {formatTimestamp(transaction.payload.committedAt)}
              </time>
            </div>
          )}
        </div>

        {/* Privacy Indicators */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Visibility
          </div>
          <div 
            className="flex items-center gap-2 flex-wrap"
            role="list"
            aria-label="Transaction visibility by party"
          >
            {getVisibilityIndicators().map((indicator) => (
              <div
                key={indicator.name}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  indicator.canSee
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
                role="listitem"
                aria-label={`${indicator.name} ${indicator.canSee ? 'can see' : 'cannot see'} this transaction`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    indicator.canSee ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {indicator.name}
              </div>
            ))}
          </div>
        </div>

        {/* Canton Metadata (Expandable) */}
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-canton-blue transition-colors w-full"
            aria-expanded={isExpanded}
            aria-controls="canton-metadata"
            aria-label={isExpanded ? 'Hide Canton metadata' : 'Show Canton metadata'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="font-medium">Canton Metadata</span>
          </button>

          {isExpanded && (
            <div 
              id="canton-metadata" 
              className="mt-3 space-y-2 pl-6 animate-slide-up"
              role="region"
              aria-label="Canton blockchain metadata"
            >
              <div className="flex items-start gap-2 text-xs">
                <Hash className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-gray-500">Transaction ID</div>
                  <div className="text-gray-900 font-mono break-all">
                    {transaction.transactionId}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Hash className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-gray-500">Contract ID</div>
                  <div className="text-gray-900 font-mono break-all">
                    {transaction.contractId}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Hash className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-gray-500">Ledger Offset</div>
                  <div className="text-gray-900 font-mono">
                    {transaction.offset}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <Hash className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-gray-500">Signatories</div>
                  <div className="text-gray-900 space-y-1">
                    {transaction.signatories.map((sig) => (
                      <div key={sig} className="font-mono text-xs break-all">
                        {sig.split('::')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accept Button */}
        {canAccept && (
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label={isAccepting ? 'Accepting payment' : `Accept payment of ${formatAmount(transaction.payload.amount)} ${transaction.payload.currency}`}
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                Accept Payment
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

export default memo(TransactionCard);

