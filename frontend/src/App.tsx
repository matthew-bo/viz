import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Transaction, ExchangeOffer } from './types';
import { apiClient } from './api/client';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { useAppStore } from './store/useAppStore';
import { addActivityLog } from './components/ActivityLog';
import Header from './components/Header';
import { ActiveFiltersBanner } from './components/ActiveFiltersBanner';
import { ResizableLayout } from './components/ResizableLayout';
import { BusinessPanel } from './components/BusinessPanel';
import { SynchronizerFooter } from './components/SynchronizerFooter';
import { MainContent } from './components/MainContent';
import { CreateExchangeModal } from './components/CreateExchangeModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { ConfettiEffect } from './components/ConfettiEffect';
import { exchangeToTransaction } from './utils/exchangeAdapter';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Main App Component - Redesigned with Resizable Layout & Zustand
 * 
 * New Architecture:
 * - Zustand for global state management
 * - Resizable panel layout
 * - Modal-based transaction creation
 * - Real-time SSE updates
 */
function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  
  // Keyboard shortcuts
  const { registerShortcut, shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts();
  
  // Zustand store
  const {
    transactions,
    connectionStatus,
    setTransactions,
    setParties,
    setSelectedBusiness,
    setSelectedRWA,
    setConnectionStatus,
    addOrUpdateTransaction,
    setSelectedTransaction,
    selectedBusiness
  } = useAppStore();
  
  // Toast notifications
  const { toasts, toast, removeToast } = useToast();

  // Load initial data (parties, transactions, and exchanges)
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Clear any stale filters from previous session
        setSelectedBusiness(null);
        setSelectedRWA(null);
        
        // Load parties (always needed)
        const partiesList = await apiClient.getParties();
        setParties(partiesList);
        
        // Load transactions and exchanges in parallel
        const allTransactions: Transaction[] = [];
        
        // Try to load Canton transactions (may not exist)
        try {
          const txList = await apiClient.getTransactions({ limit: 100 });
          allTransactions.push(...txList);
        } catch {
          // No Canton contracts deployed - expected for exchange-only mode
        }
        
        // Load exchanges and convert to transaction format
        try {
          const { exchangesToTransactions } = await import('./utils/exchangeAdapter');
          const exchanges = await apiClient.getExchanges();
          const exchangeTxs = exchangesToTransactions(exchanges);
          allTransactions.push(...exchangeTxs);
        } catch {
          // Failed to load exchanges - continue without them
        }
        
        setTransactions(allTransactions);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to connect to backend';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [setParties, setTransactions, setSelectedBusiness, setSelectedRWA]);

  // Establish SSE connection for real-time updates with reconnection recovery
  useEffect(() => {
    let lastEventTime = Date.now();
    let isReconnecting = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    const eventSource = new EventSource(`${API_BASE}/api/events`);

    // Fallback polling when disconnected
    const startPolling = () => {
      if (pollInterval) return;
      
      pollInterval = setInterval(async () => {
        try {
          const [txs, exchanges] = await Promise.all([
            apiClient.getTransactions({ limit: 50 }).catch(() => []),
            apiClient.getExchanges().catch(() => [])
          ]);
          
          txs.forEach(tx => addOrUpdateTransaction(tx));
          
          if (exchanges.length > 0) {
            import('./utils/exchangeAdapter').then(({ exchangesToTransactions }) => {
              const exchangeTxs = exchangesToTransactions(exchanges);
              exchangeTxs.forEach(tx => addOrUpdateTransaction(tx));
            });
          }
        } catch {
          // Polling failed - will retry on next interval
        }
      }, 30000);
    };
    
    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    eventSource.onopen = async () => {
      setConnectionStatus('connected');
      setError(null);
      stopPolling();
      
      if (isReconnecting) {
        addActivityLog({
          level: 'info',
          category: 'sse',
          message: 'Reconnected - recovering missed events',
          details: { lastEventTime: new Date(lastEventTime).toISOString() },
        });
        
        try {
          const [txs, exchanges] = await Promise.all([
            apiClient.getTransactions({ limit: 100 }),
            apiClient.getExchanges()
          ]);
          
          const recentTxs = txs.filter(tx => 
            new Date(tx.recordTime).getTime() > lastEventTime - 60000
          );
          
          recentTxs.forEach(tx => addOrUpdateTransaction(tx));
          
          if (exchanges.length > 0) {
            import('./utils/exchangeAdapter').then(({ exchangesToTransactions }) => {
              const exchangeTxs = exchangesToTransactions(exchanges);
              const recentExchanges = exchangeTxs.filter(tx =>
                new Date(tx.recordTime).getTime() > lastEventTime - 60000
              );
              recentExchanges.forEach(tx => addOrUpdateTransaction(tx));
            });
          }
          
          const totalRecovered = recentTxs.length;
          if (totalRecovered > 0) {
            toast.success(`Reconnected. Loaded ${totalRecovered} missed update${totalRecovered > 1 ? 's' : ''}.`);
            addActivityLog({
              level: 'success',
              category: 'sse',
              message: `Recovered ${totalRecovered} missed events`,
            });
          } else {
            toast.success('Reconnected to Canton Network');
          }
        } catch {
          toast.info('Reconnected, but some updates may have been missed. Refresh to sync.');
        }
        
        isReconnecting = false;
      } else {
        toast.success('Connected to Canton Network');
        addActivityLog({
          level: 'success',
          category: 'sse',
          message: 'Real-time connection established',
          details: { endpoint: `${API_BASE}/api/events` },
        });
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        lastEventTime = Date.now();

        if (message.type === 'connected') {
          return;
        }

        if (message.type === 'transaction') {
          const tx = message.data as Transaction;
          
          addActivityLog({
            level: 'info',
            category: 'transaction',
            message: `Transaction ${tx.status}: ${tx.senderDisplayName} → ${tx.receiverDisplayName}`,
            details: {
              contractId: tx.contractId,
              status: tx.status,
              amount: tx.payload.amount,
              currency: tx.payload.currency,
            },
          });
          
          // Trigger confetti on status change to committed
          const existingTx = transactions.find(t => t.contractId === tx.contractId);
          if (existingTx?.status === 'pending' && tx.status === 'committed') {
            setTriggerConfetti(true);
            setTimeout(() => setTriggerConfetti(false), 100);
          }
          
          addOrUpdateTransaction(tx);
        }
        
        if (message.type === 'exchange') {
          import('./utils/exchangeAdapter').then(({ exchangeToTransaction }) => {
            const exchange = message.data;
            const tx = exchangeToTransaction(exchange);
            
            addActivityLog({
              level: 'info',
              category: 'transaction',
              message: `Exchange ${tx.status}: ${tx.senderDisplayName} ↔ ${tx.receiverDisplayName}`,
              details: {
                exchangeId: exchange.id,
                status: exchange.status,
              },
            });
            
            addOrUpdateTransaction(tx);
            
            if (exchange.status === 'pending') {
              toast.success('New exchange proposal created!');
            } else if (exchange.status === 'accepted') {
              toast.success('Exchange accepted and completed!');
              setTriggerConfetti(true);
              setTimeout(() => setTriggerConfetti(false), 100);
            }
          });
        }
      } catch {
        // Failed to parse SSE message
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      isReconnecting = true;
      
      addActivityLog({
        level: 'warning',
        category: 'sse',
        message: 'Connection lost - attempting to reconnect',
      });
      
      toast.error('Connection lost. Attempting to reconnect...');
      startPolling();
    };

    return () => {
      stopPolling();
      eventSource.close();
    };
  }, []);

  // Register keyboard shortcuts
  useEffect(() => {
    // Ctrl+N: Open create modal
    registerShortcut({
      key: 'n',
      ctrl: true,
      description: 'Create new transaction',
      action: () => setIsCreateModalOpen(true),
      category: 'actions'
    });

    // Escape: Close modals
    registerShortcut({
      key: 'Escape',
      description: 'Close modal or clear selection',
      action: () => {
        setIsCreateModalOpen(false);
        setSelectedTransaction(null);
      },
      category: 'navigation'
    });

    // Ctrl+B: Toggle business panel
    registerShortcut({
      key: 'b',
      ctrl: true,
      description: 'Toggle business panel',
      action: () => {
        if (selectedBusiness) {
          setSelectedBusiness(null);
          toast.info('Business filter cleared');
        }
      },
      category: 'navigation'
    });

    // Ctrl+/: Show shortcuts help
    registerShortcut({
      key: '/',
      ctrl: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(true),
      category: 'general'
    });

    addActivityLog({
      level: 'info',
      category: 'system',
      message: 'Keyboard shortcuts registered',
      details: { count: 4 }
    });
  }, []); // Register shortcuts only once on mount - don't include registerShortcut to avoid infinite loop

  // Handle form submission
  const handleExchangeSubmit = async (data: {
    fromParty: string;
    toParty: string;
    offering: ExchangeOffer;
    requesting: ExchangeOffer;
    description?: string;
  }) => {
    try {
      addActivityLog({
        level: 'info',
        category: 'user',
        message: `Creating exchange: ${data.fromParty} ↔ ${data.toParty}`,
        details: {
          offering: data.offering,
          requesting: data.requesting,
          description: data.description,
        },
      });
      
      const exchange = await apiClient.createExchange(data);
      toast.success('Exchange proposal created successfully');
      
      const transactionView = exchangeToTransaction(exchange);
      setSelectedTransaction(transactionView);
      addOrUpdateTransaction(transactionView);
      
      addActivityLog({
        level: 'success',
        category: 'user',
        message: 'Exchange created and timeline opened',
        details: { exchangeId: exchange.id },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create exchange';
      toast.error(message);
      throw err;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Canton Network...
          </h2>
          <p className="text-gray-600">Connecting to blockchain nodes</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && connectionStatus === 'disconnected' && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">Troubleshooting:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Ensure backend is running on port 3001</li>
                <li>Check Canton containers are healthy</li>
                <li>Verify VITE_API_URL in .env</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main app with new layout
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Header */}
      <Header 
        isConnected={connectionStatus === 'connected'} 
        onCreateClick={() => setIsCreateModalOpen(true)}
      />

      {/* Active Filters Banner */}
      <ActiveFiltersBanner />

      {/* Main Resizable Layout */}
      <ResizableLayout
        leftPanel={<BusinessPanel />}
        mainContent={<MainContent />}
        footer={<SynchronizerFooter />}
      />

      {/* Create Exchange Modal */}
      <CreateExchangeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleExchangeSubmit}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Confetti Effect on Transaction Acceptance */}
      <ConfettiEffect trigger={triggerConfetti} />

    </div>
  );
}

export default App;

