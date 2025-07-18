const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONTRACT_DIR = './aptos-multiswap-aggregator';
const APTOS_CONFIG_FILE = path.join(CONTRACT_DIR, 'aptos.config.toml');

console.log('🚀 Starting Aptos DEX Aggregator Deployment...\n');

try {
  // Step 1: Check if we're in the right directory
  console.log('📁 Checking project structure...');
  if (!fs.existsSync(CONTRACT_DIR)) {
    throw new Error(`Contract directory ${CONTRACT_DIR} not found!`);
  }
  console.log('✅ Project structure verified\n');

  // Step 2: Navigate to contract directory
  console.log('📂 Navigating to contract directory...');
  process.chdir(CONTRACT_DIR);
  console.log('✅ Changed to contract directory\n');

  // Step 3: Check if aptos CLI is installed
  console.log('🔧 Checking Aptos CLI installation...');
  try {
    execSync('aptos --version', { stdio: 'pipe' });
    console.log('✅ Aptos CLI is installed\n');
  } catch (error) {
    throw new Error('Aptos CLI is not installed. Please install it first: https://aptos.dev/tools/aptos-cli/');
  }

  // Step 4: Check if account is configured
  console.log('👤 Checking account configuration...');
  try {
    const accountInfo = execSync('aptos account list', { encoding: 'utf8' });
    console.log('✅ Account configuration found');
    console.log(accountInfo);
  } catch (error) {
    console.log('⚠️  No account configured. You may need to run: aptos init');
  }
  console.log('');

  // Step 5: Compile contracts
  console.log('🔨 Compiling Move contracts...');
  try {
    execSync('aptos move compile', { stdio: 'inherit' });
    console.log('✅ Contracts compiled successfully\n');
  } catch (error) {
    throw new Error('Contract compilation failed!');
  }

  // Step 6: Run tests (optional)
  console.log('🧪 Running contract tests...');
  try {
    execSync('aptos move test', { stdio: 'inherit' });
    console.log('✅ All tests passed\n');
  } catch (error) {
    console.log('⚠️  Some tests failed, but continuing with deployment...\n');
  }

  // Step 7: Deploy contracts
  console.log('📤 Deploying contracts to testnet...');
  try {
    execSync('aptos move publish', { stdio: 'inherit' });
    console.log('✅ Contracts deployed successfully\n');
  } catch (error) {
    throw new Error('Contract deployment failed!');
  }

  // Step 8: Get deployment information
  console.log('📋 Getting deployment information...');
  try {
    const accountInfo = execSync('aptos account list', { encoding: 'utf8' });
    const lines = accountInfo.split('\n');
    const accountLine = lines.find(line => line.includes('default'));
    if (accountLine) {
      const address = accountLine.split(/\s+/)[0];
      console.log(`✅ Deployment completed!`);
      console.log(`📍 Contract address: ${address}`);
      console.log(`🔗 View on explorer: https://explorer.aptoslabs.com/account/${address}?network=testnet`);
      console.log(`\n📝 Next steps:`);
      console.log(`1. Initialize the aggregator: aptos move run --function-id ${address}::multiswap_aggregator_v2::initialize`);
      console.log(`2. Initialize AptosDoge: aptos move run --function-id ${address}::aptosdoge::initialize`);
      console.log(`3. Setup pools: aptos move run --function-id ${address}::multiswap_aggregator_v2::setup_default_pools`);
      console.log(`4. Mint AptosDoge: aptos move run --function-id ${address}::aptosdoge::mint --args ${address} "u64:1000000000"`);
    }
  } catch (error) {
    console.log('⚠️  Could not retrieve deployment information');
  }

  console.log('\n🎉 Deployment process completed!');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\n💡 Troubleshooting tips:');
  console.log('1. Make sure you have the Aptos CLI installed');
  console.log('2. Run "aptos init" to configure your account');
  console.log('3. Ensure you have enough testnet APT for deployment');
  console.log('4. Check that all dependencies are properly configured');
  process.exit(1);
} 