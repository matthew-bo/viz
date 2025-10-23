/**
 * Unit Tests: Idempotency Middleware
 * Tests request deduplication and caching
 */

import { idempotencyMiddleware, cacheIdempotentResult, getIdempotencyStats } from '../../../src/middleware/idempotency';
import { Request, Response } from 'express';

describe('Idempotency Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    // Suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('idempotencyMiddleware', () => {
    it('should pass through on first request', () => {
      mockReq.body = {
        sender: 'TechBank',
        receiver: 'GlobalCorp',
        amount: 1000,
        description: 'Test payment'
      };

      idempotencyMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect((mockReq as any).idempotencyKey).toBeDefined();
    });

    it('should return cached result on duplicate request', () => {
      const requestBody = {
        sender: 'TechBank',
        receiver: 'GlobalCorp',
        amount: 1500,
        description: 'Duplicate test'
      };
      
      mockReq.body = requestBody;

      // First request - should pass through
      idempotencyMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      
      // Cache a result
      cacheIdempotentResult(mockReq as Request, 'test-contract-123');

      // Second request with same parameters - should return cached
      const mockReq2: Partial<Request> = {
        body: { ...requestBody }
      };
      const mockRes2: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext2 = jest.fn();

      idempotencyMiddleware(mockReq2 as Request, mockRes2 as Response, mockNext2);

      expect(mockRes2.status).toHaveBeenCalledWith(200);
      expect(mockRes2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 'test-contract-123',
          deduplicated: true,
          message: expect.any(String)
        })
      );
      expect(mockNext2).not.toHaveBeenCalled();
    });

    it('should generate different keys for different amounts', () => {
      const req1: Partial<Request> = {
        body: {
          sender: 'TechBank',
          receiver: 'GlobalCorp',
          amount: 1000,
          description: 'Payment 1'
        }
      };

      const req2: Partial<Request> = {
        body: {
          sender: 'TechBank',
          receiver: 'GlobalCorp',
          amount: 2000, // Different amount
          description: 'Payment 1'
        }
      };

      idempotencyMiddleware(req1 as Request, mockRes as Response, mockNext);
      const key1 = (req1 as any).idempotencyKey;

      idempotencyMiddleware(req2 as Request, mockRes as Response, jest.fn());
      const key2 = (req2 as any).idempotencyKey;

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different parties', () => {
      const req1: Partial<Request> = {
        body: {
          sender: 'TechBank',
          receiver: 'GlobalCorp',
          amount: 1000,
          description: 'Test'
        }
      };

      const req2: Partial<Request> = {
        body: {
          sender: 'TechBank',
          receiver: 'RetailFinance', // Different receiver
          amount: 1000,
          description: 'Test'
        }
      };

      idempotencyMiddleware(req1 as Request, mockRes as Response, mockNext);
      const key1 = (req1 as any).idempotencyKey;

      idempotencyMiddleware(req2 as Request, mockRes as Response, jest.fn());
      const key2 = (req2 as any).idempotencyKey;

      expect(key1).not.toBe(key2);
    });

    it('should handle requests without description', () => {
      mockReq.body = {
        sender: 'TechBank',
        receiver: 'GlobalCorp',
        amount: 1000
        // No description
      };

      idempotencyMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).idempotencyKey).toContain('none'); // Description defaults to 'none'
    });
  });

  describe('cacheIdempotentResult', () => {
    it('should cache contractId from request', () => {
      mockReq.body = {
        sender: 'GlobalCorp',
        receiver: 'RetailFinance',
        amount: 500,
        description: 'Cache test'
      };

      // First, go through middleware to generate key
      idempotencyMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Cache the result
      cacheIdempotentResult(mockReq as Request, 'cached-contract-456');

      // Verify it's cached by making duplicate request
      const mockReq2: Partial<Request> = {
        body: { ...mockReq.body }
      };
      const mockRes2: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      idempotencyMiddleware(mockReq2 as Request, mockRes2 as Response, jest.fn());

      expect(mockRes2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 'cached-contract-456'
        })
      );
    });

    it('should handle caching when no idempotency key in request', () => {
      // Request that didn't go through middleware
      mockReq.body = { sender: 'TechBank', receiver: 'GlobalCorp', amount: 100 };

      // Should not throw error
      expect(() => {
        cacheIdempotentResult(mockReq as Request, 'contract-xyz');
      }).not.toThrow();
    });
  });

  describe('getIdempotencyStats', () => {
    it('should return cache statistics', () => {
      const stats = getIdempotencyStats();

      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('ttl');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.ttl).toBe('number');
    });

    it('should reflect cache size changes', () => {
      const initialStats = getIdempotencyStats();
      const initialSize = initialStats.cacheSize;

      // Add an entry
      mockReq.body = {
        sender: 'TechBank',
        receiver: 'GlobalCorp',
        amount: 999,
        description: 'Stats test'
      };

      idempotencyMiddleware(mockReq as Request, mockRes as Response, mockNext);
      cacheIdempotentResult(mockReq as Request, 'stats-contract-123');

      const newStats = getIdempotencyStats();
      expect(newStats.cacheSize).toBeGreaterThan(initialSize);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', () => {
      mockReq.body = {};

      expect(() => {
        idempotencyMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null values in request body', () => {
      mockReq.body = {
        sender: null,
        receiver: null,
        amount: null,
        description: null
      };

      expect(() => {
        idempotencyMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should include timestamp in key generation', () => {
      const req1: Partial<Request> = {
        body: {
          sender: 'TechBank',
          receiver: 'GlobalCorp',
          amount: 1000,
          description: 'Time test'
        }
      };

      idempotencyMiddleware(req1 as Request, mockRes as Response, mockNext);
      const key1 = (req1 as any).idempotencyKey;

      // Keys should be different if generated in different seconds
      // (This test might be flaky if both run in same second)
      expect(key1).toMatch(/\d+$/); // Should end with timestamp
    });
  });
});
