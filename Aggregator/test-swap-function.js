// Test script để kiểm tra swap function
const AGGREGATOR_ADDRESS = "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";

// Test payload cho swap_exact_input
const testSwapPayload = {
  type: "entry_function_payload",
  function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_exact_input`,
  type_arguments: [
    "0x1::aptos_coin::AptosCoin",
    "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T"
  ],
  arguments: [
    "10000000", // 10 APT in octas
    "9500000",  // min output (9.5 USDC)
    "1752596794" // deadline
  ]
};

// Test payload cho swap_cross_address_v2
const testCrossAddressPayload = {
  type: "entry_function_payload",
  function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_cross_address_v2`,
  type_arguments: [
    "0x1::aptos_coin::AptosCoin",
    "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T"
  ],
  arguments: [
    "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127", // receiver
    "10000000", // 10 APT in octas
    "9500000",  // min output (9.5 USDC)
    "1752596794" // deadline
  ]
};

console.log("Test swap_exact_input payload:");
console.log(JSON.stringify(testSwapPayload, null, 2));

console.log("\nTest swap_cross_address_v2 payload:");
console.log(JSON.stringify(testCrossAddressPayload, null, 2));

console.log("\nCác function có sẵn trong contract:");
console.log("- swap_exact_input<InputCoin, OutputCoin>");
console.log("- swap_cross_address_v2<InputCoin, OutputCoin>");
console.log("- execute_liquidswap_swap<InputCoin, OutputCoin>");
console.log("- execute_econia_swap<InputCoin, OutputCoin>");
console.log("- execute_panora_swap<InputCoin, OutputCoin>");
console.log("- execute_amnis_swap<InputCoin, OutputCoin>");
console.log("- execute_animeswap_swap<InputCoin, OutputCoin>");
console.log("- execute_sushiswap_swap<InputCoin, OutputCoin>"); 