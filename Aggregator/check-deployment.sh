#!/bin/bash

echo "🔍 Checking AptosSwap Deployment Status..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "📋 Deployment Status Check"
echo "=========================="

# Check 1: Aptos CLI
print_status "Checking Aptos CLI..."
if command_exists aptos; then
    print_success "Aptos CLI is installed"
    aptos --version
else
    print_error "Aptos CLI not found"
    echo "Install with: curl -fsSL 'https://aptos.dev/scripts/install_cli.py' | python3"
fi

# Check 2: Node.js and pnpm
print_status "Checking Node.js and pnpm..."
if command_exists node; then
    print_success "Node.js is installed"
    node --version
else
    print_error "Node.js not found"
fi

if command_exists pnpm; then
    print_success "pnpm is installed"
    pnpm --version
else
    print_error "pnpm not found"
fi

# Check 3: Build status
print_status "Checking build status..."
if [ -d ".next" ]; then
    print_success "Frontend is built"
else
    print_warning "Frontend not built. Run: ./deploy-simple.sh"
fi

# Check 4: Environment configuration
print_status "Checking environment configuration..."
if [ -f ".env.local" ]; then
    print_success "Environment file exists"
    if grep -q "mainnet" .env.local; then
        print_success "Mainnet configuration detected"
    else
        print_warning "Mainnet configuration not found"
    fi
else
    print_warning "Environment file not found. Run: cp env.mainnet .env.local"
fi

# Check 5: Contract deployment
print_status "Checking smart contract..."
if [ -d "aptos-multiswap-aggregator-v3" ]; then
    print_success "Contract directory exists"
    cd aptos-multiswap-aggregator-v3
    
    if aptos config show-profile mainnet &> /dev/null; then
        print_success "Mainnet profile configured"
    else
        print_warning "Mainnet profile not configured"
    fi
    
    cd ..
else
    print_error "Contract directory not found"
fi

# Check 6: Deployment package
print_status "Checking deployment package..."
if [ -d "deployment" ]; then
    print_success "Deployment package exists"
    ls -la deployment/
else
    print_warning "Deployment package not found. Run: ./deploy-simple.sh"
fi

# Check 7: Vercel CLI
print_status "Checking Vercel CLI..."
if command_exists vercel; then
    print_success "Vercel CLI is installed"
    if vercel whoami &> /dev/null; then
        print_success "Logged in to Vercel"
    else
        print_warning "Not logged in to Vercel. Run: vercel login"
    fi
else
    print_warning "Vercel CLI not installed. Run: npm install -g vercel"
fi

echo ""
echo "📊 Summary:"
echo "==========="

# Count successes and warnings
success_count=$(grep -c "\[✓\]" <<< "$(cat /dev/null)")
warning_count=$(grep -c "\[⚠\]" <<< "$(cat /dev/null)")
error_count=$(grep -c "\[✗\]" <<< "$(cat /dev/null)")

echo "✅ Ready for deployment: $success_count checks passed"
echo "⚠️  Warnings: $warning_count items need attention"
echo "❌ Errors: $error_count critical issues"

echo ""
echo "🚀 Next Steps:"
if [ $error_count -gt 0 ]; then
    echo "1. Fix the errors above"
    echo "2. Run this check again"
else
    echo "1. Deploy smart contract: ./deploy-contract.sh"
    echo "2. Deploy frontend: ./deploy-vercel.sh"
    echo "3. Test the application"
fi

echo ""
echo "📖 For detailed instructions, see: MAINNET_DEPLOYMENT_GUIDE.md" 