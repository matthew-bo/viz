/**
 * Asset Seed Script
 * Populates the system with sample real estate and private equity assets
 * Distributes them among the three parties
 */

import assetService from '../services/assetService';
import inventoryService from '../services/inventoryService';
import { RealEstateAsset, PrivateEquityAsset } from '../models/Asset';

export function seedAssets(parties: Array<{ partyId: string; displayName: string }>) {
  console.log('\n🌱 Seeding assets...\n');

  // Initialize inventories with cash
  inventoryService.initializeInventory(parties[0].partyId, parties[0].displayName, 1500000); // $1.5M
  inventoryService.initializeInventory(parties[1].partyId, parties[1].displayName, 800000);  // $800K
  inventoryService.initializeInventory(parties[2].partyId, parties[2].displayName, 2000000); // $2M

  // Define Real Estate Assets
  const realEstateAssets: Omit<RealEstateAsset, 'ownerId' | 'history' | 'createdAt'>[] = [
    {
      id: 're_empire_state',
      type: 'real_estate',
      name: 'Empire State Building',
      propertyType: 'commercial',
      location: 'New York, NY',
      value: 2300000000, // $2.3B
    },
    {
      id: 're_chrysler',
      type: 'real_estate',
      name: 'Chrysler Building',
      propertyType: 'commercial',
      location: 'New York, NY',
      value: 150000000, // $150M
    },
    {
      id: 're_willis_tower',
      type: 'real_estate',
      name: 'Willis Tower',
      propertyType: 'commercial',
      location: 'Chicago, IL',
      value: 800000000, // $800M
    },
    {
      id: 're_one_wtc',
      type: 'real_estate',
      name: 'One World Trade Center',
      propertyType: 'commercial',
      location: 'New York, NY',
      value: 3800000000, // $3.8B
    },
    {
      id: 're_salesforce',
      type: 'real_estate',
      name: 'Salesforce Tower',
      propertyType: 'commercial',
      location: 'San Francisco, CA',
      value: 1100000000, // $1.1B
    },
    {
      id: 're_space_needle',
      type: 'real_estate',
      name: 'Space Needle',
      propertyType: 'mixed_use',
      location: 'Seattle, WA',
      value: 75000000, // $75M
    },
    {
      id: 're_sears_tower',
      type: 'real_estate',
      name: 'John Hancock Center',
      propertyType: 'commercial',
      location: 'Chicago, IL',
      value: 650000000, // $650M
    },
    {
      id: 're_transamerica',
      type: 'real_estate',
      name: 'Transamerica Pyramid',
      propertyType: 'commercial',
      location: 'San Francisco, CA',
      value: 400000000, // $400M
    },
  ];

  // Define Private Equity Assets
  const privateEquityAssets: Omit<PrivateEquityAsset, 'ownerId' | 'history' | 'createdAt'>[] = [
    {
      id: 'pe_techcorp',
      type: 'private_equity',
      name: 'TechCorp Industries',
      industry: 'Technology',
      valuation: 180000000, // $180M
    },
    {
      id: 'pe_greenenergy',
      type: 'private_equity',
      name: 'GreenEnergy Solutions',
      industry: 'Renewable Energy',
      valuation: 125000000, // $125M
    },
    {
      id: 'pe_healthplus',
      type: 'private_equity',
      name: 'HealthPlus Medical',
      industry: 'Healthcare',
      valuation: 95000000, // $95M
    },
    {
      id: 'pe_financehub',
      type: 'private_equity',
      name: 'FinanceHub Group',
      industry: 'Financial Services',
      valuation: 210000000, // $210M
    },
    {
      id: 'pe_logitech',
      type: 'private_equity',
      name: 'LogiTech Innovations',
      industry: 'Logistics',
      valuation: 75000000, // $75M
    },
    {
      id: 'pe_biomedical',
      type: 'private_equity',
      name: 'BioMedical Research Corp',
      industry: 'Biotechnology',
      valuation: 155000000, // $155M
    },
    {
      id: 'pe_cybersec',
      type: 'private_equity',
      name: 'CyberSec Defense Systems',
      industry: 'Cybersecurity',
      valuation: 190000000, // $190M
    },
    {
      id: 'pe_agrotech',
      type: 'private_equity',
      name: 'AgroTech Farming Solutions',
      industry: 'Agriculture Technology',
      valuation: 85000000, // $85M
    },
  ];

  // Asset distribution plan
  // Party 0 (AssetOracle): 3 real estate, 2 private equity
  // Party 1 (RetailChain): 2 real estate, 3 private equity
  // Party 2 (WholesaleFinance): 3 real estate, 3 private equity

  const distribution = [
    {
      partyIdx: 0,
      realEstate: [0, 1, 2], // Empire State, Chrysler, Willis Tower
      privateEquity: [0, 1],  // TechCorp, GreenEnergy
    },
    {
      partyIdx: 1,
      realEstate: [3, 5],     // One WTC, Space Needle
      privateEquity: [2, 3, 4], // HealthPlus, FinanceHub, LogiTech
    },
    {
      partyIdx: 2,
      realEstate: [4, 6, 7],  // Salesforce, Hancock, Transamerica
      privateEquity: [5, 6, 7], // BioMedical, CyberSec, AgroTech
    },
  ];

  // Create and distribute real estate assets
  console.log('📍 Creating Real Estate Assets:');
  realEstateAssets.forEach((assetTemplate, idx) => {
    const owner = distribution.find(d => d.realEstate.includes(idx));
    if (!owner) return;

    const party = parties[owner.partyIdx];
    const asset: RealEstateAsset = {
      ...assetTemplate,
      ownerId: party.partyId,
      history: [
        {
          timestamp: new Date(),
          fromParty: 'System',
          toParty: party.displayName,
          exchangeId: 'initial_allocation',
          exchangedFor: {
            type: 'cash',
            description: 'Initial allocation',
            value: 0,
          },
        }
      ],
      createdAt: new Date(),
    };

    assetService.addRealEstate(asset);
    inventoryService.addAsset(party.partyId, asset.id, 'real_estate');
    
    console.log(`  ✓ ${asset.name} → ${party.displayName} ($${(asset.value / 1000000).toFixed(0)}M)`);
  });

  // Create and distribute private equity assets
  console.log('\n💼 Creating Private Equity Assets:');
  privateEquityAssets.forEach((assetTemplate, idx) => {
    const owner = distribution.find(d => d.privateEquity.includes(idx));
    if (!owner) return;

    const party = parties[owner.partyIdx];
    const asset: PrivateEquityAsset = {
      ...assetTemplate,
      ownerId: party.partyId,
      history: [
        {
          timestamp: new Date(),
          fromParty: 'System',
          toParty: party.displayName,
          exchangeId: 'initial_allocation',
          exchangedFor: {
            type: 'cash',
            description: 'Initial allocation',
            value: 0,
          },
        }
      ],
      createdAt: new Date(),
    };

    assetService.addPrivateEquity(asset);
    inventoryService.addAsset(party.partyId, asset.id, 'private_equity');
    
    console.log(`  ✓ ${asset.name} → ${party.displayName} ($${(asset.valuation / 1000000).toFixed(0)}M)`);
  });

  console.log('\n✅ Asset seeding complete!\n');

  // Print inventory summary
  console.log('📊 Inventory Summary:');
  parties.forEach(party => {
    const snapshot = inventoryService.getInventorySnapshot(party.partyId);
    if (snapshot) {
      console.log(`\n${snapshot.displayName}:`);
      console.log(`  💵 Cash: $${snapshot.cash.toLocaleString()}`);
      console.log(`  🏢 Real Estate: ${snapshot.realEstateAssets.length} properties`);
      snapshot.realEstateAssets.forEach(re => {
        console.log(`     - ${re.name}`);
      });
      console.log(`  📊 Private Equity: ${snapshot.privateEquityAssets.length} companies`);
      snapshot.privateEquityAssets.forEach(pe => {
        console.log(`     - ${pe.name}`);
      });
    }
  });

  console.log('\n');
}

