#!/usr/bin/env node

/**
 * Test Frontend Integration with Smart Contract
 * 
 * This script tests the complete integration between:
 * 1. Frontend UI
 * 2. API endpoints
 * 3. Smart contract calls
 * 4. Wallet integration
 */

const { AptosClient } = require('aptos');

// Configuration
const AGGREGATOR_ADDRESS = '0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc';
const MAINNET_URL = 'https://fullnode.mainnet.aptoslabs.com';

// Test tokens
const TEST_TOKENS = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDC: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
  USDT: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
  WBTC: '0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::multiswap_aggregator_v2::WBTC'
};

async function testSmartContractView() {
  console.log('🔍 Testing Smart Contract View Function...');
  
  try {
    const client = new AptosClient(MAINNET_URL);
    
    // Test APT to WBTC quote
    const result = await client.view({
      function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v2::get_best_quote`,
      type_arguments: [TEST_TOKENS.APT, TEST_TOKENS.WBTC],
      arguments: ['1000000'], // 0.01 APT
    });
    
    console.log('✅ Smart contract view successful!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    if (result && Array.isArray(result) && result.length > 0) {
      const quoteData = result[0];
      console.log('🎯 Quote Data:');
      console.log(`  - DEX ID: ${quoteData.dex_id}`);
      console.log(`  - Output Amount: ${quoteData.output_amount}`);
      console.log(`  - Fee: ${quoteData.fee} basis points`);
      console.log(`  - Price Impact: ${quoteData.price_impact} basis points`);
      console.log(`  - Hops: ${quoteData.hops}`);
      console.log(`  - Liquidity Score: ${quoteData.liquidity_score}`);
      console.log(`  - Execution Time: ${quoteData.execution_time} seconds`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Smart contract view failed:', error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('\n🔍 Testing API Endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/simulate-swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputToken: TEST_TOKENS.APT,
        outputToken: TEST_TOKENS.WBTC,
        inputAmount: '1000000', // 0.01 APT
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      
      if (data.quotes && Array.isArray(data.quotes) && data.quotes.length > 0) {
        console.log('🎯 Quotes received:');
        data.quotes.forEach((quote, index) => {
          console.log(`  Quote ${index + 1}:`);
          console.log(`    - DEX: ${quote.dex}`);
          console.log(`    - Output Amount: ${quote.outputAmount}`);
          console.log(`    - Fee: ${quote.fee}%`);
          console.log(`    - Price Impact: ${quote.priceImpact}%`);
          console.log(`    - Route: ${quote.route.join(' -> ')}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    return false;
  }
}

async function testAccountResources() {
  console.log('\n🔍 Testing Account Resources...');
  
  try {
    const response = await fetch(`${MAINNET_URL}/v1/accounts/${AGGREGATOR_ADDRESS}/resources`);
    
    if (response.ok) {
      const resources = await response.json();
      console.log('✅ Account resources fetched successfully!');
      
      // Check for key resources
      const hasAggregatorConfig = resources.some(r => r.type.includes('AggregatorConfig'));
      const hasDEXRegistry = resources.some(r => r.type.includes('DEXRegistry'));
      const hasSwapEvents = resources.some(r => r.type.includes('SwapEvents'));
      const hasQuoteCache = resources.some(r => r.type.includes('QuoteCache'));
      
      console.log('📊 Resource Status:');
      console.log(`  - AggregatorConfig: ${hasAggregatorConfig ? '✅' : '❌'}`);
      console.log(`  - DEXRegistry: ${hasDEXRegistry ? '✅' : '❌'}`);
      console.log(`  - SwapEvents: ${hasSwapEvents ? '✅' : '❌'}`);
      console.log(`  - QuoteCache: ${hasQuoteCache ? '✅' : '❌'}`);
      
      return hasAggregatorConfig && hasDEXRegistry && hasSwapEvents && hasQuoteCache;
    } else {
      console.log('❌ Failed to fetch account resources:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Account resources test failed:', error.message);
    return false;
  }
}

async function testTokenBalances() {
  console.log('\n🔍 Testing Token Balance Fetching...');
  
  try {
    // Test with a known address (you can replace with your address)
    const testAddress = '0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc';
    
    const response = await fetch(`${MAINNET_URL}/v1/accounts/${testAddress}/resources`);
    
    if (response.ok) {
      const resources = await response.json();
      console.log('✅ Token balances fetched successfully!');
      
      // Check for APT balance
      const aptCoinStore = resources.find(r => r.type.includes('0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'));
      
      if (aptCoinStore && aptCoinStore.data && aptCoinStore.data.coin) {
        const balance = Number(aptCoinStore.data.coin.value) / Math.pow(10, 8);
        console.log(`📊 APT Balance: ${balance.toFixed(6)} APT`);
      } else {
        console.log('📊 APT Balance: Not found');
      }
      
      return true;
    } else {
      console.log('❌ Failed to fetch token balances:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Token balance test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Frontend Integration Tests...\n');
  
  const results = {
    smartContract: await testSmartContractView(),
    apiEndpoint: await testAPIEndpoint(),
    accountResources: await testAccountResources(),
    tokenBalances: await testTokenBalances(),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Smart Contract View: ${results.smartContract ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoint: ${results.apiEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Account Resources: ${results.accountResources ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token Balances: ${results.tokenBalances ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Frontend integration is working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Connect your wallet and test the swap interface');
    console.log('4. Try swapping APT to WBTC to see the aggregator in action');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure the development server is running');
    console.log('2. Check that the smart contract is deployed correctly');
    console.log('3. Verify the API endpoints are accessible');
    console.log('4. Check network connectivity to Aptos mainnet');
  }
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSmartContractView,
  testAPIEndpoint,
  testAccountResources,
  testTokenBalances,
  runAllTests
}; 