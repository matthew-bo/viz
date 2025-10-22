import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatRWAType } from '../utils/formatters';

/**
 * RWAFlowDiagram - SVG-based visualization of transaction flow by RWA type
 * 
 * Shows:
 * - Grouped by RWA asset type
 * - Flow between parties
 * - Volume and count aggregation
 */
export const RWAFlowDiagram: React.FC = () => {
  const { getFilteredTransactions, parties } = useAppStore();
  const transactions = getFilteredTransactions();

  // Aggregate transactions by RWA type
  const rwaStats = useMemo(() => {
    const stats = new Map<string, {
      type: string;
      count: number;
      volume: number;
      committed: number;
      pending: number;
    }>();

    transactions.forEach(tx => {
      const rwaType = tx.payload.rwaType || 'cash';
      const existing = stats.get(rwaType) || {
        type: rwaType,
        count: 0,
        volume: 0,
        committed: 0,
        pending: 0
      };

      existing.count++;
      if (tx.status === 'committed') {
        existing.volume += parseFloat(tx.payload.amount);
        existing.committed++;
      } else {
        existing.pending++;
      }

      stats.set(rwaType, existing);
    });

    return Array.from(stats.values()).sort((a, b) => b.volume - a.volume);
  }, [transactions]);

  // Get color for RWA type
  const getRWAColor = (type: string): string => {
    const colors: Record<string, string> = {
      cash: '#10b981',
      corporate_bonds: '#3b82f6',
      treasury_bonds: '#6366f1',
      real_estate: '#8b5cf6',
      commodities: '#ec4899',
      private_equity: '#f59e0b',
      trade_finance: '#14b8a6'
    };
    return colors[type] || '#6b7280';
  };

  if (rwaStats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-lg font-medium">No transaction data</div>
          <div className="text-sm">Submit some transactions to see the flow visualization</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            RWA Transaction Flow
          </h2>
          <p className="text-gray-600">
            Visual breakdown by asset type • {transactions.length} total transactions
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="space-y-6">
          {rwaStats.map((stat, index) => (
            <motion.div
              key={stat.type}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Header Bar */}
              <div 
                className="px-6 py-4 flex items-center justify-between"
                style={{ 
                  backgroundColor: `${getRWAColor(stat.type)}15`,
                  borderLeft: `4px solid ${getRWAColor(stat.type)}`
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getRWAColor(stat.type) }}
                  />
                  <h3 className="text-lg font-bold text-gray-800">
                    {formatRWAType(stat.type)}
                  </h3>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500">Total</div>
                    <div className="font-semibold text-gray-800">{stat.count}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Volume</div>
                    <div className="font-semibold text-gray-800">
                      {formatCurrency(stat.volume)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Status</div>
                    <div className="font-semibold text-gray-800">
                      {stat.committed}✓ / {stat.pending}⏳
                    </div>
                  </div>
                </div>
              </div>

              {/* Flow Visualization */}
              <div className="p-6">
                <svg
                  viewBox="0 0 800 120"
                  className="w-full h-24"
                  style={{ overflow: 'visible' }}
                >
                  {/* Left: Parties Sending */}
                  <g transform="translate(50, 60)">
                    <circle cx="0" cy="0" r="30" fill={getRWAColor(stat.type)} opacity="0.2" />
                    <circle cx="0" cy="0" r="20" fill={getRWAColor(stat.type)} />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      className="text-xs font-semibold fill-white"
                    >
                      From
                    </text>
                    <text
                      x="0"
                      y="50"
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {parties.length} Parties
                    </text>
                  </g>

                  {/* Flow Line */}
                  <defs>
                    <linearGradient id={`gradient-${stat.type}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={getRWAColor(stat.type)} stopOpacity="0.3" />
                      <stop offset="50%" stopColor={getRWAColor(stat.type)} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={getRWAColor(stat.type)} stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <line
                    x1="90"
                    y1="60"
                    x2="710"
                    y2="60"
                    stroke={`url(#gradient-${stat.type})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* Animated Flow Particles */}
                  <motion.circle
                    cx="90"
                    cy="60"
                    r="4"
                    fill={getRWAColor(stat.type)}
                    initial={{ cx: 90 }}
                    animate={{ cx: 710 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />

                  {/* Center: Transaction Count */}
                  <g transform="translate(400, 60)">
                    <rect
                      x="-40"
                      y="-20"
                      width="80"
                      height="40"
                      rx="8"
                      fill="white"
                      stroke={getRWAColor(stat.type)}
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="-5"
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {stat.count}
                    </text>
                    <text
                      x="0"
                      y="10"
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      txns
                    </text>
                  </g>

                  {/* Right: Parties Receiving */}
                  <g transform="translate(750, 60)">
                    <circle cx="0" cy="0" r="30" fill={getRWAColor(stat.type)} opacity="0.2" />
                    <circle cx="0" cy="0" r="20" fill={getRWAColor(stat.type)} />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      className="text-xs font-semibold fill-white"
                    >
                      To
                    </text>
                    <text
                      x="0"
                      y="50"
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {parties.length} Parties
                    </text>
                  </g>
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rwaStats.length * 0.1 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {rwaStats.length}
            </div>
            <div className="text-sm text-gray-600">Asset Types</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {rwaStats.reduce((sum, s) => sum + s.count, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(rwaStats.reduce((sum, s) => sum + s.volume, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Volume</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

