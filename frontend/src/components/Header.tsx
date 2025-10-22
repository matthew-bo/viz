import { memo, useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Hexagon, Plus, ChevronDown, FileJson, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportLogsAsJSON, exportLogsAsCSV } from '../utils/activityLogUtils';
import { useAppStore } from '../store/useAppStore';

interface Props {
  isConnected: boolean;
  onCreateClick: () => void;
}

/**
 * Header - App header with branding, CREATE button, and health status
 */
function Header({ isConnected, onCreateClick }: Props) {
  const [showHealthDropdown, setShowHealthDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { transactions, parties } = useAppStore();

  const healthItems = [
    { label: 'Backend API', status: 'healthy', url: '/health' },
    { label: 'Canton Network', status: isConnected ? 'healthy' : 'connecting', url: null },
    { label: 'SSE Stream', status: isConnected ? 'connected' : 'disconnected', url: null }
  ];

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

  return (
    <header className="bg-gradient-to-r from-canton-dark via-canton-dark-light to-canton-dark text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-canton-blue p-2 rounded-lg">
              <Hexagon className="w-6 h-6" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Canton Privacy Blockchain
              </h1>
              <p className="text-sm text-gray-300">
                Multi-Party Privacy-Preserving Transactions
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* CREATE Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                       rounded-lg font-semibold transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              CREATE
            </motion.button>

            {/* Health Status Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowHealthDropdown(!showHealthDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 
                         rounded-lg transition-colors"
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl 
                             border border-gray-200 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <div className="font-semibold text-gray-800 text-sm">System Health</div>
                    </div>
                    
                    {/* Health Status */}
                    <div className="p-2 border-b border-gray-200">
                      {healthItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <span className={`
                            text-xs font-medium px-2 py-1 rounded-full
                            ${item.status === 'healthy' || item.status === 'connected'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }
                          `}>
                            {item.status}
                          </span>
                        </div>
                      ))}
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
  );
}

export default memo(Header);

