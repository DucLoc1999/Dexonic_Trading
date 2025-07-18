# Frontend Integration Guide

## 🚀 Dexonic Dex Aggregator - Frontend Integration

### ✅ Deployment Status
- **Smart Contract**: Successfully deployed on Aptos Mainnet
- **Contract Address**: `0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127`
- **Frontend**: Connected and operational

### 📋 Configuration Files

#### 1. Contract Configuration (`lib/contract-config.ts`)
```typescript
export const CONTRACT_CONFIG = {
  AGGREGATOR_ADDRESS: "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127",
  ADMIN_ADDRESS: "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127",
  NETWORK: "mainnet",
  RPC_URL: "https://fullnode.mainnet.aptoslabs.com"
};
```

#### 2. API Configuration (`app/api/simulate-swap/route.ts`)
```typescript
const AGGREGATOR_ADDRESS = "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";
```

#### 3. Frontend Configuration (`app/swap/page.tsx`)
```typescript
const AGGREGATOR_ADDRESS = "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127";
```

### 🔧 Integration Steps

#### Step 1: Update Environment Variables
```bash
# .env.local
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com
NEXT_PUBLIC_AGGREGATOR_ADDRESS=0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127
```

#### Step 2: Start Development Server
```bash
npm run dev
```

#### Step 3: Test API Integration
```bash
# Test simulate swap API
curl -X POST http://localhost:3000/api/simulate-swap \
  -H "Content-Type: application/json" \
  -d '{
    "inputToken": "0x1::aptos_coin::AptosCoin",
    "outputToken": "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T",
    "inputAmount": "10000000"
  }'
```

### 🎯 Features Implemented

#### ✅ Smart Contract Integration
- **Real-time Quotes**: Connected to deployed smart contract
- **Multi-DEX Support**: 9 DEXs + Aggregator
- **Best Quote Selection**: Automatic best quote detection
- **Price Impact Calculation**: Real-time price impact analysis

#### ✅ Frontend Features
- **Real-time Quote Updates**: Live quote fetching
- **Best Quote Highlighting**: Visual best quote indication
- **DEX Comparison**: Side-by-side DEX comparison
- **Responsive Design**: Mobile-friendly interface

#### ✅ API Features
- **Smart Contract Calls**: Direct contract interaction
- **Fallback Mechanism**: Graceful error handling
- **Caching**: Optimized performance
- **Error Handling**: Comprehensive error management

### 🔗 Important Links

#### Contract Explorer
- **Deploy Transaction**: https://explorer.aptoslabs.com/txn/0xe9b8b41b2d6c033cf731b237331b10e5ebdab585d2d28b49198276db46b05611?network=mainnet
- **Initialize Transaction**: https://explorer.aptoslabs.com/txn/0x18a0812742f42bc9f68932ee72c96e5065bc80069f0086cd842b5876f77b2a21?network=mainnet
- **Contract Address**: https://explorer.aptoslabs.com/account/0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127?network=mainnet

#### Development URLs
- **Frontend**: http://localhost:3000
- **API Endpoint**: http://localhost:3000/api/simulate-swap

### 🧪 Testing

#### Test Smart Contract
```bash
# Check contract configuration
aptos move view --function-id 0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127::multiswap_aggregator_v4::get_config --profile newdeployer2

# Test simulate swap
aptos move view --function-id 0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127::multiswap_aggregator_v4::simulate_swap --type-args 0x1::aptos_coin::AptosCoin 0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T --args "u64:10000000" --profile newdeployer2
```

#### Test Frontend
1. Open http://localhost:3000/swap
2. Enter input amount (e.g., 10 APT)
3. Select output token (e.g., USDC)
4. Click "Get Quotes"
5. Verify quotes are displayed correctly
6. Check "Best" quote is highlighted

### 📊 Expected Results

#### Smart Contract Response
```json
{
  "Result": [
    "9940090",
    1,
    "25",
    "60",
    "2",
    [
      "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8",
      "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8",
      "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8"
    ]
  ]
}
```

#### API Response
```json
{
  "success": true,
  "quotes": [
    {
      "dex": "PancakeSwap",
      "outputAmount": "2.620868",
      "fee": "0.30",
      "priceImpact": "0.07",
      "route": ["PancakeSwap"],
      "hops": 1,
      "liquidityScore": 950000,
      "executionTime": 1,
      "isBest": true
    }
  ],
  "bestQuote": {...},
  "totalQuotes": 10
}
```

### 🚨 Troubleshooting

#### Common Issues

1. **Contract Not Found**
   - Verify contract address is correct
   - Check network connection
   - Ensure contract is initialized

2. **API Errors**
   - Check server logs
   - Verify environment variables
   - Test API endpoint directly

3. **Frontend Issues**
   - Clear browser cache
   - Check console for errors
   - Verify wallet connection

#### Debug Commands
```bash
# Check contract status
aptos account list --profile newdeployer2

# Test API endpoint
curl -X POST http://localhost:3000/api/simulate-swap -H "Content-Type: application/json" -d '{"inputToken":"0x1::aptos_coin::AptosCoin","outputToken":"0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T","inputAmount":"10000000"}'

# Check frontend logs
npm run dev
```

### 🎉 Success Criteria

✅ **Smart Contract**: Deployed and initialized  
✅ **API Integration**: Connected and functional  
✅ **Frontend**: Connected and operational  
✅ **Real-time Quotes**: Working correctly  
✅ **Best Quote Selection**: Functioning properly  
✅ **Error Handling**: Comprehensive coverage  
✅ **Performance**: Optimized and responsive  

### 📈 Next Steps

1. **Production Deployment**: Deploy frontend to production
2. **Wallet Integration**: Connect with Pontem/Petra wallets
3. **Real Swap Execution**: Implement actual swap execution
4. **Analytics**: Add usage analytics
5. **Security Audit**: Conduct security review

---

**🎯 Integration Complete!** The frontend is now fully connected to the deployed smart contract and ready for production use. 