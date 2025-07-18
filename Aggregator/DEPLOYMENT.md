# Aptos DEX Aggregator Deployment Guide

This guide will help you deploy the Aptos DEX Aggregator contracts to the Aptos testnet and initialize them for use.

## Prerequisites

1. **Aptos CLI**: Install the Aptos CLI from [https://aptos.dev/tools/aptos-cli/](https://aptos.dev/tools/aptos-cli/)
2. **Testnet APT**: Get testnet APT from the [Aptos Faucet](https://aptoslabs.com/testnet-faucet)
3. **Petra Wallet**: Install the Petra wallet extension for your browser

## Quick Deployment

### Option 1: Automated Script (Recommended)

#### For Windows:
```powershell
# Run the PowerShell deployment script
.\deploy-contract.ps1

# Or skip tests if they're failing
.\deploy-contract.ps1 -SkipTests

# Or skip compilation for re-deployment
.\deploy-contract.ps1 -SkipCompile
```

#### For Linux/Mac:
```bash
# Run the Node.js deployment script
node deploy-contract.js
```

### Option 2: Manual Deployment

1. **Navigate to the contract directory:**
   ```bash
   cd aptos-multiswap-aggregator
   ```

2. **Initialize Aptos CLI (if not done already):**
   ```bash
   aptos init
   ```

3. **Compile the contracts:**
   ```bash
   aptos move compile
   ```

4. **Run tests (optional):**
   ```bash
   aptos move test
   ```

5. **Deploy to testnet:**
   ```bash
   aptos move publish
   ```

## Post-Deployment Initialization

After successful deployment, you need to initialize the contracts. You can do this in two ways:

### Option 1: Frontend Admin Panel (Recommended)

1. **Start the frontend application:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Navigate to the swap page:**
   ```
   http://localhost:3000/swap
   ```

3. **Connect your admin wallet:**
   - Make sure your Petra wallet is connected with the admin account
   - The admin account should be the same address that deployed the contracts

4. **Use the Admin Initializer:**
   - The admin panel will appear automatically if you're connected with the admin account
   - Click "Initialize All" to run all initialization steps
   - Monitor the progress and status updates

### Option 2: Command Line

If you prefer to use the command line, run these commands in sequence:

1. **Initialize the aggregator:**
   ```bash
   aptos move run --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::initialize
   ```

2. **Initialize AptosDoge token:**
   ```bash
   aptos move run --function-id <YOUR_ADDRESS>::aptosdoge::initialize
   ```

3. **Setup default pools:**
   ```bash
   aptos move run --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::setup_default_pools
   ```

4. **Mint AptosDoge for testing:**
   ```bash
   aptos move run --function-id <YOUR_ADDRESS>::aptosdoge::mint --args <YOUR_ADDRESS> "u64:1000000000"
   ```

## Verification

### Check Contract Status

1. **View on Aptos Explorer:**
   ```
   https://explorer.aptoslabs.com/account/<YOUR_ADDRESS>?network=testnet
   ```

2. **Check initialization status:**
   ```bash
   aptos move view --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::get_config
   ```

3. **Test a swap simulation:**
   ```bash
   aptos move view --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::simulate_swap --type-args 0x1::aptos_coin::AptosCoin <YOUR_ADDRESS>::aptosdoge::AptosDoge --args "u64:10000000"
   ```

### Frontend Testing

1. **Connect a non-admin wallet** to test regular user functionality
2. **Try swapping APT to APDOGE** using the swap interface
3. **Test cross-address swaps** by entering a different receiver address
4. **Verify quotes are being fetched** from the aggregator

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com
NEXT_PUBLIC_AGGREGATOR_ADDRESS=<YOUR_DEPLOYED_ADDRESS>
```

### Contract Addresses

Update the following files with your deployed contract address:

1. **Frontend configuration** (`app/swap/page.tsx`):
   ```typescript
   const AGGREGATOR_ADDRESS = "YOUR_DEPLOYED_ADDRESS"
   ```

2. **API endpoints** (`app/api/simulate-swap/route.ts`):
   ```typescript
   function: 'YOUR_DEPLOYED_ADDRESS::multiswap_aggregator::simulate_swap'
   ```

3. **Admin initializer** (`components/swap/admin-initializer.tsx`):
   ```typescript
   const AGGREGATOR_ADDRESS = "YOUR_DEPLOYED_ADDRESS"
   ```

## Troubleshooting

### Common Issues

1. **"Aptos CLI not found"**
   - Install Aptos CLI: `curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3`

2. **"Insufficient balance"**
   - Get testnet APT from the faucet: https://aptoslabs.com/testnet-faucet

3. **"Module not found"**
   - Make sure you're in the correct directory: `aptos-multiswap-aggregator`
   - Run `aptos move compile` before publishing

4. **"Admin access denied"**
   - Ensure you're connected with the admin wallet (same address that deployed contracts)
   - Check that the wallet address matches the deployed contract address

5. **"Transaction failed"**
   - Check the transaction on the explorer for detailed error messages
   - Ensure you have enough APT for gas fees
   - Verify the contract is properly initialized

### Debug Commands

```bash
# Check account balance
aptos account list

# View transaction details
aptos transaction show <TRANSACTION_HASH>

# Check module resources
aptos account list --query resources

# View specific resource
aptos account list --query resources --resource-type <RESOURCE_TYPE>
```

## Security Notes

1. **Never share your private keys** or seed phrases
2. **Use testnet for development** and testing
3. **Verify contract addresses** before interacting
4. **Test thoroughly** before mainnet deployment
5. **Keep your admin keys secure** - they control the aggregator

## Support

If you encounter issues:

1. Check the [Aptos Discord](https://discord.gg/aptos)
2. Review the [Aptos Documentation](https://aptos.dev/)
3. Check the transaction logs on the explorer
4. Verify your environment setup

## Next Steps

After successful deployment and initialization:

1. **Test the swap functionality** with small amounts
2. **Add more token pairs** to the aggregator
3. **Integrate with real DEXs** (Liquidswap, Econia)
4. **Deploy to mainnet** when ready
5. **Set up monitoring** and analytics

---

**Happy Deploying! 🚀** 