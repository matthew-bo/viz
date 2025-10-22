import { useState, useCallback } from 'react';
import { useToast } from './useToast';

/**
 * useTransactionAction - Prevents race conditions and duplicate submissions
 * 
 * Features:
 * - Tracks loading state per transaction ID
 * - Prevents duplicate API calls
 * - Consistent error handling
 * - Automatic cleanup
 * 
 * Usage:
 * const { executeAction, isProcessing } = useTransactionAction();
 * 
 * await executeAction(txId, async () => {
 *   await apiClient.acceptTransaction(txId);
 * });
 */
export function useTransactionAction() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const isProcessing = useCallback((id: string): boolean => {
    return processingIds.has(id);
  }, [processingIds]);

  const executeAction = useCallback(async <T,>(
    id: string,
    action: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    // Prevent duplicate submissions
    if (processingIds.has(id)) {
      console.warn(`Action already in progress for ${id}`);
      return null;
    }

    // Add to processing set
    setProcessingIds(prev => new Set(prev).add(id));

    // Show loading toast if provided
    if (options?.loadingMessage) {
      toast.info(options.loadingMessage);
    }

    try {
      const result = await action();
      
      // Show success toast
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error(`Action failed for ${id}:`, error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      // Show error toast
      toast.error(options?.errorMessage || errorMessage);
      
      // Call error callback
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
      
      throw error; // Re-throw for caller to handle if needed
    } finally {
      // Remove from processing set
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [processingIds, toast]);

  return {
    executeAction,
    isProcessing,
    isAnyProcessing: processingIds.size > 0,
    processingCount: processingIds.size
  };
}

/**
 * useOptimisticUpdate - Handles optimistic UI updates with automatic rollback
 * 
 * Usage:
 * const { performOptimisticUpdate } = useOptimisticUpdate();
 * 
 * performOptimisticUpdate(
 *   optimisticState,
 *   async () => await apiCall(),
 *   originalState
 * );
 */
export function useOptimisticUpdate<T>() {
  const { toast } = useToast();

  const performOptimisticUpdate = useCallback(async (
    optimisticUpdateFn: () => void,
    apiCall: () => Promise<T>,
    rollbackFn: () => void,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      rollbackDelay?: number; // Delay before rollback for smooth animation
    }
  ): Promise<T | null> => {
    // Apply optimistic update immediately
    optimisticUpdateFn();

    try {
      // Execute API call in background
      const result = await apiCall();
      
      // Show success message if provided
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      return result;
    } catch (error) {
      console.error('Optimistic update failed, rolling back:', error);
      
      // Rollback with optional delay for animation
      if (options?.rollbackDelay && options.rollbackDelay > 0) {
        setTimeout(() => {
          rollbackFn();
        }, options.rollbackDelay);
      } else {
        rollbackFn();
      }
      
      // Show error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Action failed';
      
      toast.error(options?.errorMessage || errorMessage);
      
      return null;
    }
  }, [toast]);

  return {
    performOptimisticUpdate
  };
}

