import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, DollarSign, MessageSquare, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
    rwaType?: string;
    rwaDetails?: string;
  }) => Promise<void>;
}

const RWA_TYPES = [
  { value: '', label: 'None (Standard Payment)' },
  { value: 'cash', label: 'Cash' },
  { value: 'corporate_bonds', label: 'Corporate Bonds' },
  { value: 'treasury_bonds', label: 'Treasury Bonds' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'private_equity', label: 'Private Equity' },
  { value: 'trade_finance', label: 'Trade Finance' }
];

/**
 * CreateModal - Modal dialog for creating new payment requests
 * 
 * Features:
 * - Full form with validation
 * - RWA type dropdown
 * - Animated entry/exit
 * - Error/success feedback
 */
export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { parties } = useAppStore();
  
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [rwaType, setRwaType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form on close
      setSender('');
      setReceiver('');
      setAmount('');
      setDescription('');
      setRwaType('');
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        rwaType: rwaType || undefined,
        rwaDetails: rwaType ? JSON.stringify({ assetClass: rwaType }) : undefined
      });

      // Success! Close modal
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Create Payment Request</h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* From (Sender) */}
                <div>
                  <label htmlFor="modal-sender" className="block text-sm font-semibold text-gray-700 mb-2">
                    From <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-sender"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isSubmitting}
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
                  <label htmlFor="modal-receiver" className="block text-sm font-semibold text-gray-700 mb-2">
                    To <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal-receiver"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isSubmitting}
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
                  <label htmlFor="modal-amount" className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="modal-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                               focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* RWA Type */}
                <div>
                  <label htmlFor="modal-rwaType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Asset Type (RWA)
                  </label>
                  <select
                    id="modal-rwaType"
                    value={rwaType}
                    onChange={(e) => setRwaType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    {RWA_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select the type of Real World Asset being transferred
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="modal-description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      id="modal-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Invoice #123, Payment for services..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                               focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold 
                             text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white 
                             px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit to Canton
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Info Box */}
              <div className="px-6 pb-6">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Privacy Note:</strong> This creates a PaymentRequest that only the sender and receiver 
                    can see. The receiver must accept to create a committed Payment.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

