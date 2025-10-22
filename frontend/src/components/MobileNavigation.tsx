import React from 'react';
import { motion } from 'framer-motion';
import { List, Building2, Clock } from 'lucide-react';

type MobileTab = 'transactions' | 'parties' | 'timeline';

interface MobileNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  pendingCount?: number;
}

export type { MobileTab };

/**
 * MobileNavigation - Bottom tab bar for mobile devices
 * 
 * Standard mobile navigation pattern with:
 * - Icon + label for each tab
 * - Active state highlighting
 * - Badge for pending items
 * - Safe area padding for iOS
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingCount = 0,
}) => {
  const tabs: Array<{
    id: MobileTab;
    icon: React.ElementType;
    label: string;
    badge?: number;
  }> = [
    { id: 'transactions', icon: List, label: 'Transactions' },
    { id: 'parties', icon: Building2, label: 'Parties' },
    { id: 'timeline', icon: Clock, label: 'Timeline', badge: pendingCount },
  ];

  return (
    <nav 
      role="tablist"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' 
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center h-full min-w-0 px-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon with badge */}
              <div className="relative">
                <Icon 
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {tab.badge && tab.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
                             bg-yellow-500 text-white text-xs font-bold rounded-full px-1"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </motion.span>
                )}
              </div>

              {/* Label */}
              <span 
                className={`mt-1 text-xs font-medium transition-colors truncate max-w-full ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

