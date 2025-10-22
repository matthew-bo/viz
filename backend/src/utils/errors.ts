/**
 * Custom Error Classes for Better Error Handling
 * 
 * Provides detailed, type-safe error information throughout the application
 */

export class InventoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public partyId?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

export class InsufficientFundsError extends InventoryError {
  constructor(
    partyId: string,
    required: number,
    available: number,
    displayName?: string
  ) {
    super(
      `Insufficient funds for ${displayName || partyId}: requires $${required.toLocaleString()}, has $${available.toLocaleString()}`,
      'INSUFFICIENT_FUNDS',
      partyId,
      { required, available, displayName }
    );
    this.name = 'InsufficientFundsError';
  }
}

export class AssetNotFoundError extends InventoryError {
  constructor(partyId: string, assetId: string, displayName?: string) {
    super(
      `Asset ${assetId} not found in inventory for ${displayName || partyId}`,
      'ASSET_NOT_FOUND',
      partyId,
      { assetId, displayName }
    );
    this.name = 'AssetNotFoundError';
  }
}

export class AssetAlreadyEscrowedError extends InventoryError {
  constructor(partyId: string, assetId: string, displayName?: string) {
    super(
      `Asset ${assetId} is already in escrow for ${displayName || partyId}`,
      'ASSET_ALREADY_ESCROWED',
      partyId,
      { assetId, displayName }
    );
    this.name = 'AssetAlreadyEscrowedError';
  }
}

export class InventoryNotFoundError extends InventoryError {
  constructor(partyId: string) {
    super(
      `Inventory not found for party ${partyId}`,
      'INVENTORY_NOT_FOUND',
      partyId
    );
    this.name = 'InventoryNotFoundError';
  }
}

export class ResourceLockError extends Error {
  constructor(
    resourceId: string,
    lockedBy: string,
    public details?: Record<string, any>
  ) {
    super(`Resource ${resourceId} is locked by ${lockedBy}`);
    this.name = 'ResourceLockError';
    this.details = { resourceId, lockedBy, ...details };
  }
}

export class TransactionRollbackError extends Error {
  constructor(
    message: string,
    public originalError: Error,
    public rollbackSteps: string[]
  ) {
    super(message);
    this.name = 'TransactionRollbackError';
  }
}

/**
 * Type guard to check if error is an InventoryError
 */
export function isInventoryError(error: any): error is InventoryError {
  return error instanceof InventoryError;
}

/**
 * Type guard to check if error is a ResourceLockError
 */
export function isResourceLockError(error: any): error is ResourceLockError {
  return error instanceof ResourceLockError;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: Error): Record<string, any> {
  const base = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  if (isInventoryError(error)) {
    return {
      ...base,
      code: error.code,
      partyId: error.partyId,
      details: error.details
    };
  }

  if (isResourceLockError(error)) {
    return {
      ...base,
      details: error.details
    };
  }

  return base;
}

