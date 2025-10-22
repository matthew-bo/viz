import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, TrendingUp, MapPin, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { Asset, RealEstateAsset, PrivateEquityAsset } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';

interface Props {
  asset: Asset;
}

/**
 * AssetHistoryView - Visual timeline showing asset ownership transfers
 * 
 * Displays: Bank1 → Bank2 → Bank1 → Bank3
 * Each node shows party, timestamp, and transfer amount
 * This is asset provenance/chain of custody
 */
export const AssetHistoryView: React.FC<Props> = ({ asset }) => {
  const { parties, setSelectedAsset } = useAppStore();

  const isRealEstate = asset.type === 'real_estate';
  const realEstateAsset = asset as RealEstateAsset;
  const privateEquityAsset = asset as PrivateEquityAsset;

  // Get party color by ID or name (handles both)
  const getPartyColor = (partyIdentifier: string): string => {
    // Try to find by ID first
    let party = parties.find(p => p.partyId === partyIdentifier);
    // If not found, try by display name
    if (!party) {
      party = parties.find(p => p.displayName === partyIdentifier);
    }
    return party?.color || '#6B7280';
  };

  // Get party name by ID or name (handles both)
  const getPartyName = (partyIdentifier: string): string => {
    // Try to find by ID first
    let party = parties.find(p => p.partyId === partyIdentifier);
    // If not found, try by display name
    if (!party) {
      party = parties.find(p => p.displayName === partyIdentifier);
    }
    // If found by either method, return display name, otherwise check if input is already a name
    if (party) {
      return party.displayName;
    }
    // If we couldn't find it and it looks like a display name (no ::), return it as-is
    if (!partyIdentifier.includes('::')) {
      return partyIdentifier;
    }
    return 'Unknown Party';
  };

  // Sort history by timestamp
  const sortedHistory = [...asset.history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedAsset(null)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 
                       hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="h-8 w-px bg-gray-300" />
            
            <div className="flex items-center gap-3">
              {isRealEstate ? (
                <Building2 className="w-6 h-6 text-blue-600" />
              ) : (
                <TrendingUp className="w-6 h-6 text-purple-600" />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{asset.name}</h2>
                <p className="text-sm text-gray-500">
                  {isRealEstate ? 'Real Estate Asset' : 'Private Equity Asset'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Asset Valuation</div>
            <div className="text-2xl font-bold text-gray-900">
              {isRealEstate 
                ? formatCurrency(realEstateAsset.value) 
                : formatCurrency(privateEquityAsset.valuation)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Intrinsic value</div>
          </div>
        </div>

        {/* Asset Details */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          {isRealEstate ? (
            <>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{realEstateAsset.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{realEstateAsset.propertyType}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>{privateEquityAsset.industry}</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created {format(new Date(asset.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Ownership Timeline */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            Ownership Transfer History
          </h3>

          {sortedHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">📦</div>
              <div className="text-lg font-semibold text-gray-600">No Transfer History</div>
              <div className="text-sm text-gray-500 mt-1">
                This asset has not been transferred yet
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Container */}
              <div className="flex items-center gap-4 overflow-x-auto pb-4">
                {sortedHistory.map((historyItem, index) => (
                  <React.Fragment key={`${historyItem.fromParty}-${historyItem.toParty}-${index}`}>
                    {/* Ownership Node */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.15 }}
                      className="flex-shrink-0 w-72"
                    >
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        {/* Party Circle and Name */}
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                            style={{ 
                              backgroundColor: historyItem.fromParty === 'System' ? '#10B981' : getPartyColor(historyItem.toParty),
                              boxShadow: `0 4px 12px ${historyItem.fromParty === 'System' ? '#10B98140' : getPartyColor(historyItem.toParty) + '40'}`
                            }}
                          >
                            {historyItem.fromParty === 'System' ? '🏦' : getPartyName(historyItem.toParty).charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div 
                              className="font-bold text-base truncate"
                              style={{ color: historyItem.fromParty === 'System' ? '#10B981' : getPartyColor(historyItem.toParty) }}
                            >
                              {getPartyName(historyItem.toParty)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {historyItem.fromParty === 'System' ? '🎉 Original Owner (Initial Allocation)' : `Transfer #${index}`}
                            </div>
                          </div>
                        </div>

                        {/* Transfer Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(historyItem.timestamp), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          
                          {historyItem.exchangedFor?.value && historyItem.exchangedFor.value > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <DollarSign className="w-4 h-4" />
                                <span>{formatCurrency(historyItem.exchangedFor.value)}</span>
                              </div>
                              <div className="text-xs text-gray-500 ml-6">
                                Transfer amount paid
                              </div>
                            </div>
                          )}
                          
                          {historyItem.exchangedFor?.description && !historyItem.exchangedFor?.value && (
                            <div className="text-sm text-gray-600">
                              Exchanged for: <span className="font-semibold">{historyItem.exchangedFor.description}</span>
                            </div>
                          )}
                          
                          {historyItem.fromParty !== 'System' && index > 0 && (
                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                              <span className="font-medium">From:</span>{' '}
                              <span style={{ color: getPartyColor(historyItem.fromParty) }}>
                                {getPartyName(historyItem.fromParty)}
                              </span>
                            </div>
                          )}
                          
                          {historyItem.fromParty === 'System' && (
                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                              <span className="font-medium">Source:</span>{' '}
                              <span className="text-green-600 font-semibold">System Initial Allocation</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Arrow between nodes (except after last node) */}
                    {index < sortedHistory.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 + 0.1 }}
                        className="flex-shrink-0"
                      >
                        <ArrowRight className="w-8 h-8 text-gray-400" />
                      </motion.div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Transfers</div>
                    <div className="text-2xl font-bold text-gray-900">{sortedHistory.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Current Owner</div>
                    <div 
                      className="text-lg font-bold"
                      style={{ color: getPartyColor(asset.ownerId) }}
                    >
                      {getPartyName(asset.ownerId)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Last Transfer</div>
                    <div className="text-lg font-bold text-gray-900">
                      {sortedHistory.length > 0
                        ? format(new Date(sortedHistory[sortedHistory.length - 1].timestamp), 'MMM d, yyyy')
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

