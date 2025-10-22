import { ledgerClient } from '../canton';

/**
 * Real World Asset (RWA) types supported in the demo
 */
const RWA_TYPES = [
  'cash',
  'corporate_bonds',
  'treasury_bonds', 
  'real_estate',
  'commodities',
  'private_equity',
  'trade_finance'
] as const;

type RWAType = typeof RWA_TYPES[number];

/**
 * Generate realistic RWA details for a given type
 */
function generateRWADetails(type: RWAType, amount: number): any {
  const base = {
    assetClass: type,
    issueDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maturityDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000 * 5).toISOString().split('T')[0]
  };

  switch (type) {
    case 'corporate_bonds':
      return {
        ...base,
        issuer: ['Apple Inc', 'Microsoft Corp', 'Amazon.com Inc', 'Google LLC', 'Tesla Inc'][Math.floor(Math.random() * 5)],
        couponRate: (2 + Math.random() * 5).toFixed(2) + '%',
        rating: ['AAA', 'AA+', 'AA', 'AA-', 'A+'][Math.floor(Math.random() * 5)],
        isin: 'US' + Math.random().toString().slice(2, 11),
        faceValue: amount
      };

    case 'treasury_bonds':
      return {
        ...base,
        country: ['United States', 'Germany', 'Japan', 'United Kingdom'][Math.floor(Math.random() * 4)],
        couponRate: (1 + Math.random() * 3).toFixed(2) + '%',
        cusip: Math.random().toString(36).substring(2, 11).toUpperCase(),
        faceValue: amount
      };

    case 'real_estate':
      return {
        ...base,
        propertyType: ['Commercial Office', 'Retail Space', 'Industrial Warehouse', 'Residential Complex'][Math.floor(Math.random() * 4)],
        location: ['New York, NY', 'San Francisco, CA', 'London, UK', 'Tokyo, Japan', 'Singapore'][Math.floor(Math.random() * 5)],
        sqft: Math.floor(10000 + Math.random() * 90000),
        valuationDate: new Date().toISOString().split('T')[0],
        marketValue: amount
      };

    case 'commodities':
      return {
        ...base,
        commodity: ['Gold', 'Silver', 'Crude Oil', 'Natural Gas', 'Copper'][Math.floor(Math.random() * 5)],
        quantity: Math.floor(100 + Math.random() * 9900),
        unit: ['oz', 'bbl', 'MT'][Math.floor(Math.random() * 3)],
        pricePerUnit: (amount / (100 + Math.random() * 900)).toFixed(2),
        totalValue: amount
      };

    case 'private_equity':
      return {
        ...base,
        fundName: ['Growth Fund IV', 'Tech Ventures II', 'Strategic Partners V', 'Innovation Capital III'][Math.floor(Math.random() * 4)],
        fundManager: ['Sequoia Capital', 'Andreessen Horowitz', 'Benchmark', 'Accel Partners'][Math.floor(Math.random() * 4)],
        vintage: 2018 + Math.floor(Math.random() * 6),
        commitmentAmount: amount,
        targetIRR: (15 + Math.random() * 20).toFixed(1) + '%'
      };

    case 'trade_finance':
      return {
        ...base,
        tradeType: ['Letter of Credit', 'Invoice Factoring', 'Supply Chain Finance'][Math.floor(Math.random() * 3)],
        exporter: ['Global Trade Co', 'International Exports Ltd', 'TransPacific Goods'][Math.floor(Math.random() * 3)],
        importer: ['Continental Imports', 'Maritime Trading Inc', 'Eastern Commerce'][Math.floor(Math.random() * 3)],
        goods: ['Electronics', 'Textiles', 'Machinery', 'Agricultural Products'][Math.floor(Math.random() * 4)],
        invoiceAmount: amount
      };

    case 'cash':
    default:
      return {
        assetClass: 'cash',
        currency: 'USD',
        accountType: ['Checking', 'Savings', 'Money Market'][Math.floor(Math.random() * 3)],
        institution: ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank'][Math.floor(Math.random() * 4)],
        balance: amount
      };
  }
}

/**
 * Generate realistic transaction descriptions
 */
