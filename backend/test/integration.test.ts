/**
 * Integration Test for Canton Backend
 * 
 * Prerequisites:
 * - Canton infrastructure must be running (docker-compose up)
 * - Canton must be initialized with real party IDs (init-canton-final.ps1)
 * - Backend .env file must be configured with party IDs
 * 
 * Run with: npm test
 */

import { ledgerClient } from '../src/canton';

describe('Canton Integration', () => {
  // Increase timeout for blockchain operations
  jest.setTimeout(30000);

  it('should submit and query payment request', async () => {
    console.log('Starting integration test...');
    
    // Submit a payment request
    console.log('Submitting PaymentRequest: TechBank → GlobalCorp, $1000');
    const result = await ledgerClient.submitPaymentRequest(
      'TechBank',
      'GlobalCorp',
      1000,
      'Integration test payment'
    );
    
    console.log(`PaymentRequest created: ${result.contractId}`);
    
    // Verify contract ID was generated
    expect(result.contractId).toBeDefined();
    expect(result.contractId).not.toBe('');
    
    // Verify contract status
    expect(result.status).toBe('pending');
    
    // Verify sender and receiver
    expect(result.senderDisplayName).toBe('TechBank');
    expect(result.receiverDisplayName).toBe('GlobalCorp');
    
    // Verify amount
    expect(result.payload.amount).toBe('1000');
    expect(result.payload.currency).toBe('USD');
    
    // Query transactions as TechBank (sender)
    console.log('Querying transactions as TechBank...');
    const techBankTxs = await ledgerClient.getTransactions('TechBank');
    
    // Should contain our newly created transaction
    const foundTx = techBankTxs.find(tx => tx.contractId === result.contractId);
    expect(foundTx).toBeDefined();
    expect(foundTx?.status).toBe('pending');
    
    console.log('✓ Integration test passed!');
  });

  it('should accept payment request', async () => {
    console.log('Starting accept workflow test...');
    
    // Submit a payment request
    console.log('Submitting PaymentRequest: GlobalCorp → RetailFinance, $500');
    const request = await ledgerClient.submitPaymentRequest(
      'GlobalCorp',
      'RetailFinance',
      500,
      'Accept workflow test'
    );
    
    console.log(`PaymentRequest created: ${request.contractId}`);
    expect(request.status).toBe('pending');
    
    // Accept the payment request
    console.log('Accepting PaymentRequest as RetailFinance...');
    const payment = await ledgerClient.acceptPaymentRequest(
      'RetailFinance',
      request.contractId
    );
    
    console.log(`Payment created: ${payment.contractId}`);
    
    // Verify payment was created
    expect(payment.contractId).toBeDefined();
    expect(payment.status).toBe('committed');
    
    // Verify both parties in signatories
    expect(payment.signatories).toContain(payment.payload.sender);
    expect(payment.signatories).toContain(payment.payload.receiver);
    
    // Verify committedAt timestamp exists
    expect(payment.payload.committedAt).toBeDefined();
    
    console.log('✓ Accept workflow test passed!');
  });

  it('should enforce privacy filtering', async () => {
    console.log('Starting privacy test...');
    
    // Submit a payment: TechBank → GlobalCorp
    console.log('Submitting PaymentRequest: TechBank → GlobalCorp');
    const tx = await ledgerClient.submitPaymentRequest(
      'TechBank',
      'GlobalCorp',
      250,
      'Privacy test payment'
    );
    
    // TechBank should see it (sender)
    console.log('Querying as TechBank (sender)...');
    const techBankView = await ledgerClient.getTransactions('TechBank');
    const techBankSeesIt = techBankView.some(t => t.contractId === tx.contractId);
    expect(techBankSeesIt).toBe(true);
    
    // GlobalCorp should see it (receiver)
    console.log('Querying as GlobalCorp (receiver)...');
    const globalCorpView = await ledgerClient.getTransactions('GlobalCorp');
    const globalCorpSeesIt = globalCorpView.some(t => t.contractId === tx.contractId);
    expect(globalCorpSeesIt).toBe(true);
    
    // RetailFinance should NOT see it (not involved)
    console.log('Querying as RetailFinance (not involved)...');
    const retailView = await ledgerClient.getTransactions('RetailFinance');
    const retailSeesIt = retailView.some(t => t.contractId === tx.contractId);
    expect(retailSeesIt).toBe(false);
    
    console.log('✓ Privacy test passed!');
    console.log('  TechBank (sender): can see ✓');
    console.log('  GlobalCorp (receiver): can see ✓');
    console.log('  RetailFinance (not involved): cannot see ✓');
  });

  it('should get all parties', () => {
    console.log('Testing party configuration...');
    
    const parties = ledgerClient.getAllParties();
    
    // Should have exactly 3 parties
    expect(parties).toHaveLength(3);
    
    // Verify party names
    const partyNames = parties.map(p => p.displayName);
    expect(partyNames).toContain('TechBank');
    expect(partyNames).toContain('GlobalCorp');
    expect(partyNames).toContain('RetailFinance');
    
    // Verify each party has required fields
    parties.forEach(party => {
      expect(party.displayName).toBeDefined();
      expect(party.partyId).toBeDefined();
      expect(party.ledgerApiUrl).toBeDefined();
      
      // Verify party ID format (DisplayName::fingerprint)
      expect(party.partyId).toContain('::');
      expect(party.partyId.startsWith(party.displayName)).toBe(true);
    });
    
    console.log('✓ Party configuration test passed!');
  });

  it('should validate party names', () => {
    console.log('Testing party name validation...');
    
    const { isValidPartyName } = require('../src/utils/party-validator');
    
    // Valid party names
    expect(isValidPartyName('TechBank')).toBe(true);
    expect(isValidPartyName('GlobalCorp')).toBe(true);
    expect(isValidPartyName('RetailFinance')).toBe(true);
    
    // Invalid party names
    expect(isValidPartyName('TechBankk')).toBe(false);      // Typo
    expect(isValidPartyName('techbank')).toBe(false);       // Wrong case
    expect(isValidPartyName('InvalidParty')).toBe(false);   // Doesn't exist
    expect(isValidPartyName('')).toBe(false);               // Empty string
    
    console.log('✓ Party validation test passed!');
  });
});

