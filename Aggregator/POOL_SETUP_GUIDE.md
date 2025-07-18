# Pool Setup Guide - Hướng dẫn thiết lập pools

## Sau khi deploy smart contract

### 1. Initialize Contract
```bash
# Deploy contract
aptos move publish --named-addresses aggregator=<YOUR_ADDRESS>

# Initialize contract
aptos move run --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::initialize
```

### 2. Setup Default Pools
```bash
# Setup default pools cho testing
aptos move run --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::setup_default_pools
```

### 3. Add Custom Pools

#### APT/USDC Pool:
```bash
# Add APT/USDC pool với Liquidswap
aptos move run \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::add_real_liquidswap_pool \
  --type-args 0x1::aptos_coin::AptosCoin 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC \
  --args <POOL_ADDRESS> 0 30
```

#### APT/USDT Pool:
```bash
# Add APT/USDT pool
aptos move run \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::add_real_liquidswap_pool \
  --type-args 0x1::aptos_coin::AptosCoin 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT \
  --args <POOL_ADDRESS> 0 30
```

### 4. Add Supported Tokens
```bash
# Add APT
aptos move run \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::add_supported_token \
  --args 0x1::aptos_coin::AptosCoin

# Add USDC
aptos move run \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::add_supported_token \
  --args 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC

# Add USDT
aptos move run \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::add_supported_token \
  --args 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT
```

## Pool Addresses cần thiết

### Liquidswap Pools:
- **APT/USDC**: `0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>`
- **APT/USDT**: `0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::liquidity_pool::LiquidityPool<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>`

### AnimeSwap Pools:
- **APT/USDC**: `0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa323c::AnimeSwapPoolV1<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>`
- **APT/USDT**: `0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa323c::AnimeSwapPoolV1<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>`

### Panora Pools:
- **APT/USDC**: `0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::Pool<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>`
- **APT/USDT**: `0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::Pool<0x1::aptos_coin::AptosCoin, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>`

## Kiểm tra pools đã được add

```bash
# View contract config
aptos move view --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::get_config

# Simulate swap để test
aptos move view \
  --function-id <YOUR_ADDRESS>::multiswap_aggregator_v2::simulate_swap \
  --type-args 0x1::aptos_coin::AptosCoin 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC \
  --args 1000000
```

## Lưu ý quan trọng

1. **Pools phải tồn tại trên các DEX thực tế** trước khi add vào aggregator
2. **Liquidity values** nên được cập nhật định kỳ để có quotes chính xác
3. **Fee rates** phải khớp với fee thực tế của pools
4. **Pool addresses** phải chính xác và pools phải active

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