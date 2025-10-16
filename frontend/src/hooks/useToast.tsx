import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/Toast';

/**
 * useToast - Hook for managing toast notifications
 * Provides methods to show success, error, and info toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: useCallback((message: string, duration?: number) => {
      addToast('success', message, duration);
    }, [addToast]),
    
    error: useCallback((message: string, duration?: number) => {
      addToast('error', message, duration);
    }, [addToast]),
    
    info: useCallback((message: string, duration?: number) => {
      addToast('info', message, duration);
    }, [addToast]),
  };

  return { toasts, toast, removeToast };
}

