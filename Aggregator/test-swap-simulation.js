const { AptosClient, AptosAccount, TxnBuilderTypes, BCS } = require("aptos");

const client = new AptosClient("https://fullnode.mainnet.aptoslabs.com");

const AGGREGATOR_ADDRESS = "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";
const ADMIN_PRIVATE_KEY = "6708FC6C7CDCBE1B439936FB781D59B23A071F75A6C13A462C6EDB44E28561E9";

async function testSwapSimulation() {
  try {
    // Create admin account
    const adminAccount = new AptosAccount(Buffer.from(ADMIN_PRIVATE_KEY, 'hex'));
    console.log("Admin address:", adminAccount.address().toString());

    // Test swap simulation
    const payload = {
      type: "entry_function_payload",
      function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_exact_input`,
      type_arguments: [
        "0x1::aptos_coin::AptosCoin",
        "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T"
      ],
      arguments: [
        "1000000", // 0.01 APT
        "950000",  // min output
        Math.floor(Date.now() / 1000) + 3600 // deadline 1 hour from now
      ]
    };

    console.log("Testing swap simulation...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Simulate transaction
    const simulation = await client.simulateTransaction(adminAccount, payload);
    console.log("Simulation result:", JSON.stringify(simulation, null, 2));
    
  } catch (error) {
    console.error("Error testing swap simulation:", error);
  }
}

testSwapSimulation(); 