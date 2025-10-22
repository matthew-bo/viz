import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatRWAType } from '../utils/formatters';

/**
 * BusinessPanel - Left sidebar showing party/business cards with metrics
 * 
 * Features:
 * - Displays all parties with color coding
 * - Shows real-time transaction metrics per party
 * - Highlights selected party
 * - Click to filter transactions
 */

// Business-specific icons and styles
const BUSINESS_CONFIGS: Record<string, { icon: string; emoji: string; gradient: string }> = {
  'AssetOracle': { 
    icon: '🏛️', 
    emoji: '📊',
    gradient: 'from-blue-500/10 to-blue-600/5' 
  },
  'RetailChain': { 
    icon: '🏪', 
    emoji: '🛍️',
    gradient: 'from-purple-500/10 to-purple-600/5' 
  },
  'WholesaleFinance': { 
    icon: '🏢', 
    emoji: '💼',
    gradient: 'from-green-500/10 to-green-600/5' 
  },
  'default': { 
    icon: '🏦', 
    emoji: '💳',
    gradient: 'from-gray-500/10 to-gray-600/5' 
  }
};

// RWA type icons and colors
const RWA_CONFIGS: Record<string, { icon: string; color: string; bgColor: string }> = {
  'cash': { icon: '💵', color: 'text-green-700', bgColor: 'bg-green-100' },
  'corporate_bonds': { icon: '📈', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'treasury_bills': { icon: '💰', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'commercial_paper': { icon: '📄', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'equity': { icon: '📊', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'commodities': { icon: '🏭', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  'default': { icon: '💼', color: 'text-gray-700', bgColor: 'bg-gray-100' }
};

export const BusinessPanel: React.FC = () => {
  const { 
    parties, 
    selectedBusiness, 
    setSelectedBusiness,
    getMetricsForParty,
    transactions
  } = useAppStore();

  // Track which party's RWA portfolio is expanded
  const [expandedRWA, setExpandedRWA] = useState<string | null>(null);

  const handlePartyClick = (partyName: string) => {
    // Toggle selection: if already selected, deselect
    setSelectedBusiness(selectedBusiness === partyName ? null : partyName);
  };

  const getBusinessConfig = (displayName: string) => {
    return BUSINESS_CONFIGS[displayName] || BUSINESS_CONFIGS['default'];
  };

  const getRWAConfig = (rwaType?: string) => {
    if (!rwaType) return RWA_CONFIGS['default'];
    return RWA_CONFIGS[rwaType] || RWA_CONFIGS['default'];
  };

  // Calculate RWA breakdown for a party
  const getRWABreakdown = (partyName: string) => {
    const partyTransactions = transactions.filter(
      tx => tx.status === 'committed' && 
            (tx.senderDisplayName === partyName || tx.receiverDisplayName === partyName)
    );

    const rwaMap = new Map<string, number>();
    let totalValue = 0;

    partyTransactions.forEach(tx => {
      const amount = parseFloat(tx.payload.amount);
      const rwaType = tx.payload.rwaType || 'cash';
      
      rwaMap.set(rwaType, (rwaMap.get(rwaType) || 0) + amount);
      totalValue += amount;
    });

    const breakdown = Array.from(rwaMap.entries()).map(([type, value]) => ({
      type,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    })).sort((a, b) => b.value - a.value);

    return { breakdown, totalValue };
  };


  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Business Entities</h2>
        <p className="text-sm text-gray-500">
          {transactions.length} total transactions
        </p>
      </div>

      {/* Party Cards */}
      <div className="space-y-3">
        {parties.map((party, index) => {
          const metrics = getMetricsForParty(party.displayName);
          const isSelected = selectedBusiness === party.displayName;
          const config = getBusinessConfig(party.displayName);
          const hasActivity = metrics.sent > 0 || metrics.received > 0;

          return (
            <motion.div
              key={party.displayName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePartyClick(party.displayName)}
              className={`
                relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all
                ${isSelected 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`} />
              
              {/* Content */}
              <div className="relative p-4">
                {/* Header: Icon + Name + Activity Pulse */}
                <div className="flex items-start gap-3 mb-4">
                  {/* Large Icon Circle */}
                  <div 
                    className="relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                    style={{ 
                      backgroundColor: party.color,
                      boxShadow: `0 4px 12px ${party.color}40`
                    }}
                  >
                    {config.icon}
                    {/* Activity Pulse */}
                    {hasActivity && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </div>

                  {/* Name + Color Dot */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                      {party.displayName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: party.color }}
                      />
                      <span className="text-xs text-gray-500 font-medium">
                        Party ID: {party.partyId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Emoji Badge */}
                  <div className="flex-shrink-0 text-xl opacity-60">
                    {config.emoji}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Sent */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/50">
                    <div className="text-gray-500 text-xs font-medium mb-0.5 flex items-center gap-1">
                      <span>📤</span>
                      <span>Sent</span>
                    </div>
                    <div className="font-bold text-gray-900 text-lg">
                      {metrics.sent}
                    </div>
                  </div>

                  {/* Received */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/50">
                    <div className="text-gray-500 text-xs font-medium mb-0.5 flex items-center gap-1">
                      <span>📥</span>
                      <span>Received</span>
                    </div>
                    <div className="font-bold text-gray-900 text-lg">
                      {metrics.received}
                    </div>
                  </div>

                  {/* Total Volume - Full Width */}
                  <div className="col-span-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                    <div className="text-gray-600 text-xs font-semibold mb-1 flex items-center gap-1">
                      <span>💰</span>
                      <span>Total Volume</span>
                    </div>
                    <div className="font-extrabold text-gray-900 text-xl">
                      {formatCurrency(metrics.volume)}
                    </div>
                  </div>
                </div>

                {/* RWA Portfolio Section */}
                {(() => {
                  const { breakdown, totalValue } = getRWABreakdown(party.displayName);
                  const isExpanded = expandedRWA === party.displayName;
                  const hasRWA = breakdown.length > 0 && totalValue > 0;

                  if (!hasRWA) return null;

                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRWA(isExpanded ? null : party.displayName);
                        }}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span>📊</span>
                          <span>Asset Portfolio</span>
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 space-y-2 overflow-hidden"
                          >
                            {breakdown.map((rwa) => {
                              const rwaConfig = getRWAConfig(rwa.type);
                              return (
                                <div key={rwa.type} className="bg-white/60 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/50">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{rwaConfig.icon}</span>
                                      <span className="text-xs font-medium text-gray-700">
                                        {formatRWAType(rwa.type)}
                                      </span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${rwaConfig.bgColor} ${rwaConfig.color}`}>
                                      {rwa.percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1.5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${rwa.percentage}%` }}
                                      transition={{ duration: 0.5, delay: 0.1 }}
                                      className={`h-full rounded-full ${rwaConfig.bgColor.replace('100', '500')}`}
                                    />
                                  </div>
                                  <div className="text-xs font-bold text-gray-900">
                                    {formatCurrency(rwa.value)}
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  layoutId="selectedParty"
                  className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Clear Filter Button */}
      {selectedBusiness && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setSelectedBusiness(null)}
          className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 
                     rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
        >
          Clear Filter
        </motion.button>
      )}
    </div>
  );
};

