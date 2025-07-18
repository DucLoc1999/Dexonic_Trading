#!/usr/bin/env node

/**
 * Get Pool Information and Price from Liquidswap APT/USDC Pool
 */

const { AptosClient } = require('aptos');

const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com');

async function getPoolInfo() {
  try {
    console.log('🔍 Getting APT/USDC Pool Information...\n');
    
    // Pool address we added
    const poolAddress = '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa';
    
    // Get account resources
    const resources = await client.getAccountResources(poolAddress);
    
    console.log('📊 Pool Resources Found:');
    
    // Look for APT/USDC pool resource
    for (const resource of resources) {
      const type = resource.type;
      
      // Check if this is the APT/USDC pool we added
      if (type.includes('TokenPairReserve') && 
          type.includes('aptos_coin::AptosCoin') && 
          type.includes('asset::USDC')) {
        
        console.log('\n🎯 APT/USDC POOL FOUND!');
        console.log('📍 Resource Type:', type);
        console.log('📦 Pool Data:', JSON.stringify(resource.data, null, 2));
        
        // Extract liquidity information
        if (resource.data.reserve_x && resource.data.reserve_y) {
          const aptReserve = parseInt(resource.data.reserve_x);
          const usdcReserve = parseInt(resource.data.reserve_y);
          
          console.log('\n💰 LIQUIDITY INFORMATION:');
          console.log('APT Reserve (reserve_x):', aptReserve.toLocaleString());
          console.log('USDC Reserve (reserve_y):', usdcReserve.toLocaleString());
          
          // Calculate APT price in USDC
          const aptPrice = usdcReserve / aptReserve;
          const usdcPrice = aptReserve / usdcReserve;
          
          console.log('\n💱 PRICE INFORMATION:');
          console.log('1 APT =', aptPrice.toFixed(6), 'USDC');
          console.log('1 USDC =', usdcPrice.toFixed(6), 'APT');
          
          // Calculate for different amounts
          console.log('\n📈 PRICE EXAMPLES:');
          console.log('1 APT =', (aptPrice * 1).toFixed(6), 'USDC');
          console.log('10 APT =', (aptPrice * 10).toFixed(6), 'USDC');
          console.log('100 APT =', (aptPrice * 100).toFixed(6), 'USDC');
          console.log('1000 APT =', (aptPrice * 1000).toFixed(6), 'USDC');
          
          // Calculate swap amounts
          console.log('\n🔄 SWAP CALCULATIONS:');
          const swapAmounts = [1000000, 10000000, 100000000, 1000000000]; // 1, 10, 100, 1000 APT
          
          for (const amount of swapAmounts) {
            const aptAmount = amount / 1000000; // Convert to APT
            const usdcAmount = aptAmount * aptPrice;
            console.log(`${aptAmount} APT = ${usdcAmount.toFixed(6)} USDC`);
          }
          
          return resource;
        }
      }
    }
    
    console.log('❌ APT/USDC pool not found in resources');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getPoolInfo(); 