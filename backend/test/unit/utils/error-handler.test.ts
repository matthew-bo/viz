/**
 * Unit Tests: Error Handler
 * Tests Canton error handling and formatting
 */

import { handleCantonError } from '../../../src/utils/error-handler';
import { Response } from 'express';

describe('Error Handler Utils', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleCantonError', () => {
    it('should handle Canton connection errors', () => {
      const error = new Error('ECONNREFUSED: Connection refused');

      handleCantonError(error, mockRes as Response, 'submit transaction');

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to submit transaction',
          code: 'UNAVAILABLE',
          details: 'Canton service temporarily unavailable',
          retry: true,
          retryAfter: 5
        })
      );
    });

    it('should handle Canton timeout errors', () => {
      const error = new Error('ETIMEDOUT: Request timeout');

      handleCantonError(error, mockRes as Response, 'query transactions');

      // Timeout maps to UNAVAILABLE (503)
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to query transactions',
          code: 'UNAVAILABLE',
          retry: true
        })
      );
    });

    it('should handle Canton authentication errors', () => {
      const error = new Error('UNAUTHORIZED: Invalid JWT token');

      handleCantonError(error, mockRes as Response, 'create contract');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to create contract',
          code: 'UNAUTHORIZED'
        })
      );
    });

    it('should handle Canton permission errors', () => {
      const error = new Error('PERMISSION_DENIED: Party not authorized');

      handleCantonError(error, mockRes as Response, 'accept payment');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to accept payment',
          code: 'PERMISSION_DENIED'
        })
      );
    });

    it('should handle Canton contract not found errors', () => {
      const error = new Error('Contract not found');

      handleCantonError(error, mockRes as Response, 'accept payment');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to accept payment',
          code: 'CONTRACT_NOT_FOUND',
          details: 'Contract not found',
          hint: 'Contract may have already been accepted or does not exist'
        })
      );
    });

    it('should handle validation errors', () => {
      const error = new Error('INVALID_ARGUMENT: Amount must be positive');

      handleCantonError(error, mockRes as Response, 'submit transaction');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to submit transaction',
          code: 'INVALID_ARGUMENT'
        })
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Unknown error occurred');

      handleCantonError(error, mockRes as Response, 'unknown operation');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to unknown operation',
          code: 'UNKNOWN',
          details: 'Unknown error occurred'
        })
      );
    });

    it('should include error stack in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');

      handleCantonError(error, mockRes as Response, 'test operation');

      const jsonCallArg = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCallArg.stack).toBeDefined();
      expect(jsonCallArg.stack).toContain('Error: Detailed error message');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Sensitive internal error');

      handleCantonError(error, mockRes as Response, 'test operation');

      const jsonCallArg = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCallArg.stack).toBeUndefined();
      
      // But should still have error and details
      expect(jsonCallArg.error).toBe('Failed to test operation');
      expect(jsonCallArg.details).toBe('Sensitive internal error');

      process.env.NODE_ENV = originalEnv;
    });

    it('should add retry hints for 503 errors', () => {
      const error = new Error('UNAVAILABLE: Service temporarily down');

      handleCantonError(error, mockRes as Response, 'query ledger');

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: true,
          retryAfter: 5 // 5 seconds
        })
      );
    });

    it('should add helpful hints for 404 errors', () => {
      const error = new Error('Contract with ID abc123 not found');

      handleCantonError(error, mockRes as Response, 'exercise choice');

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          hint: 'Contract may have already been accepted or does not exist'
        })
      );
    });

    it('should handle errors with missing message', () => {
      const error = {}; // No message property

      handleCantonError(error, mockRes as Response, 'test operation');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to test operation',
          code: 'UNKNOWN'
        })
      );
    });
  });
});
