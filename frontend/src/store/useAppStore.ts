import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Party } from '../types';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
type ViewMode = 'grid' | 'list' | 'flow';

export interface AppStore {
  // Transaction data
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (contractId: string, tx: Transaction) => void;
  removeTransaction: (contractId: string) => void;
  addOrUpdateTransaction: (tx: Transaction) => void;
  
  // Parties data
  parties: Party[];
  setParties: (parties: Party[]) => void;
  
  // Filter state
  selectedBusiness: string | null;
  setSelectedBusiness: (business: string | null) => void;
  
  selectedRWA: string | null;
  setSelectedRWA: (rwa: string | null) => void;
  
  // View state
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  
  // Connection state
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  
  // Helper methods
  getFilteredTransactions: () => Transaction[];
  getMetricsForParty: (partyName: string) => {
    sent: number;
    received: number;
    volume: number;
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: [],
      parties: [],
      selectedBusiness: null,
      selectedRWA: null,
      activeView: 'grid',
      selectedTransaction: null,
      connectionStatus: 'connecting',
      
      // Setters
      setTransactions: (txs) => set({ transactions: txs }),
      
      addTransaction: (tx) => set((state) => ({
        transactions: [tx, ...state.transactions]
      })),
      
      updateTransaction: (contractId, tx) => set((state) => ({
        transactions: state.transactions.map(t => 
          t.contractId === contractId ? tx : t
        )
      })),
      
      removeTransaction: (contractId) => set((state) => ({
        transactions: state.transactions.filter(t => t.contractId !== contractId)
      })),
      
      addOrUpdateTransaction: (tx) => {
        const state = get();
        const existingIndex = state.transactions.findIndex(
          t => t.contractId === tx.contractId
        );
        
        if (existingIndex !== -1) {
          // Update existing
          get().updateTransaction(tx.contractId, tx);
        } else {
          // Handle committed Payment replacing pending PaymentRequest
          if (tx.status === 'committed') {
            // Remove matching pending request
            const filteredTxs = state.transactions.filter(t => {
              const isMatchingPending = 
                t.status === 'pending' &&
                t.payload.sender === tx.payload.sender &&
                t.payload.receiver === tx.payload.receiver &&
                t.payload.amount === tx.payload.amount &&
                t.payload.description === tx.payload.description;
              return !isMatchingPending;
            });
            
            set({ transactions: [tx, ...filteredTxs] });
          } else {
            // Add new transaction
            get().addTransaction(tx);
          }
        }
      },
      
      setParties: (parties) => set({ parties }),
      setSelectedBusiness: (business) => set({ selectedBusiness: business }),
      setSelectedRWA: (rwa) => set({ selectedRWA: rwa }),
      setActiveView: (view) => set({ activeView: view }),
      setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      
      // Helper methods
      getFilteredTransactions: () => {
        const state = get();
        let filtered = state.transactions;
        
        // Filter by business
        if (state.selectedBusiness) {
          filtered = filtered.filter(t => 
            t.senderDisplayName === state.selectedBusiness || 
            t.receiverDisplayName === state.selectedBusiness
          );
        }
        
        // Filter by RWA type
        if (state.selectedRWA) {
          filtered = filtered.filter(t => 
            t.payload.rwaType === state.selectedRWA
          );
        }
        
        // Sort by record time (newest first)
        return filtered.sort((a, b) => 
          new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime()
        );
      },
      
      getMetricsForParty: (partyName) => {
        const state = get();
        const transactions = state.transactions.filter(t =>
          t.senderDisplayName === partyName || 
          t.receiverDisplayName === partyName
        );
        
        const sent = transactions.filter(t => 
          t.senderDisplayName === partyName
        ).length;
        
        const received = transactions.filter(t => 
          t.receiverDisplayName === partyName
        ).length;
        
        const volume = transactions
          .filter(t => t.status === 'committed')
          .reduce((sum, t) => sum + parseFloat(t.payload.amount), 0);
        
        return { sent, received, volume };
      }
    }),
    {
      name: 'canton-visualizer-storage',
      partialize: (state) => ({
        selectedBusiness: state.selectedBusiness,
        selectedRWA: state.selectedRWA,
        activeView: state.activeView
      })
    }
  )
);
