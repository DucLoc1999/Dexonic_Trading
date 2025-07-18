#!/bin/bash

echo "🚀 Deploying AptosSwap Smart Contract to Mainnet..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -d "aptos-multiswap-aggregator-v3" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Navigate to contract directory
cd aptos-multiswap-aggregator-v3

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo -e "${YELLOW}Installing Aptos CLI...${NC}"
    curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
fi

echo -e "${YELLOW}⚠️  IMPORTANT: Before deploying to mainnet, make sure you have:${NC}"
echo "1. A wallet with APT for gas fees (recommended: at least 1 APT)"
echo "2. Your private key ready"
echo "3. Tested the contract on testnet first"
echo ""

read -p "Are you ready to deploy to mainnet? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Check if mainnet profile exists
if ! aptos config show-profile mainnet &> /dev/null; then
    echo -e "${YELLOW}Setting up mainnet profile...${NC}"
    echo "Please enter your private key when prompted:"
    aptos init --profile mainnet --network mainnet
else
    echo -e "${GREEN}Mainnet profile already configured${NC}"
fi

# Compile the contract
echo -e "${YELLOW}Compiling smart contract...${NC}"
aptos move compile --package-dir . --named-addresses aggregator=0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

# Deploy to mainnet
echo -e "${YELLOW}Deploying to mainnet...${NC}"
aptos move publish --profile mainnet --package-dir . --named-addresses aggregator=0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract deployed successfully to mainnet!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Note the deployed module address"
    echo "2. Update .env.local with the new contract address"
    echo "3. Deploy frontend to your hosting platform"
    echo ""
    echo "To get the module address, run:"
    echo "aptos account list --profile mainnet"
else
    echo -e "${RED}❌ Contract deployment failed${NC}"
    exit 1
fi 