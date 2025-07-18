const { AptosClient, AptosAccount, TxnBuilderTypes, BCS } = require("aptos");

const client = new AptosClient("https://fullnode.mainnet.aptoslabs.com");

const AGGREGATOR_ADDRESS = "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";
const ADMIN_PRIVATE_KEY = "6708FC6C7CDCBE1B439936FB781D59B23A071F75A6C13A462C6EDB44E28561E9";

async function setupPools() {
  try {
    // Create admin account
    const adminAccount = new AptosAccount(Buffer.from(ADMIN_PRIVATE_KEY, 'hex'));
    console.log("Admin address:", adminAccount.address().toString());

    // Setup pools for APT/USDC pair
    const payload = {
      type: "entry_function_payload",
      function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::setup_default_pools`,
      type_arguments: [],
      arguments: []
    };

    console.log("Setting up default pools...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Submit transaction
    const txnRequest = await client.generateTransaction(adminAccount.address(), payload);
    const signedTxn = await client.signTransaction(adminAccount, txnRequest);
    const txnResult = await client.submitTransaction(signedTxn);
    
    console.log("Transaction submitted:", txnResult.hash);
    
    // Wait for transaction
    await client.waitForTransaction(txnResult.hash);
    console.log("Pools setup completed successfully!");
    
  } catch (error) {
    console.error("Error setting up pools:", error);
  }
}

setupPools(); 