# Pool Discovery Guide - Hướng dẫn tìm và add pools

## Tình trạng hiện tại

Sau khi kiểm tra, các pools sau **chưa tồn tại** trên mainnet:
- **Panora**: Chưa có pools APT/USDC, APT/USDT
- **Liquidswap**: Chưa có pools APT/USDC, APT/USDT  
- **AnimeSwap**: Chưa có pools APT/USDC, APT/USDT
- **Amnis**: Chưa có pools

## Cách tìm pools thực tế

### 1. Kiểm tra DEX UI
```bash
# Panora
https://app.panora.xyz/pools

# Liquidswap  
https://liquidswap.com/pools

# AnimeSwap
https://animeswap.finance/pools

# Amnis
https://amnis.finance/pools
```

### 2. Kiểm tra blockchain trực tiếp
```bash
# Tìm pools trên một DEX
curl "https://fullnode.mainnet.aptoslabs.com/v1/accounts/<DEX_ADDRESS>/resources" | grep -i pool

# Ví dụ với Panora
curl "https://fullnode.mainnet.aptoslabs.com/v1/accounts/0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb/resources" | grep -i pool
```

### 3. Sử dụng API của DEX
```bash
# Panora API
curl https://api.panora.xyz/v1/pools

# Liquidswap API  
curl https://api.liquidswap.com/v1/pools

# AnimeSwap API
curl https://api.animeswap.finance/v1/pools
```

## Khi tìm thấy pool

### 1. Lấy pool address
```
Pool Address: 0x1234::pool::Pool<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>
```

### 2. Add vào aggregator
```bash
# Add APT/USDC pool
aptos move run \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::add_real_liquidswap_pool \
  --type-args 0x1::aptos_coin::AptosCoin 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC \
  --args "0x1234::pool::Pool<APT,USDC>" 0 30

# Add APT/USDT pool  
aptos move run \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::add_real_liquidswap_pool \
  --type-args 0x1::aptos_coin::AptosCoin 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT \
  --args "0x1234::pool::Pool<APT,USDT>" 0 30
```

## Tạo pools mới

### 1. Trên Panora
```bash
# Tạo pool APT/USDC
# 1. Vào https://app.panora.xyz/create-pool
# 2. Chọn APT và USDC
# 3. Add liquidity
# 4. Copy pool address
```

### 2. Trên Liquidswap
```bash
# Tạo pool APT/USDC
# 1. Vào https://liquidswap.com/create-pool
# 2. Chọn APT và USDC
# 3. Add liquidity
# 4. Copy pool address
```

### 3. Trên AnimeSwap
```bash
# Tạo pool APT/USDC
# 1. Vào https://animeswap.finance/create-pool
# 2. Chọn APT và USDC
# 3. Add liquidity
# 4. Copy pool address
```

## Script tự động tìm pools

Tạo file `monitor-pools.js`:
```javascript
const https = require('https');

async function checkPools() {
  const dexes = [
    { name: 'Panora', address: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb' },
    { name: 'Liquidswap', address: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12' },
    { name: 'AnimeSwap', address: '0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa323c' }
  ];

  for (const dex of dexes) {
    try {
      const response = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${dex.address}/resources`);
      const data = await response.json();
      
      const pools = data.data?.filter(r => r.type.includes('pool')) || [];
      if (pools.length > 0) {
        console.log(`✅ ${dex.name}: ${pools.length} pools found`);
        pools.forEach(pool => console.log(`   ${pool.type}`));
      }
    } catch (error) {
      console.log(`❌ ${dex.name}: ${error.message}`);
    }
  }
}

// Chạy mỗi 5 phút
setInterval(checkPools, 5 * 60 * 1000);
checkPools();
```

## Lưu ý quan trọng

1. **Pools phải có đủ liquidity** (>= 1000 USD)
2. **Pool address phải chính xác**
3. **Fee rate phải khớp với pool thực tế**
4. **Token types phải đúng**

## Test sau khi add pool

```bash
# Test swap qua pool mới
curl -X POST http://localhost:3001/api/simulate-swap \
  -H "Content-Type: application/json" \
  -d '{"fromToken":"APT","toToken":"USDC","amount":"1000000"}'
```

## Troubleshooting

### Lỗi "Pool not found":
- Kiểm tra pool address có đúng không
- Đảm bảo pool đã được tạo trên DEX
- Verify pool có đủ liquidity

### Lỗi "Module not found":
- Kiểm tra DEX contract đã được deploy chưa
- Verify module address và name chính xác

### Lỗi "Insufficient liquidity":
- Cập nhật liquidity value trong pool info
- Kiểm tra pool có đủ liquidity thực tế không 