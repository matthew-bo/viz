/**
 * Raw Canton Client
 * 
 * Direct HTTP calls to Canton JSON API without @daml/ledger library.
 * This bypasses the need for generated TypeScript bindings.
 * 
 * JSON API Reference: https://docs.daml.com/json-api/
 */

import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../config';

interface PartyConfig {
  displayName: string;
  partyId: string;
  ledgerApiUrl: string;
  ledgerId: string;
}

interface CreateResult {
  contractId: string;
  payload: any;
}

interface QueryResult {
  result: Array<{
    contractId: string;
    payload: any;
  }>;
  status: number;
}

interface ExerciseResult {
  result: any;
  status: number;
}

/**
 * Create JWT token for Canton JSON API
 */
function createToken(partyId: string, ledgerId: string): string {
  const payload = {
    "https://daml.com/ledger-api": {
      actAs: [partyId],
      ledgerId: ledgerId,
      applicationId: "canton-privacy-demo"
    }
  };
  
  return jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn as StringValue | number
  });
}

/**
 * Raw Canton Client - direct HTTP to JSON API
 */
export class RawCantonClient {
  private parties: Map<string, PartyConfig> = new Map();
  private tokens: Map<string, string> = new Map();

  constructor() {
    const partyConfigs: PartyConfig[] = [
      {
        displayName: 'TechBank',
        partyId: process.env.TECHBANK_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT1_LEDGER_API!,
        ledgerId: 'participant1'
      },
      {
        displayName: 'GlobalCorp',
        partyId: process.env.GLOBALCORP_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT2_LEDGER_API!,
        ledgerId: 'participant1'
      },
      {
        displayName: 'RetailFinance',
        partyId: process.env.RETAILFINANCE_PARTY_ID!,
        ledgerApiUrl: process.env.PARTICIPANT3_LEDGER_API!,
        ledgerId: 'participant1'
      }
    ];

    for (const party of partyConfigs) {
      if (!party.partyId || !party.ledgerApiUrl) continue;
      
      this.parties.set(party.displayName, party);
      this.tokens.set(party.displayName, createToken(party.partyId, party.ledgerId));
    }
  }

  private getParty(name: string): PartyConfig {
    const party = this.parties.get(name);
    if (!party) throw new Error(`Unknown party: ${name}`);
    return party;
  }

  private getToken(name: string): string {
    const token = this.tokens.get(name);
    if (!token) throw new Error(`No token for party: ${name}`);
    return token;
  }

  private getBaseUrl(name: string): string {
    const party = this.getParty(name);
    return party.ledgerApiUrl.endsWith('/') 
      ? party.ledgerApiUrl 
      : `${party.ledgerApiUrl}/`;
  }

  /**
   * Create a contract
   */
  async create(
    partyName: string,
    templateId: string,
    payload: Record<string, any>
  ): Promise<CreateResult> {
    const baseUrl = this.getBaseUrl(partyName);
    const token = this.getToken(partyName);

    const response = await fetch(`${baseUrl}v1/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        templateId,
        payload
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.status !== 200) {
      throw new Error(`Create failed: ${JSON.stringify(data)}`);
    }

    return {
      contractId: data.result.contractId,
      payload: data.result.payload
    };
  }

  /**
   * Query contracts by template
   */
  async query(
    partyName: string,
    templateId: string
  ): Promise<Array<{ contractId: string; payload: any }>> {
    const baseUrl = this.getBaseUrl(partyName);
    const token = this.getToken(partyName);

    const response = await fetch(`${baseUrl}v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        templateIds: [templateId]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Query failed: ${JSON.stringify(data)}`);
    }

    return data.result || [];
  }

  /**
   * Exercise a choice on a contract
   */
  async exercise(
    partyName: string,
    templateId: string,
    contractId: string,
    choice: string,
    argument: Record<string, any> = {}
  ): Promise<any> {
    const baseUrl = this.getBaseUrl(partyName);
    const token = this.getToken(partyName);

    const response = await fetch(`${baseUrl}v1/exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        templateId,
        contractId,
        choice,
        argument
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.status !== 200) {
      throw new Error(`Exercise failed: ${JSON.stringify(data)}`);
    }

    return data.result;
  }

  /**
   * Get party ID by display name
   */
  getPartyId(name: string): string {
    return this.getParty(name).partyId;
  }

  /**
   * Get all parties
   */
  getAllParties(): PartyConfig[] {
    return Array.from(this.parties.values());
  }

  /**
   * Check if Canton is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const party = this.parties.values().next().value;
      if (!party) return false;

      const baseUrl = party.ledgerApiUrl.endsWith('/') 
        ? party.ledgerApiUrl 
        : `${party.ledgerApiUrl}/`;
      
      const token = this.tokens.get(party.displayName);
      
      const response = await fetch(`${baseUrl}v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ templateIds: ['Asset:CashHolding'] })
      });

      // 400 with "unknownTemplateIds" means Canton is up but DAR not loaded
      // 200 means everything is working
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }
}

export const rawCantonClient = new RawCantonClient();

