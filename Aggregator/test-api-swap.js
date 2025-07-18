async function testSwapAPI() {
  try {
    const response = await fetch('http://localhost:3005/api/simulate-swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromToken: "0x1::aptos_coin::AptosCoin",
        toToken: "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T",
        amount: "1000000" // 0.01 APT
      })
    });

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testSwapAPI(); 