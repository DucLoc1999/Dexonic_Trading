#!/usr/bin/env node

/**
 * Add Real APT/USDC Pool to Aggregator Contract
 * 
 * Based on the Liquidswap mainnet data we found:
 * - Pool Address: 0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa
 * - Token X: 0x1::aptos_coin::AptosCoin (APT)
 * - Token Y: 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC
 * - DEX ID: 1 (Liquidswap)
 */

const { execSync } = require('child_process');

// Configuration
const AGGREGATOR_ADDRESS = '0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc';
const POOL_ADDRESS = '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa';
const TOKEN_X = '0x1::aptos_coin::AptosCoin';
const TOKEN_Y = '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC';
const DEX_ID = 1; // Liquidswap

// Estimated liquidity (from the pool data we saw)
const LIQUIDITY_X = 1000000; // APT (estimated)
const LIQUIDITY_Y = 8000000; // USDC (estimated)
const FEE_BPS = 30; // 0.3% fee

console.log('🔧 Adding Real APT/USDC Pool to Aggregator Contract...\n');

console.log('📋 Pool Information:');
console.log('📍 Pool Address:', POOL_ADDRESS);
console.log('🪙 Token X (APT):', TOKEN_X);
console.log('🪙 Token Y (USDC):', TOKEN_Y);
console.log('🏪 DEX ID:', DEX_ID, '(Liquidswap)');
console.log('💰 Liquidity X:', LIQUIDITY_X, 'APT');
console.log('💰 Liquidity Y:', LIQUIDITY_Y, 'USDC');
console.log('💸 Fee:', FEE_BPS, 'basis points (0.3%)\n');

try {
  // Command to add pool to aggregator using the correct function
  const command = `aptos move run \
    --function-id '${AGGREGATOR_ADDRESS}::multiswap_aggregator_v2::add_real_liquidswap_pool' \
    --type-args '${TOKEN_X}' '${TOKEN_Y}' \
    --profile mainnet \
    --args address:${POOL_ADDRESS} u64:0 u64:${FEE_BPS}`;

  console.log('🚀 Executing command:');
  console.log(command);
  console.log('\n⏳ Running...\n');

  // Execute the command
  const result = execSync(command, { encoding: 'utf8' });
  
  console.log('✅ SUCCESS! Pool added to aggregator contract.');
  console.log('📄 Result:', result);
  
} catch (error) {
  console.error('❌ Error adding pool:', error.message);
  
  if (error.message.includes('already exists')) {
    console.log('ℹ️  Pool already exists in the aggregator.');
  } else if (error.message.includes('insufficient balance')) {
    console.log('⚠️  Insufficient balance for gas fees.');
  } else {
    console.log('🔧 Please check the error and try again.');
  }
}

console.log('\n📝 Next Steps:');
console.log('1. Test the aggregator with real pool data');
console.log('2. Verify quotes are now accurate');
console.log('3. Add more pools for other token pairs'); 