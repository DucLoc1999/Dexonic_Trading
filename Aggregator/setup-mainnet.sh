#!/bin/bash

# 🔧 Mainnet Profile Setup Script
# Hướng dẫn cấu hình mainnet profile cho Aptos CLI

set -e

echo "🔧 Setting up Mainnet Profile..."
echo "================================="

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
if [ ! -f "aptos.config.toml" ]; then
    print_error "Please run this script from the aptos-multiswap-aggregator-v3 directory"
    exit 1
fi

# Check Aptos CLI
print_status "Checking Aptos CLI..."
if ! command -v aptos &> /dev/null; then
    print_error "Aptos CLI not found. Please install it first:"
    echo "curl -fsSL \"https://aptos.dev/scripts/install_cli.py\" | python3"
    exit 1
fi
print_success "Aptos CLI found: $(aptos --version)"

# Option 1: Interactive setup
print_status "Choose setup method:"
echo "1. Interactive setup (recommended for new users)"
echo "2. Manual setup with existing private key"
echo "3. Import from existing wallet file"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        print_status "Starting interactive setup..."
        aptos init --profile mainnet --network mainnet
        print_success "Interactive setup completed"
        ;;
    2)
        print_status "Manual setup with private key..."
        read -p "Enter your private key (0x...): " private_key
        read -p "Enter your account address (0x...): " account_address
        
        # Update aptos.config.toml
        sed -i.bak "s/private_key = \"0x\\.\\.\\.\"/private_key = \"$private_key\"/" aptos.config.toml
        sed -i.bak "s/account = \"0x\\.\\.\\.\"/account = \"$account_address\"/" aptos.config.toml
        
        print_success "Manual setup completed"
        ;;
    3)
        print_status "Import from wallet file..."
        read -p "Enter path to your wallet file: " wallet_file
        if [ -f "$wallet_file" ]; then
            aptos key import --profile mainnet --input-file "$wallet_file"
            print_success "Wallet imported successfully"
        else
            print_error "Wallet file not found: $wallet_file"
            exit 1
        fi
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Verify setup
print_status "Verifying mainnet profile..."
if aptos account list --profile mainnet &> /dev/null; then
    print_success "Mainnet profile configured successfully"
    
    # Display account info
    echo
    print_status "Account Information:"
    aptos account list --profile mainnet --query account_address
    aptos account list --profile mainnet --query balance
    
    # Check balance
    BALANCE=$(aptos account list --profile mainnet --query balance | grep -o '[0-9]*' | head -1)
    if [ "$BALANCE" -lt 100000 ]; then
        print_warning "Low balance detected: $BALANCE octa APT"
        print_warning "You need at least 0.1 APT for deployment"
        echo
        print_status "To get APT for mainnet:"
        echo "1. Buy APT from exchanges (Binance, Coinbase, etc.)"
        echo "2. Transfer to your wallet address"
        echo "3. Wait for confirmation"
    else
        print_success "Balance OK: $BALANCE octa APT"
    fi
    
else
    print_error "Mainnet profile verification failed"
    exit 1
fi

# Create test script
print_status "Creating test script..."
cat > test-mainnet.sh << 'EOF'
#!/bin/bash

# Test script for mainnet
echo "🧪 Testing Mainnet Configuration..."

# Test account info
echo "Account Information:"
aptos account list --profile mainnet --query account_address
aptos account list --profile mainnet --query balance

# Test network connectivity
echo "Testing network connectivity..."
if aptos account list --profile mainnet &> /dev/null; then
    echo "✅ Network connection OK"
else
    echo "❌ Network connection failed"
fi

echo "Test completed!"
EOF

chmod +x test-mainnet.sh
print_success "Test script created: test-mainnet.sh"

# Create deployment checklist
print_status "Creating deployment checklist..."
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# 🚀 Mainnet Deployment Checklist

## ✅ Prerequisites
- [ ] Aptos CLI installed
- [ ] Mainnet profile configured
- [ ] Sufficient APT balance (at least 0.1 APT)
- [ ] Private key secured

## 🔧 Smart Contract Deployment
- [ ] Compile smart contract
- [ ] Deploy to mainnet
- [ ] Initialize aggregator
- [ ] Setup default pools
- [ ] Test smart contract functions

## 🌐 Frontend Deployment
- [ ] Update contract address in frontend
- [ ] Update environment variables
- [ ] Test frontend integration
- [ ] Deploy frontend

## 🧪 Testing
- [ ] Test wallet connection
- [ ] Test swap functionality
- [ ] Test error handling
- [ ] Test with small amounts

## 📊 Monitoring
- [ ] Monitor contract on explorer
- [ ] Monitor transactions
- [ ] Monitor gas usage
- [ ] Monitor user interactions

## 🔒 Security
- [ ] Verify contract security
- [ ] Test emergency functions
- [ ] Backup private keys
- [ ] Monitor for vulnerabilities

## 📝 Documentation
- [ ] Update README
- [ ] Document deployment process
- [ ] Create user guides
- [ ] Share with community
EOF

print_success "Deployment checklist created: DEPLOYMENT_CHECKLIST.md"

echo
echo "🎉 Mainnet profile setup completed!"
echo "==================================="
echo
echo "📝 Next steps:"
echo "1. Run: ./test-mainnet.sh (to test configuration)"
echo "2. Run: ./deploy-mainnet.sh (to deploy smart contract)"
echo "3. Follow: DEPLOYMENT_CHECKLIST.md (for complete deployment)"
echo
echo "🔧 Useful commands:"
echo "Check balance: aptos account list --profile mainnet --query balance"
echo "Check account: aptos account list --profile mainnet --query account_address"
echo "Test network: aptos account list --profile mainnet"
echo
print_success "Setup completed! 🚀" 