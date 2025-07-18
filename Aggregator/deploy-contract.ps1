# Aptos DEX Aggregator Deployment Script for Windows
# This script compiles and deploys the Move contracts to Aptos testnet

param(
    [switch]$SkipTests,
    [switch]$SkipCompile,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\deploy-contract.ps1 [-SkipTests] [-SkipCompile] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -SkipTests    Skip running tests before deployment"
    Write-Host "  -SkipCompile  Skip compilation (useful for re-deployment)"
    Write-Host "  -Help         Show this help message"
    exit 0
}

# Configuration
$ContractDir = ".\aptos-multiswap-aggregator"
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Aptos DEX Aggregator Deployment..." -ForegroundColor Green
Write-Host ""

try {
    # Step 1: Check if we're in the right directory
    Write-Host "📁 Checking project structure..." -ForegroundColor Yellow
    if (-not (Test-Path $ContractDir)) {
        throw "Contract directory $ContractDir not found!"
    }
    Write-Host "✅ Project structure verified" -ForegroundColor Green
    Write-Host ""

    # Step 2: Navigate to contract directory
    Write-Host "📂 Navigating to contract directory..." -ForegroundColor Yellow
    Set-Location $ContractDir
    Write-Host "✅ Changed to contract directory" -ForegroundColor Green
    Write-Host ""

    # Step 3: Check if aptos CLI is installed
    Write-Host "🔧 Checking Aptos CLI installation..." -ForegroundColor Yellow
    try {
        $aptosVersion = aptos --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Aptos CLI is installed: $aptosVersion" -ForegroundColor Green
        } else {
            throw "Aptos CLI not found"
        }
    } catch {
        throw "Aptos CLI is not installed. Please install it first: https://aptos.dev/tools/aptos-cli/"
    }
    Write-Host ""

    # Step 4: Check if account is configured
    Write-Host "👤 Checking account configuration..." -ForegroundColor Yellow
    try {
        $accountInfo = aptos account list 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Account configuration found" -ForegroundColor Green
            Write-Host $accountInfo
        } else {
            Write-Host "⚠️  No account configured. You may need to run: aptos init" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not check account configuration" -ForegroundColor Yellow
    }
    Write-Host ""

    # Step 5: Compile contracts (unless skipped)
    if (-not $SkipCompile) {
        Write-Host "🔨 Compiling Move contracts..." -ForegroundColor Yellow
        try {
            aptos move compile
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Contracts compiled successfully" -ForegroundColor Green
            } else {
                throw "Compilation failed"
            }
        } catch {
            throw "Contract compilation failed!"
        }
        Write-Host ""
    } else {
        Write-Host "⏭️  Skipping compilation..." -ForegroundColor Yellow
        Write-Host ""
    }

    # Step 6: Run tests (unless skipped)
    if (-not $SkipTests) {
        Write-Host "🧪 Running contract tests..." -ForegroundColor Yellow
        try {
            aptos move test
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ All tests passed" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Some tests failed, but continuing with deployment..." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️  Test execution failed, but continuing..." -ForegroundColor Yellow
        }
        Write-Host ""
    } else {
        Write-Host "⏭️  Skipping tests..." -ForegroundColor Yellow
        Write-Host ""
    }

    # Step 7: Deploy contracts
    Write-Host "📤 Deploying contracts to testnet..." -ForegroundColor Yellow
    try {
        aptos move publish
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Contracts deployed successfully" -ForegroundColor Green
        } else {
            throw "Deployment failed"
        }
    } catch {
        throw "Contract deployment failed!"
    }
    Write-Host ""

    # Step 8: Get deployment information
    Write-Host "📋 Getting deployment information..." -ForegroundColor Yellow
    try {
        $accountInfo = aptos account list 2>$null
        if ($LASTEXITCODE -eq 0) {
            $lines = $accountInfo -split "`n"
            $accountLine = $lines | Where-Object { $_ -match "default" } | Select-Object -First 1
            if ($accountLine) {
                $address = ($accountLine -split "\s+")[0]
                Write-Host "✅ Deployment completed!" -ForegroundColor Green
                Write-Host "📍 Contract address: $address" -ForegroundColor Cyan
                Write-Host "🔗 View on explorer: https://explorer.aptoslabs.com/account/$address?network=testnet" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "📝 Next steps:" -ForegroundColor Yellow
                Write-Host "1. Initialize the aggregator: aptos move run --function-id ${address}::multiswap_aggregator_v2::initialize"
                Write-Host "2. Initialize AptosDoge: aptos move run --function-id ${address}::aptosdoge::initialize"
                Write-Host "3. Setup pools: aptos move run --function-id ${address}::multiswap_aggregator_v2::setup_default_pools"
                Write-Host "4. Mint AptosDoge: aptos move run --function-id ${address}::aptosdoge::mint --args $address `"u64:1000000000`""
                Write-Host ""
                Write-Host "💡 Or use the frontend admin panel to initialize everything!" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "⚠️  Could not retrieve deployment information" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🎉 Deployment process completed!" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure you have the Aptos CLI installed"
    Write-Host "2. Run 'aptos init' to configure your account"
    Write-Host "3. Ensure you have enough testnet APT for deployment"
    Write-Host "4. Check that all dependencies are properly configured"
    Write-Host "5. Try running with -SkipTests if tests are failing"
    exit 1
} 