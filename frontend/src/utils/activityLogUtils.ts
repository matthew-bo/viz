/**
 * Activity Log Utilities
 * Provides shared access to activity logs across components
 */

import { LogEntry } from '../components/ActivityLog';

// Global log storage (accessible across components)
let globalLogs: LogEntry[] = [];
let globalAddLog: ((entry: Omit<LogEntry, 'id' | 'timestamp'>) => void) | null = null;

/**
 * Store logs globally so they can be accessed from Header for export
 */
export function registerLogs(logs: LogEntry[], addLogFn: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void) {
  globalLogs = logs;
  globalAddLog = addLogFn;
}

/**
 * Get current logs for export
 */
export function getLogs(): LogEntry[] {
  return globalLogs;
}

/**
 * Export logs as JSON
 */
export function exportLogsAsJSON() {
  const logs = getLogs();
  
  const data = {
    exportDate: new Date().toISOString(),
    totalEntries: logs.length,
    application: 'Canton Privacy Blockchain Visualizer',
    logs: logs.map((log) => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
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

  // Log the export action
  if (globalAddLog) {
    globalAddLog({
      level: 'info',
      category: 'user',
      message: `Exported ${logs.length} log entries as JSON`,
    });
  }

  return logs.length;
}

/**
 * Export logs as CSV (Excel-compatible)
 */
export function exportLogsAsCSV() {
  const logs = getLogs();
  
  const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Details'];
  const rows = logs.map((log) => [
    log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
    log.level,
    log.category,
    log.message,
    log.details ? JSON.stringify(log.details) : '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `canton-activity-log-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Log the export action
  if (globalAddLog) {
    globalAddLog({
      level: 'info',
      category: 'user',
      message: `Exported ${logs.length} log entries as CSV`,
    });
  }

  return logs.length;
}

/**
 * Get log statistics for display in Header
 */
export function getLogStats() {
  const logs = getLogs();
  return {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warning').length,
    success: logs.filter(l => l.level === 'success').length,
    info: logs.filter(l => l.level === 'info').length,
  };
}

