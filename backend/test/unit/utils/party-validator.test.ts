/**
 * Unit Tests: Party Validator
 * Tests party name validation logic
 */

import { isValidPartyName, validatePartyNames, validatePartyQuery } from '../../../src/utils/party-validator';
import { Request, Response } from 'express';

describe('Party Validator Utils', () => {
  describe('isValidPartyName', () => {
    it('should accept valid party names', () => {
      expect(isValidPartyName('TechBank')).toBe(true);
      expect(isValidPartyName('GlobalCorp')).toBe(true);
      expect(isValidPartyName('RetailFinance')).toBe(true);
    });

    it('should reject invalid party names', () => {
      expect(isValidPartyName('InvalidBank')).toBe(false);
      expect(isValidPartyName('techbank')).toBe(false); // Case sensitive
      expect(isValidPartyName('TechBankk')).toBe(false); // Typo
      expect(isValidPartyName('')).toBe(false);
      expect(isValidPartyName(null as any)).toBe(false);
      expect(isValidPartyName(undefined as any)).toBe(false);
    });

    it('should reject malicious input', () => {
      expect(isValidPartyName('<script>alert("xss")</script>')).toBe(false);
      expect(isValidPartyName('../../etc/passwd')).toBe(false);
      expect(isValidPartyName('TechBank; DROP TABLE users;')).toBe(false);
    });
  });

  describe('validatePartyNames middleware', () => {
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
    });

    it('should pass validation with valid party names', () => {
      mockReq.body = {
        sender: 'TechBank',
        receiver: 'GlobalCorp'
      };

      validatePartyNames(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid sender', () => {
      mockReq.body = {
        sender: 'InvalidBank',
        receiver: 'GlobalCorp'
      };

      validatePartyNames(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid sender party name')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid receiver', () => {
      mockReq.body = {
        sender: 'TechBank',
        receiver: 'InvalidBank'
      };

      validatePartyNames(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid receiver party name')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow empty body (route handler will validate required fields)', () => {
      mockReq.body = {};

      validatePartyNames(mockReq as Request, mockRes as Response, mockNext);

      // Should pass through - route handler checks for required fields
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('validatePartyQuery middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        query: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    it('should pass when no party query param', () => {
      validatePartyQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should pass with valid party query param', () => {
      mockReq.query = { party: 'TechBank' };

      validatePartyQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid party query param', () => {
      mockReq.query = { party: 'InvalidBank' };

      validatePartyQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid party name in query',
          invalid: 'InvalidBank',
          validParties: expect.arrayContaining(['TechBank', 'GlobalCorp', 'RetailFinance'])
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

