import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Transaction, Party } from './types';
import { apiClient } from './api/client';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import Header from './components/Header';
import CantonExplainer from './components/CantonExplainer';
import SystemStatus from './components/SystemStatus';
import ActivityLog, { addActivityLog } from './components/ActivityLog';
import ContractForm from './components/ContractForm';
import PrivacyFilter from './components/PrivacyFilter';
import TransactionGrid from './components/TransactionGrid';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Main App Component
 * Manages global state and SSE connection for real-time updates
 */
function App() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  // Toast notifications
  const { toasts, toast, removeToast } = useToast();

  // Load initial data (parties and transactions)
  useEffect(() => {
    async function loadInitialData() {
      try {
        console.log('Loading initial data...');
        
        const [partiesList, txList] = await Promise.all([
          apiClient.getParties(),
          apiClient.getTransactions({ limit: 50 })
        ]);
        
        console.log('Loaded parties:', partiesList);
        console.log('Loaded transactions:', txList);
        
        setParties(partiesList);
        setTransactions(txList);
        setLastUpdateTime(new Date());
        setError(null);
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
        setError(err.message || 'Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Establish SSE connection for real-time updates
  useEffect(() => {
    console.log('Establishing SSE connection...');
    
    const eventSource = new EventSource(`${API_BASE}/api/events`);

    eventSource.onopen = () => {
      console.log('✓ SSE connected');
      setIsConnected(true);
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
          
          setLastUpdateTime(new Date());
          setTransactions((prev) => {
            // Check if transaction exists (update by contractId)
            const existingIndex = prev.findIndex(
              (t) => t.contractId === tx.contractId
            );

            if (existingIndex !== -1) {
              // Update existing transaction
              console.log('Updating existing transaction');
              const updated = [...prev];
              updated[existingIndex] = tx;
              return updated;
            }

            // If this is a committed Payment, remove the corresponding pending PaymentRequest
            if (tx.status === 'committed') {
              console.log('Committed Payment received - removing pending PaymentRequest');
              const filteredPrev = prev.filter((t) => {
                // Remove pending transactions that match this payment
                const isMatchingPendingRequest = 
                  t.status === 'pending' &&
                  t.payload.sender === tx.payload.sender &&
                  t.payload.receiver === tx.payload.receiver &&
                  t.payload.amount === tx.payload.amount &&
                  t.payload.currency === tx.payload.currency &&
                  t.payload.description === tx.payload.description;
                
                if (isMatchingPendingRequest) {
                  console.log('Removing pending PaymentRequest:', t.contractId);
                }
                
                return !isMatchingPendingRequest;
              });
              
              // Add the committed Payment
              return [tx, ...filteredPrev];
            }

            // Add new transaction at beginning (for pending requests)
            console.log('Adding new transaction');
            return [tx, ...prev];
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('✗ SSE error:', err);
      setIsConnected(false);
      toast.error('Connection lost. Attempting to reconnect...');
      // EventSource automatically reconnects
    };

    // Cleanup on unmount
    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (data: {
    sender: string;
    receiver: string;
    amount: number;
    description: string;
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
        },
      });
      await apiClient.submitContract(data);
      toast.success('Payment request submitted successfully');
      // No need to update state - SSE will push update
    } catch (err: any) {
      console.error('Failed to submit:', err);
      toast.error(err?.message || 'Failed to submit payment request');
      throw err; // Re-throw for ContractForm to handle
    }
  };

  // Handle accept button click
  const handleAccept = async (contractId: string, receiver: string) => {
    try {
      console.log('Accepting transaction:', contractId, 'as', receiver);
      addActivityLog({
        level: 'info',
        category: 'user',
        message: `Accepting payment request as ${receiver}`,
        details: {
          contractId,
          receiver,
        },
      });
      await apiClient.acceptContract(contractId, receiver);
      toast.success('Payment accepted successfully');
      // No need to update state - SSE will push update
    } catch (err: any) {
      console.error('Failed to accept:', err);
      toast.error(err?.message || 'Failed to accept payment');
      throw err; // Re-throw for TransactionCard to handle
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-canton-blue animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Canton Network...
          </h2>
          <p className="text-gray-600">Connecting to blockchain nodes</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isConnected && transactions.length === 0) {
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
              className="mt-6 w-full bg-canton-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-canton-blue-dark transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <Header isConnected={isConnected} />
      <CantonExplainer />

      <div className="container mx-auto px-4 py-8">
        {/* System Status */}
        <div className="mb-8">
          <SystemStatus
            isConnected={isConnected}
            partyCount={parties.length}
            transactionCount={transactions.length}
            lastUpdateTime={lastUpdateTime}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Submit Form */}
        <div className="mb-8">
          <ContractForm parties={parties} onSubmit={handleSubmit} />
        </div>

        {/* Main Grid: Privacy Filter + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <PrivacyFilter
            parties={parties}
            selectedParty={selectedParty}
            onChange={setSelectedParty}
          />

          <TransactionGrid
            transactions={transactions}
            selectedParty={selectedParty}
            onAccept={handleAccept}
          />
        </div>

        {/* Activity Log */}
        <div className="mt-8">
          <ActivityLog maxEntries={200} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            Built with Canton Community Edition 2.7.6 • Daml • React • TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

