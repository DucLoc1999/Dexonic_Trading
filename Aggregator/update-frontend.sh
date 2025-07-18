#!/bin/bash

# 🌐 Frontend Update Script
# Cập nhật frontend sau khi deploy smart contract lên mainnet

set -e

echo "🌐 Updating Frontend for Mainnet..."
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if deployment-info.txt exists
if [ ! -f "aptos-multiswap-aggregator-v3/deployment-info.txt" ]; then
    print_warning "deployment-info.txt not found. Please deploy smart contract first."
    read -p "Enter your contract address (0x...): " CONTRACT_ADDRESS
    if [ -z "$CONTRACT_ADDRESS" ]; then
        print_error "Contract address is required"
        exit 1
    fi
else
    # Read contract address from deployment-info.txt
    CONTRACT_ADDRESS=$(grep "CONTRACT_ADDRESS=" aptos-multiswap-aggregator-v3/deployment-info.txt | cut -d'=' -f2)
    print_success "Found contract address: $CONTRACT_ADDRESS"
fi

# Step 1: Create mainnet environment file
print_status "Creating mainnet environment file..."
cat > .env.mainnet << EOF
# Mainnet Environment Variables
# Generated on: $(date)

NEXT_PUBLIC_APTOS_NETWORK=mainnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
NEXT_PUBLIC_AGGREGATOR_CONTRACT=$CONTRACT_ADDRESS

# DEX Contract Addresses
NEXT_PUBLIC_LIQUIDSWAP_CONTRACT=0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12
NEXT_PUBLIC_ECONIA_CONTRACT=0xc0deb00c405f84c85dc13442e305df75d9b58c5481e6824349a528b0b78d4bb5

# Token Addresses
NEXT_PUBLIC_APT_COIN=0x1::aptos_coin::AptosCoin
NEXT_PUBLIC_APDOGE_COIN=0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge

# Network Configuration
NEXT_PUBLIC_NETWORK_NAME=Mainnet
NEXT_PUBLIC_CHAIN_ID=1
EOF

print_success "Mainnet environment file created: .env.mainnet"

# Step 2: Update .env.local
print_status "Updating .env.local..."
cp .env.mainnet .env.local
print_success ".env.local updated"

# Step 3: Update frontend configuration
print_status "Updating frontend configuration..."

# Check if config file exists and update it
if [ -f "lib/config.ts" ]; then
    print_status "Updating lib/config.ts..."
    sed -i.bak "s/NEXT_PUBLIC_AGGREGATOR_CONTRACT=.*/NEXT_PUBLIC_AGGREGATOR_CONTRACT=$CONTRACT_ADDRESS/" lib/config.ts
    sed -i.bak "s/NEXT_PUBLIC_APTOS_NETWORK=.*/NEXT_PUBLIC_APTOS_NETWORK=mainnet/" lib/config.ts
    print_success "lib/config.ts updated"
fi

# Step 4: Update constants if they exist
if [ -f "lib/constants.ts" ]; then
    print_status "Updating lib/constants.ts..."
    sed -i.bak "s/AGGREGATOR_CONTRACT=.*/AGGREGATOR_CONTRACT='$CONTRACT_ADDRESS'/" lib/constants.ts
    sed -i.bak "s/APTOS_NETWORK=.*/APTOS_NETWORK='mainnet'/" lib/constants.ts
    print_success "lib/constants.ts updated"
fi

# Step 5: Create deployment configuration
print_status "Creating deployment configuration..."
cat > deployment-config.json << EOF
{
  "contractAddress": "$CONTRACT_ADDRESS",
  "network": "mainnet",
  "nodeUrl": "https://fullnode.mainnet.aptoslabs.com/v1",
  "explorerUrl": "https://explorer.aptoslabs.com/account/$CONTRACT_ADDRESS?network=mainnet",
  "aptoscanUrl": "https://aptoscan.com/account/$CONTRACT_ADDRESS",
  "deploymentDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": {
    "NEXT_PUBLIC_APTOS_NETWORK": "mainnet",
    "NEXT_PUBLIC_APTOS_NODE_URL": "https://fullnode.mainnet.aptoslabs.com/v1",
    "NEXT_PUBLIC_AGGREGATOR_CONTRACT": "$CONTRACT_ADDRESS"
  }
}
EOF

