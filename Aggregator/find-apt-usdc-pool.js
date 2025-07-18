#!/usr/bin/env node

/**
 * Find APT/USDC Pool Information from Liquidswap Mainnet
 */

const { AptosClient } = require('aptos');

const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com');

async function findAptUsdcPool() {
  try {
    console.log('🔍 Searching for APT/USDC pool on Liquidswap mainnet...\n');
    
    // Get account resources
    const resources = await client.getAccountResources('0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa');
    
    console.log('📊 Found resources:');
    
    // Look for APT/USDC pool
    for (const resource of resources) {
      const type = resource.type;
      
      // Check if this is an APT/USDC pool
      if (type.includes('aptos_coin::AptosCoin') && type.includes('asset::USDC')) {
        console.log('\n🎯 FOUND APT/USDC POOL!');
        console.log('📍 Resource Type:', type);
        console.log('📦 Data:', JSON.stringify(resource.data, null, 2));
        
        // Extract liquidity information
        if (resource.data.reserve_x && resource.data.reserve_y) {
          console.log('\n💰 LIQUIDITY INFORMATION:');
          console.log('APT Reserve (reserve_x):', resource.data.reserve_x);
          console.log('USDC Reserve (reserve_y):', resource.data.reserve_y);
          
          // Calculate APT price in USDC
          const aptReserve = parseInt(resource.data.reserve_x);
          const usdcReserve = parseInt(resource.data.reserve_y);
          const aptPrice = usdcReserve / aptReserve;
          
          console.log('\n💱 PRICE INFORMATION:');
          console.log('1 APT =', aptPrice.toFixed(6), 'USDC');
          console.log('1 USDC =', (1/aptPrice).toFixed(6), 'APT');
        }
        
        return resource;
      }
    }
    
    console.log('❌ No APT/USDC pool found in the resources');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAptUsdcPool(); 