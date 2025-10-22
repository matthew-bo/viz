import { useEffect, useCallback, useState } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'search' | 'general';
}

/**
 * useKeyboardShortcuts - Global keyboard shortcut manager
 * 
 * Features:
 * - Register multiple shortcuts
 * - Modifier key support (Ctrl, Alt, Shift)
 * - Prevent conflicts with browser shortcuts
 * - Category-based organization
 * - Help modal toggle
 * 
 * Usage:
 * const { registerShortcut, showHelp, setShowHelp } = useKeyboardShortcuts();
 * 
 * registerShortcut({
 *   key: 'k',
 *   ctrl: true,
 *   description: 'Open search',
 *   action: () => setSearchOpen(true),
 *   category: 'search'
 * });
 */
export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      // Remove any existing shortcut with same key combination
      const filtered = prev.filter(s => 
        !(s.key === shortcut.key && 
          s.ctrl === shortcut.ctrl && 
          s.alt === shortcut.alt &&
          s.shift === shortcut.shift)
      );
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string, ctrl?: boolean, alt?: boolean, shift?: boolean) => {
    setShortcuts(prev => prev.filter(s =>
      !(s.key === key && s.ctrl === ctrl && s.alt === alt && s.shift === shift)
    ));
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable) {
      // Exception: Allow Escape to blur input fields
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

    // Special case: ? key shows help (no need to register)
    if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      setShowHelp(prev => !prev);
      return;
    }

    // Special case: Escape closes help
    if (event.key === 'Escape' && showHelp) {
      event.preventDefault();
      setShowHelp(false);
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrl || false) === (event.ctrlKey || event.metaKey); // Support both Ctrl and Cmd
      const altMatches = (shortcut.alt || false) === event.altKey;
      const shiftMatches = (shortcut.shift || false) === event.shiftKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts, showHelp]);

  // Register global keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    registerShortcut,
    unregisterShortcut,
    shortcuts,
    showHelp,
    setShowHelp
  };
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}

/**
 * Group shortcuts by category
 */
export function groupShortcutsByCategory(shortcuts: KeyboardShortcut[]) {
  const grouped: Record<string, KeyboardShortcut[]> = {
    general: [],
    navigation: [],
    search: [],
    actions: []
  };

  shortcuts.forEach(shortcut => {
    grouped[shortcut.category].push(shortcut);
  });

  return grouped;
}

