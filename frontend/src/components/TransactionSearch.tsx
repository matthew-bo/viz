import React, { useState, useMemo } from 'react';
import { Search, X, Filter, Calendar, DollarSign, Users, Tag } from 'lucide-react';
import { Transaction } from '../types';
import { sanitizeSearchQuery } from '../utils/sanitize';

export interface SearchFilters {
  query: string;
  status?: 'pending' | 'committed' | 'all';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  rwaType?: string;
  party?: string;
}

interface TransactionSearchProps {
  transactions: Transaction[];
  onFilteredResults: (filtered: Transaction[]) => void;
}

/**
 * TransactionSearch - Advanced search and filtering for transactions
 * 
 * Features:
 * - Full-text search across all fields
 * - Status filtering
 * - Date range filtering
 * - Amount range filtering
 * - RWA type filtering
 * - Party filtering
 * - Real-time results
 */
export const TransactionSearch: React.FC<TransactionSearchProps> = ({
  transactions,
  onFilteredResults
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
  });

  // Extract unique values for filter dropdowns
  const uniqueRWATypes = useMemo(() => {
    const types = new Set(transactions.map(tx => tx.payload.rwaType).filter(Boolean));
    return Array.from(types);
  }, [transactions]);

  const uniqueParties = useMemo(() => {
    const parties = new Set<string>();
    transactions.forEach(tx => {
      parties.add(tx.senderDisplayName);
      parties.add(tx.receiverDisplayName);
    });
    return Array.from(parties).sort();
  }, [transactions]);

  // Apply all filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Text search across multiple fields
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.contractId.toLowerCase().includes(query) ||
        tx.senderDisplayName.toLowerCase().includes(query) ||
        tx.receiverDisplayName.toLowerCase().includes(query) ||
        tx.payload.description?.toLowerCase().includes(query) ||
        tx.payload.rwaType?.toLowerCase().includes(query) ||
        tx.payload.currency.toLowerCase().includes(query) ||
        tx.payload.amount.toString().includes(query)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(tx => new Date(tx.recordTime) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(tx => new Date(tx.recordTime) <= toDate);
    }

    // Amount range filter
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(tx => parseFloat(tx.payload.amount) >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(tx => parseFloat(tx.payload.amount) <= filters.maxAmount!);
    }

    // RWA type filter
    if (filters.rwaType && filters.rwaType !== 'all') {
      filtered = filtered.filter(tx => tx.payload.rwaType === filters.rwaType);
    }

    // Party filter
    if (filters.party && filters.party !== 'all') {
      filtered = filtered.filter(tx => 
        tx.senderDisplayName === filters.party || 
        tx.receiverDisplayName === filters.party
      );
    }

    return filtered;
  }, [transactions, filters]);

  // Update parent component with filtered results
  React.useEffect(() => {
    onFilteredResults(filteredTransactions);
  }, [filteredTransactions, onFilteredResults]);

  const handleQueryChange = (query: string) => {
    // Sanitize search query to prevent XSS
    const sanitized = sanitizeSearchQuery(query);
    setFilters(prev => ({ ...prev, query: sanitized }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      status: 'all',
    });
  };

  const hasActiveFilters = 
    filters.query ||
    (filters.status && filters.status !== 'all') ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    (filters.rwaType && filters.rwaType !== 'all') ||
    (filters.party && filters.party !== 'all');

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search transactions (ID, parties, description, amount...)"
            className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded"
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                isExpanded || hasActiveFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[
                    filters.status !== 'all',
                    filters.dateFrom,
                    filters.dateTo,
                    filters.minAmount !== undefined,
                    filters.maxAmount !== undefined,
                    filters.rwaType && filters.rwaType !== 'all',
                    filters.party && filters.party !== 'all'
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-2 text-sm text-gray-600">
          {filteredTransactions.length === transactions.length ? (
            <span>Showing all {transactions.length} transactions</span>
          ) : (
            <span>
              Found {filteredTransactions.length} of {transactions.length} transactions
            </span>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="committed">Committed</option>
              </select>
            </div>

            {/* Party Filter */}
            {uniqueParties.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  Party
                </label>
                <select
                  value={filters.party || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, party: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Parties</option>
                  {uniqueParties.map(party => (
                    <option key={party} value={party}>{party}</option>
                  ))}
                </select>
              </div>
            )}

            {/* RWA Type Filter */}
            {uniqueRWATypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="w-4 h-4 inline mr-1" />
                  RWA Type
                </label>
                <select
                  value={filters.rwaType || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, rwaType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {uniqueRWATypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount Range */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Amount Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount ?? ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount ?? ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

