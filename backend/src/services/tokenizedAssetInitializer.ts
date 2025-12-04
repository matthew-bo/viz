/**
 * Tokenized Asset Initializer
 * 
 * Creates tokenized assets on the Canton ledger matching the in-memory assets.
 * This is called after seedAssets to create DAML contracts for the same assets.
 * 
 * When Canton is available, assets exist both:
 * - In-memory (for fallback/development)
 * - On Canton (for production/blockchain guarantee)
 */

import { tokenizedAssetClient } from '../canton/tokenized-asset-client';

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
}

/**
 * Create tokenized assets on Canton matching the in-memory assets
 * Silent failure - logs errors but doesn't throw
 */
export async function tokenizeExistingAssets(): Promise<TokenizationResult> {
  const result: TokenizationResult = {
    success: true,
    cashHoldings: 0,
    realEstateTokens: 0,
    privateEquityTokens: 0,
    errors: []
  };

  // Tokenize cash holdings
  for (const cash of ASSET_DATA.cash) {
    try {
      await tokenizedAssetClient.createCashHolding(cash.owner, cash.amount, 'USD');
      result.cashHoldings++;
    } catch (error) {
      result.errors.push(`Cash ${cash.owner}: ${error}`);
    }
  }

  // Tokenize real estate
  for (const re of ASSET_DATA.realEstate) {
    try {
      await tokenizedAssetClient.createRealEstateToken(
        re.owner,
        re.assetId,
        re.name,
        re.location,
        re.propertyType,
        re.squareFeet,
        re.value
      );
      result.realEstateTokens++;
    } catch (error) {
      result.errors.push(`RE ${re.name}: ${error}`);
    }
  }

  // Tokenize private equity
  for (const pe of ASSET_DATA.privateEquity) {
    try {
      await tokenizedAssetClient.createPrivateEquityToken(
        pe.owner,
        pe.assetId,
        pe.companyName,
        pe.industry,
        pe.ownershipPercentage,
        pe.valuation
      );
      result.privateEquityTokens++;
    } catch (error) {
      result.errors.push(`PE ${pe.companyName}: ${error}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Check if tokenized assets already exist on Canton
 */
export async function checkTokenizedAssetsExist(): Promise<boolean> {
  try {
    const inventory = await tokenizedAssetClient.getTokenizedInventory('TechBank');
    return inventory.cash.length > 0 || 
           inventory.realEstate.length > 0 || 
           inventory.privateEquity.length > 0;
  } catch {
    return false;
  }
}

/**
 * Initialize tokenized assets only if they don't exist
 * Called after seedAssets in server startup
 */
export async function initializeTokenizedAssetsIfNeeded(): Promise<TokenizationResult | null> {
  try {
    const exists = await checkTokenizedAssetsExist();
    if (exists) {
      return null; // Already initialized
    }
    return await tokenizeExistingAssets();
  } catch {
    // Canton not available - that's OK, we'll use in-memory
    return null;
  }
}
