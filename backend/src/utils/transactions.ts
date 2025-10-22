/**
 * Transaction Management System
 * 
 * Provides atomic operations with automatic rollback on failure
 * Ensures data consistency across multiple operations
 */

import { TransactionRollbackError } from './errors';

export type RollbackFunction = () => void | Promise<void>;

export interface TransactionStep {
  name: string;
  execute: () => void | Promise<void>;
  rollback: RollbackFunction;
}

/**
 * Transaction Manager
 * Executes multiple steps and rolls back on failure
 */
export class Transaction {
  private steps: TransactionStep[] = [];
  private executedSteps: string[] = [];
  private isCommitted = false;
  private isRolledBack = false;

  constructor(private id: string) {}

  /**
   * Add a step to the transaction
   */
  addStep(step: TransactionStep): void {
    if (this.isCommitted || this.isRolledBack) {
      throw new Error('Cannot add steps to committed or rolled back transaction');
    }
    this.steps.push(step);
  }

  /**
   * Execute all steps in order
   * Automatically rolls back on failure
   */
  async execute(): Promise<void> {
    if (this.isCommitted) {
      throw new Error('Transaction already committed');
    }
    if (this.isRolledBack) {
      throw new Error('Transaction already rolled back');
    }

    console.log(`🔄 Starting transaction ${this.id} with ${this.steps.length} steps`);

    try {
      for (const step of this.steps) {
        console.log(`  ▶️ Executing step: ${step.name}`);
        await step.execute();
        this.executedSteps.push(step.name);
      }

      this.isCommitted = true;
      console.log(`✅ Transaction ${this.id} committed successfully`);
    } catch (error) {
      console.error(`❌ Transaction ${this.id} failed at step ${this.executedSteps.length + 1}:`, error);
      await this.rollback(error as Error);
      throw error;
    }
  }

  /**
   * Roll back all executed steps in reverse order
   */
  private async rollback(originalError: Error): Promise<void> {
    console.log(`🔙 Rolling back transaction ${this.id} (${this.executedSteps.length} steps to undo)`);

    const rollbackErrors: Error[] = [];

    // Rollback in reverse order
    for (let i = this.executedSteps.length - 1; i >= 0; i--) {
      const stepName = this.executedSteps[i];
      const step = this.steps[i];

      try {
        console.log(`  ◀️ Rolling back: ${stepName}`);
        await step.rollback();
      } catch (rollbackError) {
        console.error(`Failed to rollback step ${stepName}:`, rollbackError);
        rollbackErrors.push(rollbackError as Error);
      }
    }

    this.isRolledBack = true;

    if (rollbackErrors.length > 0) {
      throw new TransactionRollbackError(
        `Transaction rollback had ${rollbackErrors.length} error(s)`,
        originalError,
        this.executedSteps
      );
    }

    console.log(`✅ Transaction ${this.id} rolled back successfully`);
  }

  /**
   * Get transaction status
   */
  getStatus(): 'pending' | 'committed' | 'rolled_back' {
    if (this.isCommitted) return 'committed';
    if (this.isRolledBack) return 'rolled_back';
    return 'pending';
  }

  /**
   * Get executed steps
   */
  getExecutedSteps(): string[] {
    return [...this.executedSteps];
  }
}

/**
 * Create a new transaction
 */
export function createTransaction(id: string): Transaction {
  return new Transaction(id);
}

/**
 * Helper to execute a simple transaction with automatic cleanup
 */
export async function executeTransaction(
  id: string,
  steps: TransactionStep[]
): Promise<void> {
  const transaction = createTransaction(id);
  
  for (const step of steps) {
    transaction.addStep(step);
  }

  await transaction.execute();
}

