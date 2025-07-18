#!/bin/bash

# 🚀 Mainnet Deployment Script
# Hướng dẫn deploy smart contract lên mainnet Aptos

set -e  # Exit on any error

echo "🚀 Starting Mainnet Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "aptos.config.toml" ]; then
    print_error "Please run this script from the aptos-multiswap-aggregator-v3 directory"
    exit 1
fi

# Step 1: Check Aptos CLI
print_status "Checking Aptos CLI installation..."
if ! command -v aptos &> /dev/null; then
    print_error "Aptos CLI not found. Please install it first:"
    echo "curl -fsSL \"https://aptos.dev/scripts/install_cli.py\" | python3"
    exit 1
fi
print_success "Aptos CLI found: $(aptos --version)"

# Step 2: Check mainnet profile
print_status "Checking mainnet profile..."
if ! aptos account list --profile mainnet &> /dev/null; then
    print_warning "Mainnet profile not configured. Please configure it first:"
    echo "aptos init --profile mainnet"
    echo "Or update aptos.config.toml with your mainnet credentials"
    exit 1
fi
print_success "Mainnet profile configured"

# Step 3: Check balance
print_status "Checking APT balance..."
BALANCE=$(aptos account list --profile mainnet --query balance | grep -o '[0-9]*' | head -1)
if [ "$BALANCE" -lt 100000 ]; then
    print_warning "Low balance detected: $BALANCE octa APT"
    print_warning "Recommended: At least 0.1 APT for deployment"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "Balance OK: $BALANCE octa APT"
fi

# Step 4: Get account address
print_status "Getting account address..."
ACCOUNT_ADDRESS=$(aptos account list --profile mainnet --query account_address | grep -o '0x[a-fA-F0-9]*')
print_success "Account address: $ACCOUNT_ADDRESS"

# Step 5: Compile smart contract
print_status "Compiling smart contract..."
if aptos move compile --profile mainnet; then
print_success "Smart contract compiled successfully"
else
    print_error "Compilation failed"
    exit 1
fi

# Step 6: Deploy smart contract
print_status "Deploying smart contract..."
if aptos move publish --profile mainnet --named-addresses aggregator=$ACCOUNT_ADDRESS; then
    print_success "Smart contract deployed successfully"
else
    print_error "Deployment failed"
    exit 1
fi

# Step 7: Initialize aggregator
print_status "Initializing aggregator..."
if aptos move run --profile mainnet --function-id ${ACCOUNT_ADDRESS}::aggregator::initialize; then
    print_success "Aggregator initialized successfully"
else
    print_error "Initialization failed"
    exit 1
fi

# Step 8: Setup default pools
print_status "Setting up default pools..."
if aptos move run --profile mainnet --function-id ${ACCOUNT_ADDRESS}::aggregator::setup_default_pools; then
    print_success "Default pools setup successfully"
else
    print_error "Pool setup failed"
    exit 1
fi

# Step 9: Test smart contract
print_status "Testing smart contract..."
if aptos move run --profile mainnet --function-id ${ACCOUNT_ADDRESS}::aggregator::simulate_swap --type-args 0x1::aptos_coin::AptosCoin 0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge --args 1000000; then
    print_success "Smart contract test passed"
else
    print_error "Smart contract test failed"
    exit 1
fi

# Step 10: Save deployment info
print_status "Saving deployment information..."
cat > deployment-info.txt << EOF
# Mainnet Deployment Information
# Generated on: $(date)

CONTRACT_ADDRESS=$ACCOUNT_ADDRESS
MODULE_NAME=aggregator
NETWORK=mainnet
NODE_URL=https://fullnode.mainnet.aptoslabs.com

# Environment Variables for Frontend
NEXT_PUBLIC_APTOS_NETWORK=mainnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
NEXT_PUBLIC_AGGREGATOR_CONTRACT=$ACCOUNT_ADDRESS

# Explorer Links
EXPLORER_URL=https://explorer.aptoslabs.com/account/$ACCOUNT_ADDRESS?network=mainnet
APTOSCAN_URL=https://aptoscan.com/account/$ACCOUNT_ADDRESS

# Test Commands
# Test simulate_swap:
# aptos move run --profile mainnet --function-id ${ACCOUNT_ADDRESS}::aggregator::simulate_swap --type-args 0x1::aptos_coin::AptosCoin 0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge --args 1000000

# Test get_quote_details:
# aptos move run --profile mainnet --function-id ${ACCOUNT_ADDRESS}::aggregator::get_quote_details --type-args 0x1::aptos_coin::AptosCoin 0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge --args 1000000
EOF

print_success "Deployment information saved to deployment-info.txt"

# Step 11: Display results
echo
echo "🎉 Deployment completed successfully!"
echo "====================================="
echo "Contract Address: $ACCOUNT_ADDRESS"
echo "Network: Mainnet"
echo "Explorer: https://explorer.aptoslabs.com/account/$ACCOUNT_ADDRESS?network=mainnet"
echo
echo "📝 Next steps:"
echo "1. Update your frontend with the contract address"
echo "2. Test the frontend integration"
echo "3. Monitor the contract on explorer"
echo "4. Check deployment-info.txt for environment variables"
echo
echo "🔧 Emergency commands:"
echo "Pause: aptos move run --profile mainnet --function-id ${ACCOUNT_ADDRESS}::aggregator::pause"
echo "Unpause: aptos move run --profile mainnet --function-id ${ACCOUNT_ADDRESS}::aggregator::unpause"
echo
print_success "Mainnet deployment completed! 🚀" 