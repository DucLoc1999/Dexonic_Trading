# Smart Contract Deployment & Integration Guide

## 🎯 **Mục tiêu:**
Deploy smart contract aggregator và tích hợp với API để dự án hoạt động hoàn toàn với smart contract.

## 📋 **Tình trạng hiện tại:**

### ✅ **Đã hoàn thành:**
- Smart contract code đã sẵn sàng (`aptos-multiswap-aggregator-v3/sources/`)
- API đã được cập nhật để gọi smart contract
- Fallback mechanism đã được implement

### ❌ **Cần thực hiện:**
- Deploy smart contract lên mainnet
- Test smart contract functions
- Verify contract integration

## 🚀 **Bước 1: Deploy Smart Contract**

### **1.1 Chuẩn bị môi trường:**
```bash
# Cài đặt Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Kiểm tra version
aptos --version
```

### **1.2 Cấu hình Aptos CLI:**
```bash
# Tạo profile mainnet
aptos init --profile mainnet --network mainnet

# Cấu hình account
aptos key generate --output-file mainnet.key
aptos account create --account-file mainnet.key --profile mainnet
```

### **1.3 Deploy contract:**
```bash
# Compile contract
aptos move compile --package-dir aptos-multiswap-aggregator-v3/ --named-addresses aggregator=0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8

# Deploy lên mainnet
aptos move publish --profile mainnet --package-dir aptos-multiswap-aggregator-v3/ --named-addresses aggregator=0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8
```

## 🧪 **Bước 2: Test Smart Contract**

### **2.1 Kiểm tra deployment:**
```bash
# Kiểm tra modules
curl -s "https://fullnode.mainnet.aptoslabs.com/v1/accounts/0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8/modules" | jq '.[].name'
```

### **2.2 Test initialize function:**
```bash
# Initialize contract
aptos move run --profile mainnet --function-id 0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8::multiswap_aggregator_v2::initialize
```

### **2.3 Test get_best_quote function:**
```bash
# Test quote
curl -s -X POST "https://fullnode.mainnet.aptoslabs.com/v1/view" \
  -H "Content-Type: application/json" \
  -d '{
    "function":"0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8::multiswap_aggregator_v2::get_best_quote",
    "type_arguments":["0x1::aptos_coin::AptosCoin","0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"],
    "arguments":["10000000"]
  }'
```

## 🔧 **Bước 3: Cập nhật API Integration**

### **3.1 Cập nhật contract address (nếu cần):**
```typescript
// Trong app/api/simulate-swap/route.ts
const AGGREGATOR_CONTRACT = '0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8'
```

### **3.2 Test API với smart contract:**
```bash
# Test API
curl -s "http://localhost:3001/api/simulate-swap" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "inputToken":"0x1::aptos_coin::AptosCoin",
    "outputToken":"0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    "inputAmount":"10000000"
  }'
```

## 📊 **Bước 4: Verify Integration**

### **4.1 Kiểm tra response:**
API response nên bao gồm:
```json
{
  "quotes": [
    {
      "dex": "Aggregator (DEX 1)",
      "outputAmount": "0.514865",
      "fee": "0.22",
      "priceImpact": "0.14",
      "route": ["Aggregator"],
      "hops": 1,
      "liquidityScore": 1000000,
      "executionTime": 2
    },
    {
      "dex": "Liquidswap",
      "outputAmount": "0.511461",
      "fee": "0.30",
      "priceImpact": "0.10",
      "route": ["Liquidswap"]
    }
  ]
}
```

### **4.2 Kiểm tra logs:**
- Smart contract call thành công
- Fallback mechanism hoạt động
- Error handling đúng

## 🎯 **Bước 5: Frontend Integration**

### **5.1 Cập nhật frontend để sử dụng smart contract:**
```typescript
// Trong app/swap/page.tsx
const executeSwap = async () => {
  // Sử dụng smart contract thay vì API
  const transactionPayload = {
    type: "entry_function_payload",
    function: `${AGGREGATOR_CONTRACT}::multiswap_aggregator_v2::swap_exact_input`,
    type_arguments: [fromToken.address, toToken.address],
    arguments: [amountInOctas, minOutputAmount, deadline]
  }
  
  await signAndSubmitTransaction(transactionPayload)
}
```

## 🔍 **Troubleshooting:**

### **Lỗi thường gặp:**

1. **"Module can't be found"**
   - Contract chưa được deploy
   - Module name sai
   - Address không đúng

2. **"Function not found"**
   - Function name sai
   - Arguments không đúng format

3. **"Type arguments error"**
   - Token addresses không đúng
   - Type arguments format sai

### **Debug commands:**
```bash
# Kiểm tra contract status
curl -s "https://fullnode.mainnet.aptoslabs.com/v1/accounts/0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8"

# Kiểm tra module list
curl -s "https://fullnode.mainnet.aptoslabs.com/v1/accounts/0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8/modules" | jq '.[].name'

# Test function call
aptos move view --function-id 0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8::multiswap_aggregator_v2::get_config
```

## ✅ **Kết quả mong đợi:**

Sau khi hoàn thành, dự án sẽ có:

1. **Smart contract deployed** và hoạt động
2. **API tích hợp** với smart contract
3. **Fallback mechanism** khi contract thất bại
4. **Frontend sử dụng** smart contract cho swaps
5. **Complete decentralization** - không cần backend

## 🚀 **Next Steps:**

1. Deploy smart contract theo hướng dẫn
2. Test các functions
3. Verify API integration
4. Update frontend để sử dụng smart contract
5. Test end-to-end functionality

---

**Khi smart contract được deploy thành công, dự án sẽ hoạt động hoàn toàn với blockchain! 🎉** 