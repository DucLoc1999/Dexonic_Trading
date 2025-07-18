#!/bin/bash

echo "🚀 Deploying AptosSwap to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Set environment variables for mainnet
echo "⚙️ Setting up mainnet environment..."
cp env.mainnet .env.local

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "Your AptosSwap is now live on Vercel!"
echo "Remember to:"
echo "1. Deploy smart contract to mainnet"
echo "2. Update contract addresses in Vercel environment variables"
echo "3. Test the application" 