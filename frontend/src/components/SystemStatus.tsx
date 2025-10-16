import { memo, useState, useEffect } from 'react';
import { Activity, Database, Wifi, Clock, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';

interface Props {
  isConnected: boolean;
  partyCount: number;
  transactionCount: number;
  lastUpdateTime?: Date;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  message: string;
}

/**
 * SystemStatus - Expandable system health panel
 * Shows backend health, SSE status, Canton network, and activity
 */
function SystemStatus({ isConnected, partyCount, transactionCount, lastUpdateTime }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [backendHealth, setBackendHealth] = useState<HealthStatus>({ 
    status: 'healthy', 
    message: 'Checking...' 
  });

  // Check backend health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.healthCheck();
        setBackendHealth({ status: 'healthy', message: 'Operational' });
      } catch (error) {
        setBackendHealth({ status: 'down', message: 'Unavailable' });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Every 60 seconds (reduced to prevent connection leak)
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
    }
  };

  const StatusIcon = backendHealth.status === 'healthy' ? CheckCircle : AlertCircle;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className={`w-5 h-5 ${backendHealth.status === 'healthy' ? 'text-green-500' : 'text-red-500'}`} />
          <span className="font-medium text-gray-900">System Status</span>
          {!isExpanded && (
            <span className={`text-sm px-2 py-1 rounded-full ${
              backendHealth.status === 'healthy' && isConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {backendHealth.status === 'healthy' && isConnected ? 'All Systems Operational' : 'Check Status'}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Backend API Status */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Database className={`w-5 h-5 mt-0.5 ${getStatusColor(backendHealth.status)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">Backend API</p>
                  <StatusIcon className={`w-4 h-4 ${getStatusColor(backendHealth.status)}`} />
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{backendHealth.message}</p>
              </div>
            </div>

            {/* Real-time Connection */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Wifi className={`w-5 h-5 mt-0.5 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">Real-time Updates</p>
                  {isConnected ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isConnected ? 'Connected (SSE)' : 'Connecting...'}
                </p>
              </div>
            </div>

            {/* Canton Network */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Activity className={`w-5 h-5 mt-0.5 ${partyCount === 3 ? 'text-green-500' : 'text-yellow-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">Canton Network</p>
                  {partyCount === 3 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {partyCount} {partyCount === 1 ? 'participant' : 'participants'} active
                </p>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Clock className="w-5 h-5 mt-0.5 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Activity</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
                </p>
                {lastUpdateTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {getRelativeTime(lastUpdateTime)}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Privacy Indicator */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Privacy-Preserving Network</p>
                <p className="text-xs text-blue-700 mt-1">
                  Canton enforces transaction privacy at the ledger level. Only involved parties can see their transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return date.toLocaleString();
}

export default memo(SystemStatus);

