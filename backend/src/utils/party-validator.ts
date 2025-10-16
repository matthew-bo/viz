import { Request, Response, NextFunction } from 'express';
import { ledgerClient } from '../canton';

/**
 * Get list of valid party names from ledger client
 * Cached for performance
 */
let validPartyNames: string[] | null = null;

function getValidPartyNames(): string[] {
  if (!validPartyNames) {
    validPartyNames = ledgerClient.getAllParties().map(p => p.displayName);
  }
  return validPartyNames;
}

/**
 * Validate that a party name exists in the configured parties
 * Returns true if valid, false otherwise
 */
export function isValidPartyName(partyName: string): boolean {
  const validNames = getValidPartyNames();
  return validNames.includes(partyName);
}

/**
 * Validate party names in request body
 * Checks 'sender' and 'receiver' fields if present
 * 
 * Usage:
 *   router.post('/', validatePartyNames, async (req, res) => { ... })
 */
export function validatePartyNames(req: Request, res: Response, next: NextFunction): void {
  const { sender, receiver } = req.body;
  const validNames = getValidPartyNames();
  
  // Check sender if present
  if (sender && !isValidPartyName(sender)) {
    return res.status(400).json({
      error: 'Invalid sender party name',
      invalid: sender,
      validParties: validNames
    }) as any;
  }
  
  // Check receiver if present
  if (receiver && !isValidPartyName(receiver)) {
    return res.status(400).json({
      error: 'Invalid receiver party name',
      invalid: receiver,
      validParties: validNames
    }) as any;
  }
  
  next();
}

/**
 * Validate party name in query parameter
 * Checks 'party' query param if present
 * 
 * Usage:
 *   router.get('/', validatePartyQuery, async (req, res) => { ... })
 */
export function validatePartyQuery(req: Request, res: Response, next: NextFunction): void {
  const party = req.query.party as string | undefined;
  
  // Skip validation if no party filter provided (query all)
  if (!party) {
    return next();
  }
  
  const validNames = getValidPartyNames();
  
  if (!isValidPartyName(party)) {
    return res.status(400).json({
      error: 'Invalid party name in query',
      invalid: party,
      validParties: validNames
    }) as any;
  }
  
  next();
}

