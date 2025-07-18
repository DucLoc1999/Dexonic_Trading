# Smart Contract Features & Supported Trading Pairs

## 🏗️ Tổng quan Smart Contract

**Module:** `aggregator::multiswap_aggregator_v2`  
**Chức năng:** Multi-DEX Aggregator với routing thông minh và quote optimization

---

## 🚀 Tính năng chính

### 1. **Multi-DEX Integration**
- **Liquidswap** (DEX_ID: 1)
- **Econia** (DEX_ID: 2)
- **Hỗ trợ mở rộng** cho các DEX khác

### 2. **Smart Routing & Optimization**
- **Multi-hop routing** (tối đa 3 hops)
- **Best quote selection** dựa trên:
  - Output amount (cao nhất)
  - Liquidity score (cao nhất)
  - Fee penalty (thấp nhất)
  - Price impact penalty (thấp nhất)
  - Execution time penalty (thấp nhất)

### 3. **Quote Caching System**
- **Cache duration:** 5 phút (300 giây)
- **Automatic cache invalidation**
- **Performance optimization** cho repeated queries

### 4. **Advanced Swap Features**
- **Cross-address swaps** (swap cho người khác)
- **Slippage protection** (mặc định 5%)
- **Deadline protection** (tránh MEV)
- **Price impact calculation**

### 5. **Platform Fee System**
- **Platform fee:** 0.3% (30 basis points)
- **Configurable fee recipient**
- **Automatic fee collection**

### 6. **Event Tracking**
- **Swap executed events**
- **Quote requested events**
- **Route found events**

---

## 💰 Các cặp giao dịch được hỗ trợ

### **1. Cặp giao dịch chính (Built-in)**

#### **APT/USDC**
```move
Input: 0x1::aptos_coin::AptosCoin
Output: 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC
```

#### **APT/USDT**
```move
Input: 0x1::aptos_coin::AptosCoin
Output: 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT
```

#### **APT/APDOGE** (Default testing pool)
```move
Input: 0x1::aptos_coin::AptosCoin
Output: 0xdc73b5e73610decca7b5821c43885eeb0defe3e8fbc0ce6cc233c8eff00b03fc::aptosdoge::AptosDoge
```

### **2. Cặp giao dịch có thể thêm (Dynamic)**

#### **USDC/USDT**
```move
Input: 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC
Output: 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT
```

#### **Các cặp khác** (có thể thêm qua admin)
- Bất kỳ token pair nào có liquidity >= 1000 USD
- Hỗ trợ tất cả token types trên Aptos

---

## 🔧 Cấu hình mặc định

### **AggregatorConfig**
```move
admin: <YOUR_ADDRESS>
fee_recipient: <YOUR_ADDRESS>
platform_fee: 30 (0.3%)
max_slippage: 500 (5%)
supported_dexs: [1, 2] (Liquidswap, Econia)
paused: false
quote_cache_duration: 300 (5 minutes)
max_route_hops: 3
min_liquidity_threshold: 1000 (USD)
```

### **Pool Requirements**
- **Minimum liquidity:** 1000 USD
- **Default fee:** 30 basis points (0.3%)
- **Curve types:** 0 (Uncorrelated), 1 (Stable)

---

## 📊 Các function chính

### **1. Core Functions**
```move
// Get best quote
public fun get_best_quote<InputCoin, OutputCoin>(input_amount: u64): SwapQuote

// Execute swap
public entry fun swap_exact_input<InputCoin, OutputCoin>(
    user: &signer,
    input_amount: u64,
    min_output_amount: u64,
    deadline: u64
)

// Cross-address swap
public entry fun swap_cross_address_v2<InputCoin, OutputCoin>(
    sender: &signer,
    receiver: address,
    input_amount: u64,
    min_output_amount: u64,
    deadline: u64
)
```

### **2. Admin Functions**
```move
// Add supported token
public entry fun add_supported_token(admin: &signer, token_address: address)

// Add Liquidswap pool
public entry fun add_real_liquidswap_pool<InputCoin, OutputCoin>(
    admin: &signer,
    pool_address: address,
    curve_type: u64,
    fee: u64
)

// Add Econia market
public entry fun add_econia_market(
    admin: &signer,
    market_key: vector<u8>,
    liquidity: u64,
    fee: u64,
    market_id: u64
)

// Setup default pools
public entry fun setup_default_pools(admin: &signer)
```

### **3. View Functions**
```move
// Get configuration
#[view] public fun get_config(): (address, address, u64, u64, bool, u64, u64, u64)

// Simulate swap
#[view] public fun simulate_swap<InputCoin, OutputCoin>(input_amount: u64): (u64, u8, u64, u64, u64, vector<address>)

// Get detailed quote
#[view] public fun get_quote_details<InputCoin, OutputCoin>(input_amount: u64): (u64, u8, u64, u64, u64, vector<address>, u64, u64)
```

---

## 🔄 Routing Logic

### **1. Direct Quotes**
- Query tất cả DEX được hỗ trợ
- So sánh output amount và fees
- Chọn quote tốt nhất

### **2. Multi-hop Quotes**
- Tìm routes qua intermediate tokens
- Tối đa 3 hops
- Tính toán tổng fee và price impact

### **3. Quote Scoring**
```move
score = (output_amount * 1000) + (liquidity_score * 10) - (fee * 5) - (price_impact * 2) - (execution_time * 100)
```

---

## 🛡️ Bảo mật & Validation

### **1. Error Handling**
- `E_NOT_ADMIN`: Chỉ admin mới được thực hiện
- `E_INSUFFICIENT_AMOUNT`: Số lượng không đủ
- `E_SLIPPAGE_EXCEEDED`: Vượt quá slippage
- `E_DEADLINE_EXCEEDED`: Hết thời gian
- `E_INSUFFICIENT_LIQUIDITY`: Không đủ liquidity

### **2. Safety Checks**
- **Pause mechanism** cho emergency
- **Slippage protection** (5% mặc định)
- **Deadline validation**
- **Liquidity threshold** (1000 USD)

---

## 📈 Performance Features

### **1. Caching**
- Quote cache với TTL 5 phút
- Automatic cache invalidation
- Memory-efficient storage

### **2. Gas Optimization**
- Efficient data structures
- Minimal storage operations
- Optimized routing algorithms

### **3. Scalability**
- Support unlimited token pairs
- Dynamic pool addition
- Configurable parameters

---

## 🎯 Use Cases

### **1. Retail Users**
- Swap tokens với best price
- Multi-hop routing tự động
- Slippage protection

### **2. Traders**
- Cross-address swaps
- Advanced routing options
- Detailed quote information

### **3. Developers**
- API integration
- Custom routing logic
- Event monitoring

---

## 🔮 Roadmap Features

### **Planned Enhancements**
- **More DEX integrations** (AnimeSwap, Panora, Amnis)
- **Advanced routing algorithms**
- **MEV protection**
- **Flash loan integration**
- **Limit orders**
- **Batch swaps**

### **Performance Improvements**
- **Parallel quote fetching**
- **Advanced caching strategies**
- **Gas optimization**
- **Cross-chain support** 