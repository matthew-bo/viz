import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, DollarSign, Users, Clock, ArrowRight, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';
import { format, subDays, differenceInHours } from 'date-fns';

interface Props {
  selectedParty?: string | null;
}

/**
 * MetricsDashboard - Comprehensive analytics for transaction and exchange activity
 * 
 * Shows:
 * - Network-wide metrics (default)
 * - Party-specific metrics (when party selected)
 * - Visual charts and graphs
 * - Real-time statistics
 */
export const MetricsDashboard: React.FC<Props> = ({ selectedParty }) => {
  const { transactions, parties } = useAppStore();

  // Calculate metrics
  const metrics = useMemo(() => {
    // Filter transactions by selected party if applicable
    const filteredTxs = selectedParty
      ? transactions.filter(tx => 
          tx.senderDisplayName === selectedParty || tx.receiverDisplayName === selectedParty
        )
      : transactions;

    const totalVolume = filteredTxs.reduce((sum, tx) => sum + parseFloat(tx.payload.amount || '0'), 0);
    const totalCount = filteredTxs.length;
    const pendingCount = filteredTxs.filter(tx => tx.status === 'pending').length;
    const committedCount = filteredTxs.filter(tx => tx.status === 'committed').length;
    const avgValue = totalCount > 0 ? totalVolume / totalCount : 0;

    // Calculate average commitment time (for committed transactions)
    const committedTxs = filteredTxs.filter(tx => tx.status === 'committed' && tx.payload.submittedAt && tx.payload.committedAt);
    const avgCommitTime = committedTxs.length > 0
      ? committedTxs.reduce((sum, tx) => {
          const submitted = new Date(tx.payload.submittedAt!);
          const committed = new Date(tx.payload.committedAt!);
          return sum + differenceInHours(committed, submitted);
        }, 0) / committedTxs.length
      : 0;

    // RWA type distribution
    const rwaDistribution = filteredTxs.reduce((acc, tx) => {
      const type = tx.payload.rwaType || 'cash';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Party activity (for network view)
    const partyActivity = parties.map(party => {
      const sent = transactions.filter(tx => tx.senderDisplayName === party.displayName).length;
      const received = transactions.filter(tx => tx.receiverDisplayName === party.displayName).length;
      const totalValue = transactions
        .filter(tx => tx.senderDisplayName === party.displayName || tx.receiverDisplayName === party.displayName)
        .reduce((sum, tx) => sum + parseFloat(tx.payload.amount || '0'), 0);
      
      return {
        name: party.displayName,
        color: party.color,
        sent,
        received,
        total: sent + received,
        totalValue
      };
    }).sort((a, b) => b.total - a.total);

    // Daily activity (last 7 days)
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayTxs = filteredTxs.filter(tx => {
        const txDate = new Date(tx.payload.submittedAt || tx.recordTime);
        return format(txDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      
      return {
        date: format(date, 'MMM dd'),
        count: dayTxs.length,
        volume: dayTxs.reduce((sum, tx) => sum + parseFloat(tx.payload.amount || '0'), 0)
      };
    });

    // Inter-party flow matrix (top flows)
    const flows: Record<string, { from: string; to: string; count: number; volume: number; fromColor: string; toColor: string }> = {};
    filteredTxs.forEach(tx => {
      const key = `${tx.senderDisplayName}->${tx.receiverDisplayName}`;
      if (!flows[key]) {
        const fromParty = parties.find(p => p.displayName === tx.senderDisplayName);
        const toParty = parties.find(p => p.displayName === tx.receiverDisplayName);
        flows[key] = {
          from: tx.senderDisplayName,
          to: tx.receiverDisplayName,
          count: 0,
          volume: 0,
          fromColor: fromParty?.color || '#666',
          toColor: toParty?.color || '#666'
        };
      }
      flows[key].count++;
      flows[key].volume += parseFloat(tx.payload.amount || '0');
    });
    const topFlows = Object.values(flows).sort((a, b) => b.volume - a.volume).slice(0, 5);

    return {
      totalVolume,
      totalCount,
      pendingCount,
      committedCount,
      avgValue,
      avgCommitTime,
      rwaDistribution,
      partyActivity,
      dailyActivity,
      topFlows
    };
  }, [transactions, parties, selectedParty]);

  // Calculate trends (compare with previous period)
  const volumeTrend = 12.5; // Mock for now - could calculate from historical data
  const activityTrend = 8.3;

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              {selectedParty ? `${selectedParty} Metrics` : 'Network Metrics'}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedParty 
                ? `Detailed analytics for ${selectedParty}`
                : 'Real-time analytics across the entire Canton network'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Last Updated</div>
            <div className="text-lg font-semibold text-gray-900">{format(new Date(), 'h:mm a')}</div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Volume */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+{volumeTrend}%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.totalVolume)}
            </div>
            <div className="text-sm text-gray-500">Total Volume</div>
          </motion.div>

          {/* Transaction Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <TrendingUp className="w-4 h-4" />
                <span>+{activityTrend}%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.totalCount}
            </div>
            <div className="text-sm text-gray-500">Total Transactions</div>
          </motion.div>

          {/* Average Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.avgValue)}
            </div>
            <div className="text-sm text-gray-500">Average Transaction</div>
          </motion.div>

          {/* Avg Commit Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.avgCommitTime.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-500">Avg Commit Time</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-700">Committed</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 font-semibold">{metrics.committedCount}</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${metrics.totalCount > 0 ? (metrics.committedCount / metrics.totalCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {metrics.totalCount > 0 ? Math.round((metrics.committedCount / metrics.totalCount) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-700">Pending</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 font-semibold">{metrics.pendingCount}</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full transition-all"
                      style={{ width: `${metrics.totalCount > 0 ? (metrics.pendingCount / metrics.totalCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {metrics.totalCount > 0 ? Math.round((metrics.pendingCount / metrics.totalCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RWA Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Asset Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(metrics.rwaDistribution).map(([type, count], idx) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][idx % 5]
                      }}
                    ></div>
                    <span className="text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-semibold">{count}</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${metrics.totalCount > 0 ? (count / metrics.totalCount) * 100 : 0}%`,
                          backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][idx % 5]
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {metrics.totalCount > 0 ? Math.round((count / metrics.totalCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Daily Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Activity Trend</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {metrics.dailyActivity.map((day, idx) => {
              const maxCount = Math.max(...metrics.dailyActivity.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.7 + idx * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg relative group cursor-pointer"
                    style={{ minHeight: day.count > 0 ? '8px' : '2px' }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {day.count} txs
                      <br />
                      {formatCurrency(day.volume)}
                    </div>
                  </motion.div>
                  <div className="text-xs text-gray-600 font-medium">{day.date}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Transaction Flows */}
        {!selectedParty && metrics.topFlows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Transaction Flows</h3>
            <div className="space-y-3">
              {metrics.topFlows.map((flow, idx) => (
                <div key={`${flow.from}-${flow.to}`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 font-mono text-sm">#{idx + 1}</div>
                  <div className="flex items-center gap-2 flex-1">
                    <span 
                      className="font-semibold"
                      style={{ color: flow.fromColor }}
                    >
                      {flow.from}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span 
                      className="font-semibold"
                      style={{ color: flow.toColor }}
                    >
                      {flow.to}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(flow.volume)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {flow.count} {flow.count === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Party Activity Rankings (Network view only) */}
        {!selectedParty && metrics.partyActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Party Activity Rankings
            </h3>
            <div className="space-y-3">
              {metrics.partyActivity.map((party, idx) => (
                <div key={party.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="text-2xl font-bold text-gray-300">#{idx + 1}</div>
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md"
                    style={{ 
                      backgroundColor: party.color,
                      boxShadow: `0 4px 12px ${party.color}40`
                    }}
                  >
                    {party.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900" style={{ color: party.color }}>
                      {party.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {party.sent} sent · {party.received} received
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {party.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(party.totalValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

