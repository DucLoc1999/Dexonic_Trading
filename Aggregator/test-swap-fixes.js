const { AptosClient } = require('aptos');

// Test script để kiểm tra các fix đã áp dụng
async function testSwapFixes() {
  console.log('🧪 Testing swap fixes...');
  
  const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com');
  const AGGREGATOR_ADDRESS = "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";
  
  try {
    // Test 1: Kiểm tra smart contract có hoạt động không
    console.log('\n📋 Test 1: Smart Contract Simulation');
    const simulationPayload = {
      function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::simulate_swap`,
      type_arguments: [
        "0x1::aptos_coin::AptosCoin",
        "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"
      ],
      arguments: ["10000000"] // 10 APT
    };
    
    const response = await fetch('https://fullnode.mainnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulationPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Smart contract simulation successful:', result);
    } else {
      console.log('❌ Smart contract simulation failed:', response.status);
    }
    
    // Test 2: Kiểm tra API endpoint
    console.log('\n📋 Test 2: API Endpoint');
    const apiResponse = await fetch('http://localhost:3005/api/simulate-swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputToken: "0x1::aptos_coin::AptosCoin",
        outputToken: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
        inputAmount: "10000000"
      })
    });
    
    if (apiResponse.ok) {
      const apiResult = await apiResponse.json();
      console.log('✅ API endpoint working:', {
        success: apiResult.success,
        totalQuotes: apiResult.totalQuotes,
        bestQuote: apiResult.bestQuote?.dex
      });
    } else {
      console.log('❌ API endpoint failed:', apiResponse.status);
    }
    
    // Test 3: Kiểm tra pool data fetching
    console.log('\n📋 Test 3: Pool Data Fetching');
    const poolAddress = "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12";
    
    try {
      const aptResponse = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${poolAddress}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`);
      if (aptResponse.ok) {
        const aptData = await aptResponse.json();
        console.log('✅ APT pool data fetched successfully');
      } else {
        console.log('❌ APT pool data fetch failed:', aptResponse.status);
      }
    } catch (error) {
      console.log('❌ Pool data fetch error:', error.message);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Chạy test
testSwapFixes(); 