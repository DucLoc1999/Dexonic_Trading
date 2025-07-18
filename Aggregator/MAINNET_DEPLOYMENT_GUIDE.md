# 🚀 Hướng dẫn Deploy Smart Contract lên Mainnet Aptos

## 📋 Prerequisites

### 1. Cài đặt Aptos CLI
```bash
# Cài đặt Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Kiểm tra version
aptos --version
```

### 2. Tạo ví và lấy private key
```bash
# Tạo ví mới (nếu chưa có)
aptos init --profile mainnet

# Hoặc import ví hiện có
aptos key import --profile mainnet
```

### 3. Kiểm tra balance
```bash
# Kiểm tra balance APT
aptos account list --profile mainnet
```

## 🔧 Bước 1: Cấu hình Mainnet

### 1.1 Cập nhật aptos.config.toml
```toml
[mainnet]
private_key = "0xYOUR_PRIVATE_KEY_HERE"
account = "0xYOUR_ACCOUNT_ADDRESS"
rest_url = "https://fullnode.mainnet.aptoslabs.com"
```

### 1.2 Kiểm tra cấu hình
```bash
# Kiểm tra profile mainnet
aptos account list --profile mainnet

# Kiểm tra balance
aptos account list --profile mainnet --query balance
```

## 🏗️ Bước 2: Compile Smart Contract

### 2.1 Compile với mainnet profile
```bash
cd aptos-multiswap-aggregator-v3

# Compile smart contract
aptos move compile --profile mainnet

# Kiểm tra build thành công
ls -la build/AptosMultiswapAggregator/bytecode_modules/
```

### 2.2 Kiểm tra bytecode
```bash
# Xem bytecode đã compile
aptos move list --profile mainnet
```

## 🚀 Bước 3: Deploy Smart Contract

### 3.1 Deploy lên mainnet
```bash
# Deploy smart contract
aptos move publish --profile mainnet --named-addresses aggregator=0xYOUR_ACCOUNT_ADDRESS

# Lưu ý: Thay 0xYOUR_ACCOUNT_ADDRESS bằng địa chỉ ví của bạn
```

### 3.2 Kiểm tra deploy thành công
```bash
# Kiểm tra module đã deploy
aptos move list --profile mainnet

# Xem transaction hash
aptos account list --profile mainnet --query transactions
```

## ⚙️ Bước 4: Initialize Smart Contract

### 4.1 Initialize aggregator
```bash
# Initialize smart contract
aptos move run --profile mainnet \
  --function-id 0xYOUR_ACCOUNT_ADDRESS::aggregator::initialize
```

### 4.2 Setup default pools
```bash
# Setup pools mặc định
aptos move run --profile mainnet \
  --function-id 0xYOUR_ACCOUNT_ADDRESS::aggregator::setup_default_pools
```

## 🧪 Bước 5: Test Smart Contract

### 5.1 Test get_best_quote
```bash
# Test simulate_swap
aptos move run --profile mainnet \
  --function-id 0xYOUR_ACCOUNT_ADDRESS::aggregator::simulate_swap \
  --type-args 0x1::aptos_coin::AptosCoin 0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge \
  --args 1000000
```

### 5.2 Test get_quote_details
```bash
# Test get_quote_details
aptos move run --profile mainnet \
  --function-id 0xYOUR_ACCOUNT_ADDRESS::aggregator::get_quote_details \
  --type-args 0x1::aptos_coin::AptosCoin 0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge \
  --args 1000000
```

## 🔍 Bước 6: Verify Deployment

### 6.1 Kiểm tra module trên explorer
```bash
# Mở Aptos Explorer
open https://explorer.aptoslabs.com/account/0xYOUR_ACCOUNT_ADDRESS?network=mainnet
```

### 6.2 Kiểm tra events
```bash
# Xem events của smart contract
aptos account list --profile mainnet --query events
```

## 📝 Bước 7: Cập nhật Frontend

### 7.1 Cập nhật contract address
```javascript
// Trong file config hoặc constants
const CONTRACT_ADDRESS = "0xYOUR_ACCOUNT_ADDRESS";
const MODULE_NAME = "aggregator";
```

### 7.2 Test frontend integration
```bash
# Chạy frontend
cd ..
pnpm dev
```

## ⚠️ Lưu ý quan trọng

### 1. Gas Fees
- Mainnet gas fees cao hơn testnet
- Đảm bảo có đủ APT cho gas fees
- Ước tính: 0.1-0.5 APT cho deploy + initialize

### 2. Security
- Không chia sẻ private key
- Sử dụng .env file để lưu private key
- Backup private key an toàn

### 3. Testing
- Test kỹ trên testnet trước khi deploy mainnet
- Verify tất cả functions hoạt động đúng
- Test với amounts nhỏ trước

## 🔧 Troubleshooting

### 1. Compile Errors
```bash
# Clean build
aptos move clean --profile mainnet

# Recompile
aptos move compile --profile mainnet
```

### 2. Deploy Errors
```bash
# Kiểm tra balance
aptos account list --profile mainnet --query balance

# Kiểm tra sequence number
aptos account list --profile mainnet --query sequence_number
```

### 3. Initialize Errors
```bash
# Kiểm tra module đã deploy
aptos move list --profile mainnet

# Kiểm tra permissions
aptos account list --profile mainnet
```

## 📊 Monitoring

### 1. Transaction Monitoring
```bash
# Monitor transactions
aptos account list --profile mainnet --query transactions

# Monitor events
aptos account list --profile mainnet --query events
```

### 2. Explorer Monitoring
- [Aptos Explorer](https://explorer.aptoslabs.com/)
- [Aptoscan](https://aptoscan.com/)

## 🎯 Checklist

- [ ] Cài đặt Aptos CLI
- [ ] Tạo/import ví với đủ APT
- [ ] Cấu hình mainnet profile
- [ ] Compile smart contract
- [ ] Deploy smart contract
- [ ] Initialize aggregator
- [ ] Setup default pools
- [ ] Test các functions
- [ ] Verify trên explorer
- [ ] Cập nhật frontend
- [ ] Test frontend integration

## 🚨 Emergency Procedures

### 1. Pause Smart Contract
```bash
aptos move run --profile mainnet \
  --function-id 0xYOUR_ACCOUNT_ADDRESS::aggregator::pause
```

### 2. Unpause Smart Contract
```bash
aptos move run --profile mainnet \
  --function-id 0xYOUR_ACCOUNT_ADDRESS::aggregator::unpause
```

### 3. Update Config
```bash
aptos move run --profile mainnet \
  --function-id 0xYOUR_ACCOUNT_ADDRESS::aggregator::update_config \
  --args 0xNEW_FEE_RECIPIENT NEW_PLATFORM_FEE NEW_MAX_SLIPPAGE NEW_QUOTE_CACHE_DURATION NEW_MAX_ROUTE_HOPS NEW_MIN_LIQUIDITY_THRESHOLD
```

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs chi tiết
2. Verify cấu hình
3. Test trên testnet trước
4. Tham khảo [Aptos Documentation](https://aptos.dev/)
5. Join [Aptos Discord](https://discord.gg/aptos)

---

**🎉 Chúc mừng! Smart contract đã được deploy thành công lên mainnet!** 