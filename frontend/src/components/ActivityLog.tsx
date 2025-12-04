import { memo, useState, useEffect, useCallback } from 'react';
import { Download, Activity, Filter, X, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { registerLogs } from '../utils/activityLogUtils';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  category: 'user' | 'system' | 'api' | 'sse' | 'transaction';
  message: string;
  details?: Record<string, any>;
}

interface Props {
  maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 500; // Circular buffer limit to prevent memory leaks
const WARNING_THRESHOLD = 400; // Warn when approaching limit

/**
 * ActivityLog - Tracks and displays all system activity with circular buffer
 * Provides export functionality for debugging and audit trails
 * 
 * Memory Management:
 * - Automatically limits to 500 entries (circular buffer)
 * - Warns when approaching limit
 * - Old entries automatically removed
 */
function ActivityLog({ maxEntries = DEFAULT_MAX_ENTRIES }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // Add log entry with circular buffer management
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setLogs((prev) => {
      const updated = [newEntry, ...prev];
      const trimmed = updated.slice(0, maxEntries);
      
      if (!hasShownWarning && trimmed.length >= WARNING_THRESHOLD) {
        setHasShownWarning(true);
      }
      
      return trimmed;
    });
  }, [maxEntries, hasShownWarning]);

  // Expose addLog function globally for use across app
  useEffect(() => {
    (window as any).addActivityLog = addLog;
    // Register logs with utility for Header access
    registerLogs(logs, addLog);
    
    // Add initial log
    addLog({
      level: 'info',
      category: 'system',
      message: 'Activity logging initialized',
    });

    return () => {
      delete (window as any).addActivityLog;
    };
  }, [addLog, logs]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (filterCategory !== 'all' && log.category !== filterCategory) return false;
    return true;
  });

  // Export logs as JSON
  const exportLogs = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalEntries: logs.length,
      logs: logs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canton-activity-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog({
      level: 'info',
      category: 'user',
      message: `Exported ${logs.length} log entries`,
    });
  };

  // Export logs as CSV
  const exportCSV = () => {
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Details'];
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.level,
      log.category,
      log.message,
      log.details ? JSON.stringify(log.details) : '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canton-activity-log-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog({
      level: 'info',
      category: 'user',
      message: `Exported ${logs.length} log entries as CSV`,
    });
  };

  // Clear logs
  const clearLogs = () => {
    if (confirm('Clear all activity logs?')) {
      setLogs([]);
      addLog({
        level: 'info',
        category: 'system',
        message: 'Activity logs cleared',
      });
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-purple-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Activity Log</h3>
            <p className="text-sm text-gray-500">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'} tracked
              {logs.length >= WARNING_THRESHOLD && (
                <span className="ml-2 text-yellow-600 font-medium">
                  ({Math.round((logs.length / maxEntries) * 100)}% full)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && logs.length > 0 && (
            <span className="text-sm text-gray-500">
              Latest: {formatTimestamp(logs[0].timestamp)}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-200">
          {/* Controls */}
          <div className="py-4 flex flex-wrap items-center gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="user">User Actions</option>
                <option value="system">System</option>
                <option value="api">API Calls</option>
                <option value="sse">Real-time</option>
                <option value="transaction">Transactions</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Export as JSON"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={clearLogs}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                title="Clear logs"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Log Entries */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No log entries match the current filters</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start gap-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600 uppercase">
                          {log.category}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{log.message}</p>
                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            Show details
                          </summary>
                          <pre className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ActivityLog);

// Helper function to add logs from anywhere in the app
export const addActivityLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
  if (typeof window !== 'undefined' && (window as any).addActivityLog) {
    (window as any).addActivityLog(entry);
  }
};



