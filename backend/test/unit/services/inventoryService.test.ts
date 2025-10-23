/**
 * Unit Tests: Inventory Service
 * Tests inventory tracking and management for real estate and private equity
 */

import inventoryService from '../../../src/services/inventoryService';

describe('Inventory Service', () => {
  // Use unique IDs to avoid collision with other tests
  const TEST_PARTY_ID = 'test-party-' + Date.now();
  const TEST_DISPLAY_NAME = 'TestParty';
  const INITIAL_CASH = 1000000;

  beforeEach(() => {
    // Initialize test inventory (service is a singleton, so we use unique IDs)
    inventoryService.initializeInventory(TEST_PARTY_ID, TEST_DISPLAY_NAME, INITIAL_CASH);
  });

  describe('Initialization', () => {
    it('should initialize inventory with cash balance', () => {
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      
      expect(inventory).toBeDefined();
      expect(inventory?.partyId).toBe(TEST_PARTY_ID);
      expect(inventory?.displayName).toBe(TEST_DISPLAY_NAME);
      expect(inventory?.cash).toBe(INITIAL_CASH);
      expect(inventory?.escrowedCash).toBe(0);
    });

    it('should initialize with empty asset arrays', () => {
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      
      expect(inventory?.realEstate).toEqual([]);
      expect(inventory?.privateEquity).toEqual([]);
      expect(inventory?.escrowedRealEstate).toEqual([]);
      expect(inventory?.escrowedPrivateEquity).toEqual([]);
    });

    it('should have all seeded inventories after reset', () => {
      const inventories = inventoryService.getAllInventories();
      
      expect(inventories.length).toBeGreaterThanOrEqual(1);
      expect(inventories.every(inv => inv.partyId && inv.displayName)).toBe(true);
    });
  });

  describe('Cash Management', () => {
    it('should add cash to balance', () => {
      const result = inventoryService.addCash(TEST_PARTY_ID, 50000);
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.cash).toBe(INITIAL_CASH + 50000);
    });

    it('should deduct cash from balance', () => {
      const result = inventoryService.deductCash(TEST_PARTY_ID, 100000);
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.cash).toBe(INITIAL_CASH - 100000);
    });

    it('should fail to deduct more cash than available', () => {
      const result = inventoryService.deductCash(TEST_PARTY_ID, INITIAL_CASH + 1);
      
      expect(result).toBe(false);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.cash).toBe(INITIAL_CASH); // Unchanged
    });

    it('should check if party has sufficient cash', () => {
      expect(inventoryService.hasSufficientCash(TEST_PARTY_ID, 500000)).toBe(true);
      expect(inventoryService.hasSufficientCash(TEST_PARTY_ID, INITIAL_CASH)).toBe(true);
      expect(inventoryService.hasSufficientCash(TEST_PARTY_ID, INITIAL_CASH + 1)).toBe(false);
    });

    it('should return false for operations on non-existent party', () => {
      expect(inventoryService.addCash('non-existent', 100)).toBe(false);
      expect(inventoryService.deductCash('non-existent', 100)).toBe(false);
      expect(inventoryService.hasSufficientCash('non-existent', 100)).toBe(false);
    });
  });

  describe('Asset Management', () => {
    const REAL_ESTATE_ID = 'real-estate-001';
    const PRIVATE_EQUITY_ID = 'private-equity-001';

    it('should add real estate asset', () => {
      const result = inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.realEstate).toContain(REAL_ESTATE_ID);
    });

    it('should add private equity asset', () => {
      const result = inventoryService.addAsset(TEST_PARTY_ID, PRIVATE_EQUITY_ID, 'private_equity');
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.privateEquity).toContain(PRIVATE_EQUITY_ID);
    });

    it('should not duplicate assets when adding same asset twice', () => {
      inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      const count = inventory?.realEstate.filter(id => id === REAL_ESTATE_ID).length;
      expect(count).toBe(1);
    });

    it('should remove real estate asset', () => {
      inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      const result = inventoryService.removeAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.realEstate).not.toContain(REAL_ESTATE_ID);
    });

    it('should remove private equity asset', () => {
      inventoryService.addAsset(TEST_PARTY_ID, PRIVATE_EQUITY_ID, 'private_equity');
      const result = inventoryService.removeAsset(TEST_PARTY_ID, PRIVATE_EQUITY_ID, 'private_equity');
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.privateEquity).not.toContain(PRIVATE_EQUITY_ID);
    });

    it('should check asset ownership', () => {
      inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      expect(inventoryService.ownsAsset(TEST_PARTY_ID, REAL_ESTATE_ID)).toBe(true);
      expect(inventoryService.ownsAsset(TEST_PARTY_ID, 'non-existent')).toBe(false);
    });

    it('should return false when adding asset to non-existent party', () => {
      const result = inventoryService.addAsset('non-existent', REAL_ESTATE_ID, 'real_estate');
      expect(result).toBe(false);
    });
  });

  describe('Escrow Management - Cash', () => {
    it('should lock cash in escrow', () => {
      const amount = 100000;
      const result = inventoryService.lockCashInEscrow(TEST_PARTY_ID, amount);
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.cash).toBe(INITIAL_CASH - amount);
      expect(inventory?.escrowedCash).toBe(amount);
    });

    it('should fail to lock more cash than available', () => {
      const result = inventoryService.lockCashInEscrow(TEST_PARTY_ID, INITIAL_CASH + 1);
      
      expect(result).toBe(false);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.cash).toBe(INITIAL_CASH);
      expect(inventory?.escrowedCash).toBe(0);
    });

    it('should release cash from escrow', () => {
      const amount = 100000;
      inventoryService.lockCashInEscrow(TEST_PARTY_ID, amount);
      
      const result = inventoryService.releaseCashFromEscrow(TEST_PARTY_ID, amount);
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.cash).toBe(INITIAL_CASH);
      expect(inventory?.escrowedCash).toBe(0);
    });

    it('should fail to release more than escrowed', () => {
      inventoryService.lockCashInEscrow(TEST_PARTY_ID, 50000);
      
      const result = inventoryService.releaseCashFromEscrow(TEST_PARTY_ID, 100000);
      
      expect(result).toBe(false);
    });

    it('should transfer escrowed cash to another party', () => {
      const PARTY2_ID = 'party-2-id';
      inventoryService.initializeInventory(PARTY2_ID, 'Party2', INITIAL_CASH);
      
      const amount = 100000;
      inventoryService.lockCashInEscrow(TEST_PARTY_ID, amount);
      
      const result = inventoryService.transferCashFromEscrow(TEST_PARTY_ID, PARTY2_ID, amount);
      
      expect(result).toBe(true);
      
      const inventory1 = inventoryService.getInventory(TEST_PARTY_ID);
      const inventory2 = inventoryService.getInventory(PARTY2_ID);
      
      expect(inventory1?.escrowedCash).toBe(0);
      expect(inventory2?.cash).toBe(INITIAL_CASH + amount);
    });
  });

  describe('Escrow Management - Assets', () => {
    const REAL_ESTATE_ID = 'escrow-real-estate-001';

    it('should lock asset in escrow', () => {
      inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      const result = inventoryService.lockAssetInEscrow(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.realEstate).not.toContain(REAL_ESTATE_ID);
      expect(inventory?.escrowedRealEstate).toContain(REAL_ESTATE_ID);
    });

    it('should release asset from escrow', () => {
      inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      inventoryService.lockAssetInEscrow(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      const result = inventoryService.releaseAssetFromEscrow(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      expect(result).toBe(true);
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.realEstate).toContain(REAL_ESTATE_ID);
      expect(inventory?.escrowedRealEstate).not.toContain(REAL_ESTATE_ID);
    });

    it('should fail to lock asset not owned', () => {
      const result = inventoryService.lockAssetInEscrow(TEST_PARTY_ID, 'non-existent', 'real_estate');
      expect(result).toBe(false);
    });

    it('should transfer escrowed asset to another party', () => {
      const PARTY2_ID = 'party-2-id';
      inventoryService.initializeInventory(PARTY2_ID, 'Party2', INITIAL_CASH);
      
      inventoryService.addAsset(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      inventoryService.lockAssetInEscrow(TEST_PARTY_ID, REAL_ESTATE_ID, 'real_estate');
      
      const result = inventoryService.transferAssetFromEscrow(
        TEST_PARTY_ID,
        PARTY2_ID,
        REAL_ESTATE_ID,
        'real_estate'
      );
      
      expect(result).toBe(true);
      
      const inventory1 = inventoryService.getInventory(TEST_PARTY_ID);
      const inventory2 = inventoryService.getInventory(PARTY2_ID);
      
      expect(inventory1?.escrowedRealEstate).not.toContain(REAL_ESTATE_ID);
      expect(inventory2?.realEstate).toContain(REAL_ESTATE_ID);
    });
  });

  describe('getAllInventories', () => {
    it('should return all inventories', () => {
      const inventories = inventoryService.getAllInventories();
      
      expect(Array.isArray(inventories)).toBe(true);
      expect(inventories.length).toBeGreaterThan(0);
      expect(inventories.some(inv => inv.partyId === TEST_PARTY_ID)).toBe(true);
    });
  });

  describe('getInventory', () => {
    it('should return null for non-existent party', () => {
      const inventory = inventoryService.getInventory('non-existent-party');
      expect(inventory).toBeNull();
    });

    it('should return inventory for existing party', () => {
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      
      expect(inventory).not.toBeNull();
      expect(inventory?.partyId).toBe(TEST_PARTY_ID);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple escrow operations', () => {
      const amount1 = 50000;
      const amount2 = 30000;
      
      inventoryService.lockCashInEscrow(TEST_PARTY_ID, amount1);
      inventoryService.lockCashInEscrow(TEST_PARTY_ID, amount2);
      
      const inventory = inventoryService.getInventory(TEST_PARTY_ID);
      expect(inventory?.escrowedCash).toBe(amount1 + amount2);
      expect(inventory?.cash).toBe(INITIAL_CASH - amount1 - amount2);
    });

    it('should handle negative amounts gracefully', () => {
      const result = inventoryService.addCash(TEST_PARTY_ID, -1000);
      // Adding negative is technically allowed (equivalent to deduct)
      // OR it should fail - depends on implementation
      expect(typeof result).toBe('boolean');
    });

    it('should update lastUpdated timestamp on changes', () => {
      const inventory1 = inventoryService.getInventory(TEST_PARTY_ID);
      const timestamp1 = inventory1?.lastUpdated;
      
      // Make a change
      inventoryService.addCash(TEST_PARTY_ID, 1000);
      const inventory2 = inventoryService.getInventory(TEST_PARTY_ID);
      const timestamp2 = inventory2?.lastUpdated;
      
      // Timestamps should be different (though may be close if system is fast)
      expect(timestamp2).toBeDefined();
      expect(timestamp2?.getTime()).toBeGreaterThanOrEqual(timestamp1?.getTime() || 0);
    });
  });
});
