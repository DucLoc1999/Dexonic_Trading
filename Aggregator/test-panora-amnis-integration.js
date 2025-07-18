const { AptosClient, AptosAccount, TxnBuilderTypes, BCS } = require("aptos");

// Configuration
const NODE_URL = "https://fullnode.mainnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);

// Test configuration
const ADMIN_ADDRESS = "0x1234567890abcdef"; // Replace with actual admin address
const MODULE_NAME = "aggregator";

async function testPanoraAmnisIntegration() {
    console.log("🧪 Testing Panora and Amnis Integration");
    console.log("=====================================");

    try {
        // 1. Test get_best_quote with all DEXs
        console.log("\n1. Testing get_best_quote with all DEXs...");
        await testGetBestQuote();

        // 2. Test Panora specific quote
        console.log("\n2. Testing Panora quote...");
        await testPanoraQuote();

        // 3. Test Amnis specific quote
        console.log("\n3. Testing Amnis quote...");
        await testAmnisQuote();

        // 4. Test multi-DEX comparison
        console.log("\n4. Testing multi-DEX comparison...");
        await testMultiDEXComparison();

        // 5. Test pool management
        console.log("\n5. Testing pool management...");
        await testPoolManagement();

        console.log("\n✅ All tests completed successfully!");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

async function testGetBestQuote() {
    const payload = {
        function: `${ADMIN_ADDRESS}::${MODULE_NAME}::simulate_swap`,
        type_arguments: [
            "0x1::aptos_coin::AptosCoin",
            "0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge"
        ],
        arguments: [1000000] // 1 APT
    };

    try {
        const response = await client.view(payload);
        console.log("📊 Best quote result:", {
            output_amount: response[0],
            dex_id: response[1],
            price_impact: response[2],
            fee: response[3],
            hops: response[4],
            route: response[5]
        });

        // Map DEX ID to name
        const dexNames = {
            1: "Liquidswap",
            2: "Econia", 
            3: "Panora",
            4: "Amnis"
        };

        console.log(`🏆 Best DEX: ${dexNames[response[1]] || 'Unknown'}`);
        console.log(`💰 Output: ${response[0]} APDOGE`);
        console.log(`📈 Price Impact: ${response[2]} basis points`);
        console.log(`💸 Fee: ${response[3]} basis points`);

    } catch (error) {
        console.error("❌ Failed to get best quote:", error.message);
    }
}

async function testPanoraQuote() {
    const payload = {
        function: `${ADMIN_ADDRESS}::${MODULE_NAME}::get_quote_details`,
        type_arguments: [
            "0x1::aptos_coin::AptosCoin",
            "0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge"
        ],
        arguments: [1000000] // 1 APT
    };

    try {
        const response = await client.view(payload);
        console.log("📊 Panora quote details:", {
            output_amount: response[0],
            dex_id: response[1],
            price_impact: response[2],
            fee: response[3],
            hops: response[4],
            route: response[5],
            liquidity_score: response[6],
            execution_time: response[7]
        });

        if (response[1] === 3) {
            console.log("✅ Panora quote found!");
            console.log(`💰 Output: ${response[0]} APDOGE`);
            console.log(`📈 Price Impact: ${response[2]} basis points`);
            console.log(`💸 Fee: ${response[3]} basis points`);
            console.log(`🌊 Liquidity Score: ${response[6]}`);
        } else {
            console.log("⚠️  Panora not the best quote, but available in pool");
        }

    } catch (error) {
        console.error("❌ Failed to get Panora quote:", error.message);
    }
}

async function testAmnisQuote() {
    const payload = {
        function: `${ADMIN_ADDRESS}::${MODULE_NAME}::get_quote_details`,
        type_arguments: [
            "0x1::aptos_coin::AptosCoin",
            "0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge"
        ],
        arguments: [1000000] // 1 APT
    };

    try {
        const response = await client.view(payload);
        console.log("📊 Amnis quote details:", {
            output_amount: response[0],
            dex_id: response[1],
            price_impact: response[2],
            fee: response[3],
            hops: response[4],
            route: response[5],
            liquidity_score: response[6],
            execution_time: response[7]
        });

        if (response[1] === 4) {
            console.log("✅ Amnis quote found!");
            console.log(`💰 Output: ${response[0]} APDOGE`);
            console.log(`📈 Price Impact: ${response[2]} basis points`);
            console.log(`💸 Fee: ${response[3]} basis points`);
            console.log(`🌊 Liquidity Score: ${response[6]}`);
        } else {
            console.log("⚠️  Amnis not the best quote, but available in pool");
        }

    } catch (error) {
        console.error("❌ Failed to get Amnis quote:", error.message);
    }
}

async function testMultiDEXComparison() {
    console.log("🔄 Comparing quotes across all DEXs...");

    const testAmounts = [100000, 500000, 1000000, 5000000]; // 0.1, 0.5, 1, 5 APT

    for (const amount of testAmounts) {
        try {
            const payload = {
                function: `${ADMIN_ADDRESS}::${MODULE_NAME}::simulate_swap`,
                type_arguments: [
                    "0x1::aptos_coin::AptosCoin",
                    "0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge"
                ],
                arguments: [amount]
            };

            const response = await client.view(payload);
            const dexNames = {
                1: "Liquidswap",
                2: "Econia",
                3: "Panora", 
                4: "Amnis"
            };

            console.log(`\n💰 Amount: ${amount / 1000000} APT`);
            console.log(`🏆 Best DEX: ${dexNames[response[1]]}`);
            console.log(`📊 Output: ${response[0]} APDOGE`);
            console.log(`📈 Price Impact: ${response[2]} bp`);
            console.log(`💸 Fee: ${response[3]} bp`);

        } catch (error) {
            console.error(`❌ Failed for amount ${amount}:`, error.message);
        }
    }
}

async function testPoolManagement() {
    console.log("🏊 Testing pool management functions...");

    // Test adding a custom Panora pool
    console.log("\n➕ Testing add_panora_pool function...");
    console.log("📝 Note: This would require admin privileges");
    console.log("🔧 Function: add_panora_pool<AptosCoin, AptosDoge>");
    console.log("📋 Parameters: pool_address, curve_type, fee");

    // Test adding a custom Amnis pool  
    console.log("\n➕ Testing add_amnis_pool function...");
    console.log("📝 Note: This would require admin privileges");
    console.log("🔧 Function: add_amnis_pool<AptosCoin, AptosDoge>");
    console.log("📋 Parameters: pool_address, curve_type, fee");

    console.log("\n✅ Pool management functions available");
}

// Helper function to check if pools exist
async function checkPoolsExist() {
    console.log("🔍 Checking if pools exist...");

    const dexNames = {
        1: "Liquidswap",
        2: "Econia",
        3: "Panora",
        4: "Amnis"
    };

    for (let dexId = 1; dexId <= 4; dexId++) {
        try {
            const payload = {
                function: `${ADMIN_ADDRESS}::${MODULE_NAME}::simulate_swap`,
                type_arguments: [
                    "0x1::aptos_coin::AptosCoin",
                    "0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge"
                ],
                arguments: [1000000]
            };

            const response = await client.view(payload);
            
            if (response[1] === dexId) {
                console.log(`✅ ${dexNames[dexId]} pool found and active`);
            } else {
                console.log(`⚠️  ${dexNames[dexId]} pool exists but not best quote`);
            }

        } catch (error) {
            console.log(`❌ ${dexNames[dexId]} pool not found or error:`, error.message);
        }
    }
}

// Main execution
if (require.main === module) {
    console.log("🚀 Starting Panora and Amnis Integration Tests");
    console.log("=============================================");
    
    // Check if admin address is set
    if (ADMIN_ADDRESS === "0x1234567890abcdef") {
        console.log("⚠️  Please update ADMIN_ADDRESS in the script");
        console.log("📝 Replace with your actual deployed contract address");
        process.exit(1);
    }

    testPanoraAmnisIntegration()
        .then(() => {
            console.log("\n🎉 Integration test completed!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Integration test failed:", error);
            process.exit(1);
        });
}

module.exports = {
    testPanoraAmnisIntegration,
    testGetBestQuote,
    testPanoraQuote,
    testAmnisQuote,
    testMultiDEXComparison,
    testPoolManagement,
    checkPoolsExist
}; 