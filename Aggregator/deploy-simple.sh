#!/bin/bash

echo "🚀 AptosSwap Mainnet Deployment - Simple Version"

# Clean and build
echo "📦 Cleaning and building..."
rm -rf .next
rm -rf node_modules/.cache
pnpm install

# Build frontend
echo "🏗️ Building frontend..."
cp env.mainnet .env.local
pnpm build

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp next.config.mjs deployment/
cp .env.local deployment/

# Create start script
cat > deployment/start.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
pnpm install --prod
pnpm start
EOF

chmod +x deployment/start.sh

echo "✅ Build complete! Deployment package ready in ./deployment/"
echo ""
echo "Next steps:"
echo "1. Deploy smart contract: cd aptos-multiswap-aggregator-v3 && aptos move publish --profile mainnet"
echo "2. Update contract addresses in .env.local"
echo "3. Deploy frontend to your hosting platform"
echo ""
echo "For Vercel: ./quick-deploy.sh"
echo "For self-hosted: cd deployment && ./start.sh" 