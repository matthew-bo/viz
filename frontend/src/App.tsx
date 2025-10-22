import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Transaction } from './types';
import { apiClient } from './api/client';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { useAppStore } from './store/useAppStore';
import { addActivityLog } from './components/ActivityLog';
import Header from './components/Header';
import { ResizableLayout } from './components/ResizableLayout';
import { BusinessPanel } from './components/BusinessPanel';
import { SynchronizerFooter } from './components/SynchronizerFooter';
import { MainContent } from './components/MainContent';
import { CreateModal } from './components/CreateModal';

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
  const [pendingSubmission, setPendingSubmission] = useState<{ sender: string; receiver: string; amount: number } | null>(null);
  
  // Use ref so SSE handler can access latest pendingSubmission value
  const pendingSubmissionRef = useRef<{ sender: string; receiver: string; amount: number } | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    pendingSubmissionRef.current = pendingSubmission;
  }, [pendingSubmission]);
  
  // Zustand store
  const {
    transactions,
    connectionStatus,
    setTransactions,
    setParties,
    setConnectionStatus,
    setSelectedTransaction,
    addOrUpdateTransaction
  } = useAppStore();
  
  // Toast notifications
  const { toasts, toast, removeToast } = useToast();

  // Load initial data (parties and transactions)
  useEffect(() => {
    async function loadInitialData() {
      try {
        console.log('Loading initial data...');
        
        const [partiesList, txList] = await Promise.all([
          apiClient.getParties(),
          apiClient.getTransactions({ limit: 100 }) // Increased limit for demo data
        ]);
        
        console.log('Loaded parties:', partiesList);
        console.log('Loaded transactions:', txList);
        
        setParties(partiesList);
        setTransactions(txList);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
        setError(err.message || 'Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [setParties, setTransactions]);

  // Establish SSE connection for real-time updates
  useEffect(() => {
    console.log('Establishing SSE connection...');
    
    const eventSource = new EventSource(`${API_BASE}/api/events`);

    eventSource.onopen = () => {
      console.log('✓ SSE connected');
      setConnectionStatus('connected');
      setError(null);
      toast.success('Connected to Canton Network');
      addActivityLog({
        level: 'success',
        category: 'sse',
        message: 'Real-time connection established',
        details: { endpoint: `${API_BASE}/api/events` },
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('SSE message received:', message);

        if (message.type === 'connected') {
          console.log('SSE connection confirmed');
          return;
        }

        if (message.type === 'transaction') {
          const tx = message.data as Transaction;
          console.log('Transaction update:', tx.contractId, tx.status);
          
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
          
          // Use Zustand's intelligent add/update logic
          addOrUpdateTransaction(tx);
          
          // Auto-select if this matches a pending submission (use ref to get latest value)
          const pending = pendingSubmissionRef.current;
          if (pending && 
              tx.senderDisplayName === pending.sender &&
              tx.receiverDisplayName === pending.receiver &&
              parseFloat(tx.payload.amount) === pending.amount) {
            console.log('Auto-selecting newly created transaction:', tx.contractId);
            setSelectedTransaction(tx);
            setPendingSubmission(null); // Clear pending
            toast.success('Transaction created! Viewing details...');
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('✗ SSE error:', err);
      setConnectionStatus('disconnected');
      toast.error('Connection lost. Attempting to reconnect...');
      // EventSource automatically reconnects
    };

    // Cleanup on unmount
    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
    };
  }, []); // Empty deps - only run once on mount

  // Handle form submission (with RWA fields)
  const handleSubmit = async (data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
    rwaType?: string;
    rwaDetails?: string;
  }) => {
    try {
      console.log('Submitting transaction:', data);
      addActivityLog({
        level: 'info',
        category: 'user',
        message: `Submitting payment request: ${data.sender} → ${data.receiver}`,
        details: {
          amount: data.amount,
          description: data.description,
          rwaType: data.rwaType,
        },
      });
      
      // Track this submission to auto-select when it arrives via SSE
      setPendingSubmission({
        sender: data.sender,
        receiver: data.receiver,
        amount: data.amount
      });
      
      await apiClient.submitContract(data);
      toast.success('Payment request submitted successfully');
      // Transaction will be auto-selected when it arrives via SSE
    } catch (err: any) {
      console.error('Failed to submit:', err);
      toast.error(err?.message || 'Failed to submit payment request');
      setPendingSubmission(null); // Clear on error
      throw err; // Re-throw for CreateModal to handle
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

      {/* Main Resizable Layout */}
      <ResizableLayout
        leftPanel={<BusinessPanel />}
        mainContent={<MainContent />}
        footer={<SynchronizerFooter />}
      />

      {/* Create Transaction Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmit}
      />

    </div>
  );
}

export default App;

