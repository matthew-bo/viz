import React from 'react';
import { X, Filter, Building2, Coins } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

/**
 * ActiveFiltersBanner - Shows currently active filters with clear options
 * 
 * Prevents user confusion from persisted filters
 * Provides easy way to clear individual or all filters
 */
export const ActiveFiltersBanner: React.FC = () => {
  const { 
    selectedBusiness, 
    selectedRWA,
    setSelectedBusiness,
    setSelectedRWA 
  } = useAppStore();

  // Don't show banner if no filters active
  if (!selectedBusiness && !selectedRWA) {
    return null;
  }

  const clearAll = () => {
    setSelectedBusiness(null);
    setSelectedRWA(null);
  };

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 animate-in fade-in slide-in-from-top duration-300">
      <div className="container mx-auto px-safe-left px-safe-right">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Icon & Label */}
          <div className="flex items-center gap-2 text-blue-700 font-medium">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Active Filters:</span>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedBusiness && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-300 shadow-sm">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{selectedBusiness}</span>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  aria-label={`Clear ${selectedBusiness} filter`}
                >
                  <X className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            )}

            {selectedRWA && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-300 shadow-sm">
                <Coins className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{selectedRWA}</span>
                <button
                  onClick={() => setSelectedRWA(null)}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  aria-label={`Clear ${selectedRWA} filter`}
                >
                  <X className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            )}
          </div>

          {/* Clear All Button */}
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 
                       font-medium hover:underline transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

