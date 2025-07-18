// Test script to check balance fetching
async function testBalanceFetch() {
  const testAddress = "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8";
  const aptTokenAddress = "0x1::aptos_coin::AptosCoin";
  const nodeUrl = "https://fullnode.mainnet.aptoslabs.com";
  
  console.log(`Testing balance fetch for address: ${testAddress}`);
  console.log(`Token: ${aptTokenAddress}`);
  console.log(`Node URL: ${nodeUrl}`);
  
  try {
    // Get all resources for the account
    const res = await fetch(`${nodeUrl}/v1/accounts/${testAddress}/resources`);
    console.log(`Response status: ${res.status}`);
    
    if (!res.ok) {
      console.log(`Failed to fetch resources: ${res.statusText}`);
      return;
    }
    
    const resources = await res.json();
    console.log(`Found ${resources.length} resources`);
    
    // Find CoinStore for APT
    const coinStore = resources.find((r) => {
      const isMatch = r.type.startsWith(`0x1::coin::CoinStore<${aptTokenAddress}>`);
      if (isMatch) {
        console.log(`Found CoinStore:`, r);
      }
      return isMatch;
    });
    
    if (coinStore && coinStore.data && coinStore.data.coin && coinStore.data.coin.value) {
      const balance = (Number(coinStore.data.coin.value) / Math.pow(10, 8)).toFixed(4);
      console.log(`APT Balance: ${balance}`);
    } else {
      console.log(`No APT CoinStore found`);
    }
    
    // List all resources for debugging
    console.log("\nAll resources:");
    resources.forEach((r, i) => {
      console.log(`${i + 1}. ${r.type}`);
    });
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testBalanceFetch(); 