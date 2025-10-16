import { useState } from 'react';
import { Send, DollarSign, MessageSquare, Loader2 } from 'lucide-react';
import { Party } from '../types';

interface Props {
  parties: Party[];
  onSubmit: (data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
  }) => Promise<void>;
}

/**
 * ContractForm - Submit new payment requests
 * Validates inputs and provides user feedback
 */
export default function ContractForm({ parties, onSubmit }: Props) {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!sender || !receiver || !amount) {
      setError('Sender, receiver, and amount are required');
      return;
    }

    if (sender === receiver) {
      setError('Sender and receiver must be different');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        sender,
        receiver,
        amount: numAmount,
        description,
      });

      // Success! Reset form
      setSender('');
      setReceiver('');
      setAmount('');
      setDescription('');
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Send className="w-5 h-5 text-canton-blue" aria-hidden="true" />
        <h2 className="text-lg font-bold text-gray-900">Submit Payment Request</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Payment request form">
        {/* From (Sender) */}
        <div>
          <label htmlFor="sender" className="block text-sm font-semibold text-gray-700 mb-2">
            From
          </label>
          <select
            id="sender"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-canton-blue focus:border-canton-blue transition-colors"
            disabled={isSubmitting}
            aria-label="Select payment sender"
            required
          >
            <option value="">Select sender...</option>
            {parties.map((party) => (
              <option key={party.displayName} value={party.displayName}>
                {party.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* To (Receiver) */}
        <div>
          <label htmlFor="receiver" className="block text-sm font-semibold text-gray-700 mb-2">
            To
          </label>
          <select
            id="receiver"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-canton-blue focus:border-canton-blue transition-colors"
            disabled={isSubmitting}
            aria-label="Select payment receiver"
            required
          >
            <option value="">Select receiver...</option>
            {parties
              .filter((party) => party.displayName !== sender)
              .map((party) => (
                <option key={party.displayName} value={party.displayName}>
                  {party.displayName}
                </option>
              ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
            Amount (USD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-canton-blue focus:border-canton-blue transition-colors"
              disabled={isSubmitting}
              aria-label="Payment amount in USD"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Invoice #123, Payment for services..."
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-canton-blue focus:border-canton-blue transition-colors resize-none"
              disabled={isSubmitting}
              aria-label="Payment description (optional)"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-up" 
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div 
            className="p-3 bg-green-50 border border-green-200 rounded-lg animate-slide-up"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-green-800 font-medium">
              ✓ Transaction submitted successfully!
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-canton-blue to-canton-blue-dark text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label={isSubmitting ? 'Submitting payment request' : 'Submit payment request to Canton Network'}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Submitting to Canton...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" aria-hidden="true" />
              Submit to Canton Network
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg" role="note">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>Note:</strong> Submitting creates a PaymentRequest that requires 
          the receiver's acceptance. This demonstrates multi-party signatures on the blockchain.
        </p>
      </div>
    </div>
  );
}

