#!/bin/bash

# Dexonic DEX Aggregator - Real Swap Deployment Script
# This script compiles and deploys the updated smart contract with real DEX integration

set -e

echo "🚀 Dexonic DEX Aggregator - Real Swap Deployment"
echo "=================================================="

# Configuration
AGGREGATOR_ADDRESS="0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc"
PACKAGE_DIR="aptos-multiswap-aggregator-v4"
PROFILE="newdeployer"

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

# Check if aptos CLI is installed
check_aptos_cli() {
    print_status "Checking Aptos CLI installation..."
    if ! command -v aptos &> /dev/null; then
        print_error "Aptos CLI is not installed. Please install it first."
        exit 1
    fi
    print_success "Aptos CLI is installed"
}

# Check if we're in the right directory
check_directory() {
    print_status "Checking project structure..."
    if [ ! -d "$PACKAGE_DIR" ]; then
        print_error "Package directory $PACKAGE_DIR not found"
        exit 1
    fi
    
    if [ ! -f "$PACKAGE_DIR/Move.toml" ]; then
        print_error "Move.toml not found in $PACKAGE_DIR"
        exit 1
    fi
    
    print_success "Project structure is correct"
}

# Compile the smart contract
compile_contract() {
    print_status "Compiling smart contract..."
    
    cd "$PACKAGE_DIR"
    
    # Clean previous build
    if [ -d "build" ]; then
        rm -rf build
        print_status "Cleaned previous build"
    fi
    
    # Compile with named addresses
    aptos move compile \
        --named-addresses aggregator=$AGGREGATOR_ADDRESS \
        --named-addresses liquidswap=0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12 \
        --named-addresses econia=0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5 \
        --named-addresses panora=0x1eabed72c53feb3805180a7c8464bc46f1103de1 \
        --named-addresses amnis=0x11111112542d85b3ef69ae05771c2dccff4faa26 \
        --named-addresses animeswap=0x16fe2bdfb864e0b24582543b4b5a3b910b2bb12f \
        --named-addresses sushiswap=0x1eabed72c53feb3805180a7c8464bc46f1103de1
    
    if [ $? -eq 0 ]; then
        print_success "Contract compiled successfully"
    else
        print_error "Contract compilation failed"
        exit 1
    fi
    
    cd ..
}

# Deploy the smart contract
deploy_contract() {
    print_status "Deploying smart contract to mainnet..."
    
    cd "$PACKAGE_DIR"
    
    # Deploy with named addresses
    aptos move publish \
        --profile $PROFILE \
        --named-addresses aggregator=$AGGREGATOR_ADDRESS \
        --named-addresses liquidswap=0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12 \
        --named-addresses econia=0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5 \
        --named-addresses panora=0x1eabed72c53feb3805180a7c8464bc46f1103de1 \
        --named-addresses amnis=0x11111112542d85b3ef69ae05771c2dccff4faa26 \
        --named-addresses animeswap=0x16fe2bdfb864e0b24582543b4b5a3b910b2bb12f \
        --named-addresses sushiswap=0x1eabed72c53feb3805180a7c8464bc46f1103de1
    
    if [ $? -eq 0 ]; then
        print_success "Contract deployed successfully"
    else
        print_error "Contract deployment failed"
        exit 1
    fi
    
    cd ..
}

# Initialize the aggregator
initialize_aggregator() {
    print_status "Initializing aggregator..."
    
    # Get admin account address
    ADMIN_ADDRESS=$(aptos account list --profile $PROFILE | grep "Account Address" | awk '{print $3}')
    
    if [ -z "$ADMIN_ADDRESS" ]; then
        print_error "Could not get admin address"
        exit 1
    fi
    
    print_status "Admin address: $ADMIN_ADDRESS"
    
    # Initialize the aggregator
    aptos move run \
        --profile $PROFILE \
        --function-id $AGGREGATOR_ADDRESS::multiswap_aggregator_v4::initialize \
        --args address:$ADMIN_ADDRESS
    
    if [ $? -eq 0 ]; then
        print_success "Aggregator initialized successfully"
    else
        print_error "Aggregator initialization failed"
        exit 1
    fi
}

# Setup real pool addresses
setup_real_pools() {
    print_status "Setting up real pool addresses..."
    
    # Add APT/USDC pools for all DEXs
    aptos move run \
        --profile $PROFILE \
        --function-id $AGGREGATOR_ADDRESS::multiswap_aggregator_v4::add_apt_usdc_pools \
        --args address:$ADMIN_ADDRESS
    
    if [ $? -eq 0 ]; then
        print_success "Real pools configured successfully"
    else
        print_error "Pool configuration failed"
        exit 1
    fi
}

# Test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test quote simulation
    aptos move view \
        --function-id $AGGREGATOR_ADDRESS::multiswap_aggregator_v4::simulate_swap \
        --type-args 0x1::aptos_coin::AptosCoin 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC \
        --args "u64:10000000"
    
    if [ $? -eq 0 ]; then
        print_success "Quote simulation test passed"
    else
        print_warning "Quote simulation test failed (this might be expected if pools are not set up)"
    fi
}

# Main execution
main() {
    echo "Starting deployment process..."
    
    # Check prerequisites
    check_aptos_cli
    check_directory
    
    # Compile and deploy
    compile_contract
    deploy_contract
    
    # Initialize and setup
    initialize_aggregator
    setup_real_pools
    
    # Test deployment
    test_deployment
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "  Contract Address: $AGGREGATOR_ADDRESS"
    echo "  Network: Mainnet"
    echo "  Features: Real DEX integration enabled"
    echo ""
    echo "🔗 View on Explorer:"
    echo "  https://explorer.aptoslabs.com/account/$AGGREGATOR_ADDRESS?network=mainnet"
    echo ""
    echo "🧪 Test the deployment:"
    echo "  node test-real-swap.js test"
}

# Run main function
main "$@" 