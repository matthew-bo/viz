import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileNavigation, type MobileTab } from './MobileNavigation';
import { useAppStore } from '../store/useAppStore';

interface MobileLayoutProps {
  leftPanel: React.ReactNode;
  mainContent: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * MobileLayout - Mobile-optimized layout with bottom navigation
 * 
 * Layout structure:
 * ┌─────────────────────────────────┐
 * │      Content (full screen)      │
 * │      Based on active tab        │
 * │                                 │
 * ├─────────────────────────────────┤
 * │  [📊] [💼] [⏱️] [📈]  ← Tabs   │
 * └─────────────────────────────────┘
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  leftPanel,
  mainContent,
  footer,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('transactions');
  const { transactions } = useAppStore();
  
  // Count pending transactions for badge
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  // Track previous tab for animation direction
  const tabOrder: MobileTab[] = ['transactions', 'parties', 'timeline'];
  const [previousTab, setPreviousTab] = useState<MobileTab>('transactions');
  
  const direction = tabOrder.indexOf(activeTab) - tabOrder.indexOf(previousTab);

  const handleTabChange = (tab: MobileTab) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
        return (
          <div className="h-full overflow-auto">
            {mainContent}
          </div>
        );
      
      case 'parties':
        return (
          <div className="h-full overflow-auto bg-white">
            {leftPanel}
          </div>
        );
      
      case 'timeline':
        return (
          <div className="h-full overflow-auto bg-white">
            {footer}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Main content area with tab-based switching */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="h-full w-full absolute inset-0"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingCount={pendingCount}
      />
    </div>
  );
};