function generateDescription(type: RWAType, sender: string, receiver: string): string {
  const templates = {
    cash: [
      `Wire transfer from ${sender} to ${receiver}`,
      `Payment settlement - ${sender} to ${receiver}`,
      `Cash transfer for operational expenses`
    ],
    corporate_bonds: [
      `Corporate bond purchase - ${sender} acquiring securities from ${receiver}`,
      `Bond settlement between ${sender} and ${receiver}`,
      `Investment-grade corporate debt transaction`
    ],
    treasury_bonds: [
      `Government securities purchase`,
      `Treasury bond settlement ${sender} -> ${receiver}`,
      `Sovereign debt investment transaction`
    ],
    real_estate: [
      `Real estate investment - ${sender} purchasing from ${receiver}`,
      `Commercial property transaction`,
      `Property acquisition and settlement`
    ],
    commodities: [
      `Commodity purchase agreement`,
      `Physical asset transfer ${sender} to ${receiver}`,
      `Commodity trading settlement`
    ],
    private_equity: [
      `Private equity fund commitment`,
      `PE investment from ${sender} to ${receiver}`,
      `Alternative investment allocation`
    ],
    trade_finance: [
      `Trade finance arrangement`,
      `Export financing ${sender} -> ${receiver}`,
      `Supply chain finance settlement`
    ]
  };

  const options = templates[type] || templates.cash;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate demo transactions with realistic data
 * Creates a mix of pending and committed transactions across all RWA types
 */
export async function generateDemoTransactions(count: number = 60): Promise<void> {
  console.log(`\n🎲 Generating ${count} demo transactions...`);

  const parties = ['TechBank', 'GlobalCorp', 'RetailChain'];
  const transactions: Array<{
    sender: string;
    receiver: string;
    amount: number;
    description: string;
    rwaType: string;
    rwaDetails: string;
  }> = [];

  // Generate transactions with diverse amounts and RWA types
  for (let i = 0; i < count; i++) {
    const rwaType = RWA_TYPES[Math.floor(Math.random() * RWA_TYPES.length)];
    
    // Generate realistic amounts based on asset type
    let amount: number;
    switch (rwaType) {
      case 'real_estate':
        amount = Math.floor(500000 + Math.random() * 4500000); // $500K - $5M
        break;
      case 'private_equity':
        amount = Math.floor(1000000 + Math.random() * 9000000); // $1M - $10M
        break;
      case 'corporate_bonds':
      case 'treasury_bonds':
        amount = Math.floor(100000 + Math.random() * 900000); // $100K - $1M
        break;
      case 'trade_finance':
        amount = Math.floor(50000 + Math.random() * 450000); // $50K - $500K
        break;
      case 'commodities':
        amount = Math.floor(25000 + Math.random() * 475000); // $25K - $500K
        break;
      case 'cash':
      default:
        amount = Math.floor(1000 + Math.random() * 99000); // $1K - $100K
        break;
    }

    // Random sender and receiver
    const sender = parties[Math.floor(Math.random() * parties.length)];
    let receiver = parties[Math.floor(Math.random() * parties.length)];
    while (receiver === sender) {
      receiver = parties[Math.floor(Math.random() * parties.length)];
    }

    const description = generateDescription(rwaType, sender, receiver);
    const rwaDetails = generateRWADetails(rwaType, amount);

    transactions.push({
      sender,
      receiver,
      amount,
      description,
      rwaType,
      rwaDetails: JSON.stringify(rwaDetails)
    });
  }

  // Submit transactions in batches with delays to avoid overwhelming Canton
  const batchSize = 5;
  let submitted = 0;
  let accepted = 0;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    
    // Submit all in batch
    const pendingRequests = await Promise.all(
      batch.map(async (tx) => {
        try {
          const result = await ledgerClient.submitPaymentRequest(
            tx.sender,
            tx.receiver,
            tx.amount,
            tx.description,
            tx.rwaType,
            tx.rwaDetails
          );
          submitted++;
          return { contractId: result.contractId, receiver: tx.receiver, rwaType: tx.rwaType };
        } catch (error) {
          console.error(`Failed to submit transaction:`, error);
          return null;
        }
      })
    );

    // Accept 70% of pending requests (creating a realistic mix)
    for (const pending of pendingRequests) {
      if (pending && Math.random() > 0.3) {
        try {
          await ledgerClient.acceptPaymentRequest(pending.receiver, pending.contractId);
          accepted++;
        } catch (error) {
          console.error(`Failed to accept ${pending.contractId}:`, error);
        }
      }
    }

    // Progress indicator
    const progress = Math.min(100, Math.floor(((i + batchSize) / transactions.length) * 100));
    process.stdout.write(`\r  Progress: ${progress}% (${submitted} submitted, ${accepted} accepted)`);

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n✓ Demo data generation complete!`);
  console.log(`  - Total submitted: ${submitted} PaymentRequests`);
  console.log(`  - Total accepted: ${accepted} Payments`);
  console.log(`  - Pending: ${submitted - accepted} PaymentRequests\n`);
}

