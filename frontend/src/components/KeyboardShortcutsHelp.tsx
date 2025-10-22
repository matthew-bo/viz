import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { KeyboardShortcut, formatShortcut, groupShortcutsByCategory } from '../hooks/useKeyboardShortcuts';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  general: '⚙️ General',
  navigation: '🧭 Navigation',
  search: '🔍 Search & Filter',
  actions: '⚡ Actions'
};

const categoryDescriptions: Record<string, string> = {
  general: 'App-wide shortcuts',
  navigation: 'Move between views',
  search: 'Find and filter transactions',
  actions: 'Perform operations'
};

/**
 * KeyboardShortcutsHelp - Modal showing all available keyboard shortcuts
 * 
 * Features:
 * - Categorized shortcut list
 * - Visual key representation
 * - Escape or click outside to close
 * - Responsive design
 */
export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  isOpen,
  onClose
}) => {
  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-5rem)]">
                <div className="space-y-6">
                  {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
                    if (categoryShortcuts.length === 0) return null;

                    return (
                      <div key={category}>
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            {categoryLabels[category] || category}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {categoryDescriptions[category]}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {categoryShortcuts.map((shortcut, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-sm text-gray-700">
                                {shortcut.description}
                              </span>
                              <div className="flex items-center gap-1">
                                {formatShortcut(shortcut).split(' + ').map((key, i, arr) => (
                                  <React.Fragment key={i}>
                                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm text-xs font-mono font-semibold text-gray-800 min-w-[2rem] text-center">
                                      {key}
                                    </kbd>
                                    {i < arr.length - 1 && (
                                      <span className="text-gray-400 text-xs">+</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Tip */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Pro Tip:</strong> Press{' '}
                      <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono mx-1">
                        ?
                      </kbd>{' '}
                      anytime to toggle this help menu.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

