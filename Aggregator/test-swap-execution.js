// Test script để kiểm tra swap execution
const { AptosClient } = require('aptos');

const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com');

async function testSwapExecution() {
  try {
    // Test simulate_swap function
    console.log('🔄 Testing simulate_swap...');
    const simulateResult = await client.view({
      function: '0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127::multiswap_aggregator_v4::simulate_swap',
      type_arguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T'
      ],
      arguments: ['10000000'] // 10 APT
    });
    
    console.log('✅ Simulate result:', simulateResult);
    
    // Test get_config function
    console.log('🔄 Testing get_config...');
    const configResult = await client.view({
      function: '0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127::multiswap_aggregator_v4::get_config',
      type_arguments: [],
      arguments: []
    });
    
    console.log('✅ Config result:', configResult);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSwapExecution(); 