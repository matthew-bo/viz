/**
 * Pessimistic Locking System
 * 
 * Prevents race conditions by locking resources during operations
 * Automatically releases locks after timeout to prevent deadlocks
 */

import { ResourceLockError } from './errors';

interface Lock {
  resourceId: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

class LockingService {
  private locks: Map<string, Lock> = new Map();
  private readonly DEFAULT_LOCK_TIMEOUT = 30000; // 30 seconds

  /**
   * Acquire a lock on a resource
   * Throws ResourceLockError if already locked
   */
  acquireLock(
    resourceId: string,
    lockerId: string,
    timeout: number = this.DEFAULT_LOCK_TIMEOUT,
    metadata?: Record<string, any>
  ): void {
    // Clean up expired locks first
    this.cleanupExpiredLocks();

    const existing = this.locks.get(resourceId);
    
    if (existing) {
      // Check if expired
      if (new Date() > existing.expiresAt) {
        console.warn(`Lock on ${resourceId} expired, releasing`);
        this.locks.delete(resourceId);
      } else {
        throw new ResourceLockError(
          resourceId,
          existing.lockedBy,
          {
            lockedAt: existing.lockedAt,
            expiresAt: existing.expiresAt,
            ...existing.metadata
          }
        );
      }
    }

    const now = new Date();
    const lock: Lock = {
      resourceId,
      lockedBy: lockerId,
      lockedAt: now,
      expiresAt: new Date(now.getTime() + timeout),
      metadata
    };

    this.locks.set(resourceId, lock);
    console.log(`🔒 Lock acquired on ${resourceId} by ${lockerId} (expires in ${timeout}ms)`);
  }

  /**
   * Release a lock on a resource
   */
  releaseLock(resourceId: string, lockerId: string): boolean {
    const lock = this.locks.get(resourceId);
    
    if (!lock) {
      console.warn(`Attempted to release non-existent lock on ${resourceId}`);
      return false;
    }

    if (lock.lockedBy !== lockerId) {
      console.error(`Lock on ${resourceId} is owned by ${lock.lockedBy}, not ${lockerId}`);
      return false;
    }

    this.locks.delete(resourceId);
    console.log(`🔓 Lock released on ${resourceId} by ${lockerId}`);
    return true;
  }

  /**
   * Check if a resource is locked
   */
  isLocked(resourceId: string): boolean {
    this.cleanupExpiredLocks();
    return this.locks.has(resourceId);
  }

  /**
   * Get lock information
   */
  getLock(resourceId: string): Lock | null {
    this.cleanupExpiredLocks();
    return this.locks.get(resourceId) || null;
  }

  /**
   * Execute a function with a lock
   * Automatically acquires and releases the lock
   */
  async withLock<T>(
    resourceId: string,
    lockerId: string,
    fn: () => Promise<T>,
    timeout?: number,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.acquireLock(resourceId, lockerId, timeout, metadata);
    
    try {
      const result = await fn();
      return result;
    } finally {
      this.releaseLock(resourceId, lockerId);
    }
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    const now = new Date();
    const expired: string[] = [];

    for (const [resourceId, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        expired.push(resourceId);
      }
    }

    for (const resourceId of expired) {
      const lock = this.locks.get(resourceId)!;
      console.warn(`🕐 Lock expired on ${resourceId} (was locked by ${lock.lockedBy})`);
      this.locks.delete(resourceId);
    }
  }

  /**
   * Get all active locks (for debugging)
   */
  getActiveLocks(): Lock[] {
    this.cleanupExpiredLocks();
    return Array.from(this.locks.values());
  }

  /**
   * Clear all locks (for testing only)
   */
  clearAll(): void {
    console.warn('⚠️ Clearing all locks');
    this.locks.clear();
  }
}

export default new LockingService();

