import { memo, useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Hexagon, Plus, ChevronDown, FileJson, FileSpreadsheet, CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportLogsAsJSON, exportLogsAsCSV } from '../utils/activityLogUtils';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { useIsMobile, useIsSmallMobile } from '../hooks/useMediaQuery';

interface Props {
  isConnected: boolean;
  onCreateClick: () => void;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    api: { status: string; message: string };
    canton: { status: string; message: string };
    inventory: { status: string; message: string };
    exchanges: { status: string; message: string };
  };
}

/**
 * Header - App header with branding, CREATE button, and enhanced health monitoring
 */
function Header({ isConnected, onCreateClick }: Props) {
  const [showHealthDropdown, setShowHealthDropdown] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { transactions, parties } = useAppStore();

  // Fetch health data periodically
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const health = await apiClient.healthCheck();
        setHealthData(health);
      } catch (error) {
        setHealthData({
          status: 'down',
          services: {
            api: { status: 'down', message: 'Backend unreachable' },
            canton: { status: 'unknown', message: 'Not checked' },
            inventory: { status: 'unknown', message: 'Not checked' },
            exchanges: { status: 'unknown', message: 'Not checked' },
          }
        });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    committed: transactions.filter(t => t.status === 'committed').length,
    participants: parties.length,
  };

  const handleDownloadJSON = () => {
    const count = exportLogsAsJSON();
    console.log(`Downloaded ${count} log entries as JSON`);
    setShowHealthDropdown(false);
  };

  const handleDownloadCSV = () => {
    const count = exportLogsAsCSV();
    console.log(`Downloaded ${count} log entries as CSV`);
    setShowHealthDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHealthDropdown(false);
      }
    };

    if (showHealthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHealthDropdown]);

  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

  return (
    <>
      <header className="bg-gradient-to-r from-canton-dark via-canton-dark-light to-canton-dark text-white shadow-lg sticky top-0 z-50"
              style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}>
        <div className="container mx-auto px-3 lg:px-4 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Branding */}
            <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
              <div className="bg-canton-blue p-1.5 lg:p-2 rounded-lg flex-shrink-0">
                <Hexagon className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base lg:text-xl font-bold tracking-tight truncate">
                  {isSmallMobile ? 'Canton' : 'Canton Privacy Blockchain'}
                </h1>
                {!isSmallMobile && (
                  <p className="text-xs lg:text-sm text-gray-300 truncate">
                    {isMobile ? 'Privacy-Preserving Blockchain' : 'Multi-Party Privacy-Preserving Transactions'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              {/* CREATE Button - Desktop only (Mobile uses FAB) */}
              {!isMobile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCreateClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                           rounded-lg font-semibold transition-colors shadow-lg min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  CREATE
                </motion.button>
              )}

            {/* Health Status Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowHealthDropdown(!showHealthDropdown)}
                className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 bg-white/10 hover:bg-white/20 
                         rounded-lg transition-colors min-h-[44px]"
                aria-label="System health status"
              >
                {isConnected ? (
                  <>
                    <div className="relative">
                      <Wifi className="w-5 h-5 text-green-400" aria-hidden="true" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></span>
                    </div>
                    <span className="text-sm font-medium text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-gray-400 animate-pulse" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-400">Connecting...</span>
                  </>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showHealthDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showHealthDropdown && (
                  <motion.div
                    initial={isMobile ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={isMobile ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`${
                      isMobile 
                        ? 'fixed inset-x-0 top-0 bottom-0 z-50 bg-white overflow-y-auto'
                        : 'absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden'
                    }`}
                    style={isMobile ? { 
                      marginTop: 'max(env(safe-area-inset-top), 0px)',
                      paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
                    } : {}}
                  >
                    {/* Header */}
                    <div className={`p-3 bg-gray-50 border-b border-gray-200 ${isMobile ? 'flex items-center justify-between' : ''}`}>
                      <div className="font-semibold text-gray-800 text-sm">System Health</div>
                      {isMobile && (
                        <button
                          onClick={() => setShowHealthDropdown(false)}
                          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5 text-gray-600" />
                        </button>
                      )}
                    </div>
                    
                    {/* Detailed Health Status */}
                    <div className="p-2 border-b border-gray-200">
                      {healthData && (
                        <>
                          {/* Backend API */}
                          <HealthStatusRow
                            label="Backend API"
                            status={healthData.services.api.status}
                            message={healthData.services.api.message}
                          />
                          {/* Canton Network */}
                          <HealthStatusRow
                            label="Canton Network"
                            status={healthData.services.canton.status}
                            message={healthData.services.canton.message}
                          />
                          {/* Inventory Service */}
                          <HealthStatusRow
                            label="Inventory Service"
                            status={healthData.services.inventory.status}
                            message={healthData.services.inventory.message}
                          />
                          {/* Exchange Service */}
                          <HealthStatusRow
                            label="Exchange Service"
                            status={healthData.services.exchanges.status}
                            message={healthData.services.exchanges.message}
                          />
                          {/* SSE Stream */}
                          <HealthStatusRow
                            label="SSE Stream"
                            status={isConnected ? 'healthy' : 'down'}
                            message={isConnected ? 'Real-time updates active' : 'Reconnecting...'}
                          />
                        </>
                      )}
                      {!healthData && (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading health status...</div>
                      )}
                    </div>

                    {/* Statistics */}
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <div className="font-semibold text-gray-800 text-sm mb-2">Network Statistics</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded p-2 border border-gray-200">
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                        </div>
                        <div className="bg-white rounded p-2 border border-gray-200">
                          <div className="text-xs text-gray-500">Pending</div>
                          <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                        </div>
                        <div className="bg-white rounded p-2 border border-gray-200">
                          <div className="text-xs text-gray-500">Committed</div>
                          <div className="text-lg font-bold text-green-600">{stats.committed}</div>
                        </div>
                        <div className="bg-white rounded p-2 border border-gray-200">
                          <div className="text-xs text-gray-500">Participants</div>
                          <div className="text-lg font-bold text-blue-600">{stats.participants}</div>
                        </div>
                      </div>
                    </div>

                    {/* Activity Log Export */}
                    <div className="p-3 bg-gray-50">
                      <div className="font-semibold text-gray-800 text-sm mb-2">Activity Log Export</div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownloadJSON}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 
                                   hover:bg-blue-700 text-white rounded-lg text-sm font-medium 
                                   transition-colors"
                        >
                          <FileJson className="w-4 h-4" />
                          JSON
                        </button>
                        <button
                          onClick={handleDownloadCSV}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 
                                   hover:bg-green-700 text-white rounded-lg text-sm font-medium 
                                   transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          CSV
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        Download complete activity logs for debugging
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Mobile FAB - Floating Action Button */}
      {isMobile && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCreateClick}
          className="fixed right-4 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 
                   rounded-full shadow-2xl flex items-center justify-center text-white
                   focus:outline-none focus:ring-4 focus:ring-blue-400"
          style={{ 
            bottom: 'calc(5rem + max(env(safe-area-inset-bottom), 0.5rem))' 
          }}
          aria-label="Create new transaction"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}
    </>
  );
}

/**
 * HealthStatusRow - Helper component for displaying individual service health
 */
function HealthStatusRow({ label, status, message }: { label: string; status: string; message: string }) {
  const getStatusIcon = () => {
    if (status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'degraded') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    if (status === 'down') return <XCircle className="w-4 h-4 text-red-600" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />; // unknown
  };

  const getStatusColor = () => {
    if (status === 'healthy') return 'bg-green-100 text-green-700';
    if (status === 'degraded') return 'bg-yellow-100 text-yellow-700';
    if (status === 'down') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600'; // unknown
  };

  return (
    <div className="flex items-start justify-between px-3 py-2 hover:bg-gray-50 rounded">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-xs text-gray-500 mt-0.5 block">{message}</span>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${getStatusColor()}`}>
        {status}
      </span>
    </div>
  );
}

export default memo(Header);

