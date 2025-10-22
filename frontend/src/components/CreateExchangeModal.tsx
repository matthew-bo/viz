/**
 * CreateExchangeModal - New modal for asset exchanges
 * Replaces CreateModal with support for cash and asset exchanges
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { AssetType, PartyInventory, ExchangeOffer } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CreateExchangeModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const { parties } = useAppStore();

  // Form state
  const [fromParty, setFromParty] = useState('');
  const [toParty, setToParty] = useState('');
  const [description, setDescription] = useState('');

  // Offering state
  const [offeringType, setOfferingType] = useState<AssetType>('cash');
  const [offeringCash, setOfferingCash] = useState('');
  const [offeringAssetId, setOfferingAssetId] = useState('');

  // Requesting state
  const [requestingType, setRequestingType] = useState<AssetType>('cash');
  const [requestingCash, setRequestingCash] = useState('');
  const [requestingAssetId, setRequestingAssetId] = useState('');

  // Inventories
  const [fromInventory, setFromInventory] = useState<PartyInventory | null>(null);
  const [toInventory, setToInventory] = useState<PartyInventory | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from party inventory when selected
  useEffect(() => {
    if (fromParty) {
      apiClient.getInventory(fromParty).then(setFromInventory).catch(() => {
        setError('Failed to load sender inventory');
      });
    } else {
      setFromInventory(null);
    }
  }, [fromParty]);

  // Load to party inventory when selected
  useEffect(() => {
    if (toParty) {
      apiClient.getInventory(toParty).then(setToInventory).catch(() => {
        setError('Failed to load receiver inventory');
      });
    } else {
      setToInventory(null);
    }
  }, [toParty]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFromParty('');
      setToParty('');
      setDescription('');
      setOfferingType('cash');
      setOfferingCash('');
      setOfferingAssetId('');
      setRequestingType('cash');
      setRequestingCash('');
      setRequestingAssetId('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fromParty || !toParty) {
      setError('Please select both sender and receiver');
      return;
    }

    if (fromParty === toParty) {
      setError('Cannot exchange with yourself');
      return;
    }

    // Build offering
    const offering: ExchangeOffer = { type: offeringType };
    if (offeringType === 'cash') {
      const amount = parseFloat(offeringCash);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid cash amount for offering');
        return;
      }
      if (fromInventory && amount > fromInventory.cash) {
        setError(`Insufficient cash balance. Available: $${fromInventory.cash.toLocaleString()}`);
        return;
      }
      offering.cashAmount = amount;
    } else {
      if (!offeringAssetId) {
        setError('Please select an asset to offer');
        return;
      }
      offering.assetId = offeringAssetId;
    }

    // Build requesting
    const requesting: ExchangeOffer = { type: requestingType };
    if (requestingType === 'cash') {
      const amount = parseFloat(requestingCash);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid cash amount for requesting');
        return;
      }
      if (toInventory && amount > toInventory.cash) {
        setError(`Receiver has insufficient cash. Available: $${toInventory.cash.toLocaleString()}`);
        return;
      }
      requesting.cashAmount = amount;
    } else {
      if (!requestingAssetId) {
        setError('Please select an asset to request');
        return;
      }
      requesting.assetId = requestingAssetId;
    }

    setLoading(true);
    try {
      await onSubmit({
        fromParty,
        toParty,
        offering,
        requesting,
        description: description || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create exchange');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold">Create Asset Exchange</h2>
            <p className="text-blue-100 text-sm mt-1">Propose a trade between parties</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Party Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From (Sender)
              </label>
              <select
                value={fromParty}
                onChange={(e) => setFromParty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select sender...</option>
                {parties.map((party) => (
                  <option key={party.partyId} value={party.partyId}>
                    {party.displayName}
                  </option>
                ))}
              </select>
              {fromInventory && (
                <div className="mt-2 text-sm text-gray-600">
                  💵 Cash: ${fromInventory.cash.toLocaleString()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To (Receiver)
              </label>
              <select
                value={toParty}
                onChange={(e) => setToParty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select receiver...</option>
                {parties.map((party) => (
                  <option key={party.partyId} value={party.partyId}>
                    {party.displayName}
                  </option>
                ))}
              </select>
              {toInventory && (
                <div className="mt-2 text-sm text-gray-600">
                  💵 Cash: ${toInventory.cash.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Offering Section */}
          <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50/50">
            <h3 className="text-lg font-bold text-green-800 mb-4">I OFFER:</h3>
            
            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={offeringType}
                  onChange={(e) => {
                    setOfferingType(e.target.value as AssetType);
                    setOfferingAssetId('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="real_estate">🏢 Real Estate</option>
                  <option value="private_equity">📊 Private Equity</option>
                </select>
              </div>

              {/* Cash Amount Input */}
              {offeringType === 'cash' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    value={offeringCash}
                    onChange={(e) => setOfferingCash(e.target.value)}
                    placeholder="Enter amount..."
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  {fromInventory && (
                    <div className="mt-2 text-sm text-gray-600">
                      Available: ${fromInventory.cash.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Real Estate Selection */}
              {offeringType === 'real_estate' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={offeringAssetId}
                    onChange={(e) => setOfferingAssetId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select property...</option>
                    {fromInventory?.realEstateAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - ${(asset.value / 1000000).toFixed(0)}M ({asset.location})
                      </option>
                    ))}
                  </select>
                  {fromInventory && fromInventory.realEstateAssets.length === 0 && (
                    <div className="mt-2 text-sm text-amber-600">
                      No real estate properties available
                    </div>
                  )}
                </div>
              )}

              {/* Private Equity Selection */}
              {offeringType === 'private_equity' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    value={offeringAssetId}
                    onChange={(e) => setOfferingAssetId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select company...</option>
                    {fromInventory?.privateEquityAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - ${(asset.valuation / 1000000).toFixed(0)}M ({asset.industry})
                      </option>
                    ))}
                  </select>
                  {fromInventory && fromInventory.privateEquityAssets.length === 0 && (
                    <div className="mt-2 text-sm text-amber-600">
                      No private equity holdings available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Requesting Section */}
          <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
            <h3 className="text-lg font-bold text-blue-800 mb-4">I REQUEST:</h3>
            
            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={requestingType}
                  onChange={(e) => {
                    setRequestingType(e.target.value as AssetType);
                    setRequestingAssetId('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="real_estate">🏢 Real Estate</option>
                  <option value="private_equity">📊 Private Equity</option>
                </select>
              </div>

              {/* Cash Amount Input */}
              {requestingType === 'cash' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    value={requestingCash}
                    onChange={(e) => setRequestingCash(e.target.value)}
                    placeholder="Enter amount..."
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {toInventory && (
                    <div className="mt-2 text-sm text-gray-600">
                      Available: ${toInventory.cash.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Real Estate Selection */}
              {requestingType === 'real_estate' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={requestingAssetId}
                    onChange={(e) => setRequestingAssetId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select property...</option>
                    {toInventory?.realEstateAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - ${(asset.value / 1000000).toFixed(0)}M ({asset.location})
                      </option>
                    ))}
                  </select>
                  {toInventory && toInventory.realEstateAssets.length === 0 && (
                    <div className="mt-2 text-sm text-amber-600">
                      Receiver has no real estate properties
                    </div>
                  )}
                </div>
              )}

              {/* Private Equity Selection */}
              {requestingType === 'private_equity' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    value={requestingAssetId}
                    onChange={(e) => setRequestingAssetId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select company...</option>
                    {toInventory?.privateEquityAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - ${(asset.valuation / 1000000).toFixed(0)}M ({asset.industry})
                      </option>
                    ))}
                  </select>
                  {toInventory && toInventory.privateEquityAssets.length === 0 && (
                    <div className="mt-2 text-sm text-amber-600">
                      Receiver has no private equity holdings
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this exchange..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Propose Exchange'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