print_success "Deployment configuration created: deployment-config.json"

# Step 6: Build frontend for production
print_status "Building frontend for production..."
if pnpm build; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 7: Create deployment package
print_status "Creating deployment package..."
mkdir -p deployment
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp next.config.mjs deployment/
cp .env.local deployment/
cp deployment-config.json deployment/

# Create start script for deployment
cat > deployment/start.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000

echo "🚀 Starting AptosSwap on Mainnet..."
echo "Contract Address: $NEXT_PUBLIC_AGGREGATOR_CONTRACT"
echo "Network: $NEXT_PUBLIC_APTOS_NETWORK"

pnpm install --prod
pnpm start
EOF

chmod +x deployment/start.sh
print_success "Deployment package created in ./deployment/"

# Step 8: Create Vercel configuration
print_status "Creating Vercel configuration..."
cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_APTOS_NETWORK": "mainnet",
    "NEXT_PUBLIC_APTOS_NODE_URL": "https://fullnode.mainnet.aptoslabs.com/v1",
    "NEXT_PUBLIC_AGGREGATOR_CONTRACT": "$CONTRACT_ADDRESS"
  }
}
EOF

print_success "Vercel configuration created: vercel.json"

# Step 9: Create deployment instructions
print_status "Creating deployment instructions..."
cat > FRONTEND_DEPLOYMENT.md << EOF
# 🌐 Frontend Deployment Instructions

## Contract Information
- **Contract Address**: $CONTRACT_ADDRESS
- **Network**: Mainnet
- **Explorer**: https://explorer.aptoslabs.com/account/$CONTRACT_ADDRESS?network=mainnet

## Deployment Options

### Option 1: Vercel (Recommended)
\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
\`\`\`

### Option 2: Netlify
1. Push code to GitHub
2. Connect repository to Netlify
3. Set build command: \`pnpm build\`
4. Set publish directory: \`.next\`
5. Add environment variables in Netlify dashboard

### Option 3: Self-hosted
\`\`\`bash
# Upload deployment folder to your server
scp -r deployment/ user@your-server:/path/to/app/

# SSH into server and start
ssh user@your-server
cd /path/to/app
chmod +x start.sh
./start.sh
\`\`\`

## Environment Variables
Make sure these are set in your deployment platform:

\`\`\`env
NEXT_PUBLIC_APTOS_NETWORK=mainnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
NEXT_PUBLIC_AGGREGATOR_CONTRACT=$CONTRACT_ADDRESS
\`\`\`

## Testing
After deployment:
1. Test wallet connection
2. Test swap functionality
3. Test with small amounts
4. Monitor for errors

## Monitoring
- Monitor contract on explorer
- Monitor frontend performance
- Monitor user interactions
- Monitor error rates
EOF

print_success "Deployment instructions created: FRONTEND_DEPLOYMENT.md"

# Step 10: Create quick test script
print_status "Creating quick test script..."
cat > test-frontend.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing Frontend Configuration..."

# Check environment variables
echo "Environment Variables:"
echo "NEXT_PUBLIC_APTOS_NETWORK: $NEXT_PUBLIC_APTOS_NETWORK"
echo "NEXT_PUBLIC_AGGREGATOR_CONTRACT: $NEXT_PUBLIC_AGGREGATOR_CONTRACT"

# Start development server
echo "Starting development server..."
echo "Open http://localhost:3001 to test"
echo "Press Ctrl+C to stop"

pnpm dev
EOF

chmod +x test-frontend.sh
print_success "Test script created: test-frontend.sh"

echo
echo "🎉 Frontend update completed!"
echo "============================="
echo
echo "📝 Next steps:"
echo "1. Test locally: ./test-frontend.sh"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Follow: FRONTEND_DEPLOYMENT.md"
echo
echo "🔧 Useful commands:"
echo "Test locally: ./test-frontend.sh"
echo "Build for production: pnpm build"
echo "Deploy to Vercel: vercel --prod"
echo "Deploy package: ./deployment/start.sh"
echo
echo "📊 Contract Information:"
echo "Address: $CONTRACT_ADDRESS"
echo "Explorer: https://explorer.aptoslabs.com/account/$CONTRACT_ADDRESS?network=mainnet"
echo
print_success "Frontend update completed! 🚀" 