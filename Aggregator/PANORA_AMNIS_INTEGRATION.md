# Panora và Amnis Integration vào Smart Contract

## Tổng quan
Đã thêm thành công Panora (DEX_ID: 3) và Amnis (DEX_ID: 4) vào smart contract aggregator.

## Thay đổi chính

### 1. DEX Identifiers
```move
const DEX_LIQUIDSWAP: u8 = 1;
const DEX_ECONIA: u8 = 2;
const DEX_PANORA: u8 = 3;    // Mới thêm
const DEX_AMNIS: u8 = 4;     // Mới thêm
```

### 2. DEXRegistry Structure
```move
struct DEXRegistry has key {
    liquidswap_pools: Table<vector<u8>, PoolInfo>,
    econia_markets: Table<vector<u8>, MarketInfo>,
    panora_pools: Table<vector<u8>, PoolInfo>,    // Mới thêm
    amnis_pools: Table<vector<u8>, PoolInfo>,     // Mới thêm
    supported_tokens: Table<address, bool>,
    token_pairs: Table<vector<u8>, vector<SwapRoute>>,
}
```

### 3. Supported DEXs
```move
supported_dexs: vector[DEX_LIQUIDSWAP, DEX_ECONIA, DEX_PANORA, DEX_AMNIS]
```

### 4. Quote Functions
- `get_panora_quote<InputCoin, OutputCoin>()` - Lấy quote từ Panora
- `get_amnis_quote<InputCoin, OutputCoin>()` - Lấy quote từ Amnis

### 5. Swap Execution Functions
- `execute_panora_swap<InputCoin, OutputCoin>()` - Thực hiện swap trên Panora
- `execute_amnis_swap<InputCoin, OutputCoin>()` - Thực hiện swap trên Amnis

### 6. Admin Functions
- `add_panora_pool<InputCoin, OutputCoin>()` - Thêm pool cho Panora
- `add_amnis_pool<InputCoin, OutputCoin>()` - Thêm pool cho Amnis

### 7. Default Pools Setup
Đã thêm pools mặc định cho cả Panora và Amnis:

#### Panora Pools:
- APT/APDOGE: 80M liquidity, 0.25% fee
- APDOGE/APT: 80M liquidity, 0.25% fee

#### Amnis Pools:
- APT/APDOGE: 60M liquidity, 0.2% fee
- APDOGE/APT: 60M liquidity, 0.2% fee

## Tính năng

### 1. Multi-DEX Integration
- Hỗ trợ 4 DEX: Liquidswap, Econia, Panora, Amnis
- Tự động tìm best quote từ tất cả DEX
- Routing thông minh qua nhiều DEX

### 2. Quote System
- Cache quotes để tối ưu performance
- Tính toán price impact và fees
- Hỗ trợ multi-hop routing

### 3. Pool Management
- Thêm/xóa pools cho từng DEX
- Quản lý liquidity và fees
- Validation pools trước khi sử dụng

### 4. Swap Execution
- Thực hiện swap trên DEX được chọn
- Tính toán slippage và deadline
- Event tracking cho mọi swap

## Cách sử dụng

### 1. Deploy Smart Contract
```bash
aptos move publish --named-addresses aggregator=<ADMIN_ADDRESS>
```

### 2. Initialize
```bash
aptos move run --function-id <ADMIN_ADDRESS>::aggregator::initialize
```

### 3. Setup Default Pools
```bash
aptos move run --function-id <ADMIN_ADDRESS>::aggregator::setup_default_pools
```

### 4. Add Custom Pools
```bash
# Thêm Panora pool
aptos move run --function-id <ADMIN_ADDRESS>::aggregator::add_panora_pool \
  --type-args <INPUT_COIN> <OUTPUT_COIN> \
  --args <POOL_ADDRESS> <CURVE_TYPE> <FEE>

# Thêm Amnis pool
aptos move run --function-id <ADMIN_ADDRESS>::aggregator::add_amnis_pool \
  --type-args <INPUT_COIN> <OUTPUT_COIN> \
  --args <POOL_ADDRESS> <CURVE_TYPE> <FEE>
```

### 5. Get Quote
```bash
aptos move run --function-id <ADMIN_ADDRESS>::aggregator::simulate_swap \
  --type-args <INPUT_COIN> <OUTPUT_COIN> \
  --args <INPUT_AMOUNT>
```

### 6. Execute Swap
```bash
aptos move run --function-id <ADMIN_ADDRESS>::aggregator::swap_exact_input \
  --type-args <INPUT_COIN> <OUTPUT_COIN> \
  --args <INPUT_AMOUNT> <MIN_OUTPUT_AMOUNT> <DEADLINE>
```

## Lưu ý

1. **Simulated Execution**: Hiện tại các function execute_swap đang được simulate. Cần implement thực tế khi tích hợp với các DEX contracts.

2. **Pool Addresses**: Cần thay thế pool addresses thực tế khi deploy lên mainnet.

3. **Liquidity Values**: Các giá trị liquidity hiện tại là ước tính. Cần cập nhật với giá trị thực từ blockchain.

4. **Fee Structures**: Fee structures có thể khác nhau giữa các DEX. Cần điều chỉnh theo từng DEX.

## Next Steps

1. **Real Integration**: Implement thực tế với Panora và Amnis contracts
2. **Pool Discovery**: Tạo tools để tự động discover pools
3. **Price Feeds**: Tích hợp price feeds thực tế
4. **Gas Optimization**: Tối ưu gas usage cho multi-DEX swaps
5. **Security Audits**: Audit smart contract trước khi deploy mainnet 