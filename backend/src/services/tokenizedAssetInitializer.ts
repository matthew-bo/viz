/**
 * Tokenized Asset Initializer
 * 
 * Creates tokenized assets on the Canton ledger matching the in-memory assets.
 * Uses CantonAssetRegistry to maintain the mapping between asset IDs and contract IDs.
 */

import { cantonAssetRegistry } from './cantonAssetRegistry';

// Same asset data as seedAssets.ts - must stay in sync
const ASSET_DATA = {
  // Cash allocations (same as seedAssets)
  cash: [
    { owner: 'TechBank', amount: 1500000 },      // $1.5M
    { owner: 'GlobalCorp', amount: 800000 },     // $800K
    { owner: 'RetailFinance', amount: 2000000 }  // $2M
  ],

  // Real Estate Assets (same as seedAssets)
  realEstate: [
    { owner: 'TechBank', assetId: 're_empire_state', name: 'Empire State Building', location: 'New York, NY', propertyType: 'Commercial', squareFeet: 2768591, value: 2300000000 },
    { owner: 'TechBank', assetId: 're_chrysler', name: 'Chrysler Building', location: 'New York, NY', propertyType: 'Commercial', squareFeet: 1195000, value: 150000000 },
    { owner: 'TechBank', assetId: 're_willis_tower', name: 'Willis Tower', location: 'Chicago, IL', propertyType: 'Commercial', squareFeet: 4560000, value: 800000000 },
    { owner: 'GlobalCorp', assetId: 're_one_wtc', name: 'One World Trade Center', location: 'New York, NY', propertyType: 'Commercial', squareFeet: 3501274, value: 3800000000 },
    { owner: 'GlobalCorp', assetId: 're_space_needle', name: 'Space Needle', location: 'Seattle, WA', propertyType: 'Mixed-Use', squareFeet: 4500, value: 75000000 },
    { owner: 'RetailFinance', assetId: 're_salesforce', name: 'Salesforce Tower', location: 'San Francisco, CA', propertyType: 'Commercial', squareFeet: 1420000, value: 1100000000 },
    { owner: 'RetailFinance', assetId: 're_sears_tower', name: 'John Hancock Center', location: 'Chicago, IL', propertyType: 'Commercial', squareFeet: 2800000, value: 650000000 },
    { owner: 'RetailFinance', assetId: 're_transamerica', name: 'Transamerica Pyramid', location: 'San Francisco, CA', propertyType: 'Commercial', squareFeet: 600000, value: 400000000 },
  ],

  // Private Equity Assets (same as seedAssets)
  privateEquity: [
    { owner: 'TechBank', assetId: 'pe_techcorp', companyName: 'TechCorp Industries', industry: 'Technology', ownershipPercentage: 15, valuation: 180000000 },
    { owner: 'TechBank', assetId: 'pe_greenenergy', companyName: 'GreenEnergy Solutions', industry: 'Renewable Energy', ownershipPercentage: 22, valuation: 125000000 },
    { owner: 'GlobalCorp', assetId: 'pe_healthplus', companyName: 'HealthPlus Medical', industry: 'Healthcare', ownershipPercentage: 18, valuation: 95000000 },
    { owner: 'GlobalCorp', assetId: 'pe_financehub', companyName: 'FinanceHub Group', industry: 'Financial Services', ownershipPercentage: 25, valuation: 210000000 },
    { owner: 'GlobalCorp', assetId: 'pe_logitech', companyName: 'LogiTech Innovations', industry: 'Logistics', ownershipPercentage: 30, valuation: 75000000 },
    { owner: 'RetailFinance', assetId: 'pe_biomedical', companyName: 'BioMedical Research Corp', industry: 'Biotechnology', ownershipPercentage: 12, valuation: 155000000 },
    { owner: 'RetailFinance', assetId: 'pe_cybersec', companyName: 'CyberSec Defense Systems', industry: 'Cybersecurity', ownershipPercentage: 20, valuation: 190000000 },
    { owner: 'RetailFinance', assetId: 'pe_agrotech', companyName: 'AgroTech Farming Solutions', industry: 'Agriculture Technology', ownershipPercentage: 28, valuation: 85000000 },
  ]
};

export interface TokenizationResult {
  success: boolean;
  cashHoldings: number;
  realEstateTokens: number;
  privateEquityTokens: number;
  errors: string[];
  cantonAvailable: boolean;
}

/**
 * Initialize tokenized assets using the Canton Asset Registry
 */
export async function initializeTokenizedAssets(): Promise<TokenizationResult> {
  console.log('🔗 Initializing tokenized assets on Canton...');
  
  const result = await cantonAssetRegistry.initialize(ASSET_DATA);
  
  const summary: TokenizationResult = {
    success: result.success,
    cashHoldings: ASSET_DATA.cash.length,
    realEstateTokens: ASSET_DATA.realEstate.length,
    privateEquityTokens: ASSET_DATA.privateEquity.length,
    errors: result.errors,
    cantonAvailable: cantonAssetRegistry.isCantonAvailable()
  };

  if (result.success) {
    console.log(`✓ Canton tokenization complete: ${result.created} assets created`);
  } else if (result.errors.includes('Canton not available')) {
    console.log('ℹ Running in-memory only mode (Canton not available)');
  } else {
    console.log(`⚠ Partial tokenization: ${result.errors.length} errors`);
  }

  return summary;
}

/**
 * Check if tokenized assets already exist on Canton
 */
export async function checkTokenizedAssetsExist(): Promise<boolean> {
  return cantonAssetRegistry.isInitialized() && cantonAssetRegistry.isCantonAvailable();
}

/**
 * Get the Canton Asset Registry instance
 */
export function getCantonRegistry() {
  return cantonAssetRegistry;
}
