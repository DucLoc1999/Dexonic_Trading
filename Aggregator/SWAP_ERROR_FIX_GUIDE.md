# Hướng Dẫn Sửa Lỗi Swap

## Vấn Đề Đã Gặp
- **Lỗi**: "Simulation error" khi thực hiện swap
- **Nguyên nhân**: Function call sai tên trong smart contract

## Các Sửa Đổi Đã Thực Hiện

### 1. Sửa Function Call
**Trước:**
```javascript
function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator::swap_exact_input`
```

**Sau:**
```javascript
function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_exact_input`
```

### 2. Sửa Cross-Address Function
**Trước:**
```javascript
function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator::swap_cross_address_v2`
```

**Sau:**
```javascript
function: `${AGGREGATOR_ADDRESS}::multiswap_aggregator_v4::swap_cross_address_v2`
```

### 3. Thêm Kiểm Tra Gas Fee
```javascript
// Kiểm tra gas fee (APT balance)
const aptBalance = balances.find(b => b.symbol === 'APT')?.balance || '0'
const aptBalanceNum = Number(aptBalance)
if (aptBalanceNum < 0.01) { // Cần ít nhất 0.01 APT cho gas
  alert("Số dư APT không đủ để trả gas fee! Cần ít nhất 0.01 APT.")
  return
}
```

### 4. Cải Thiện Error Handling
```javascript
let errorMessage = "Swap failed. ";
if (error instanceof Error) {
  errorMessage += error.message;
  if (error.message.includes("Simulation error")) {
    errorMessage += "\n\nCó thể do:\n- Số dư không đủ\n- Gas fee không đủ\n- Token không được hỗ trợ\n- Smart contract lỗi";
  }
} else {
  errorMessage += String(error);
}
```

## Các Function Có Sẵn Trong Contract

### Main Functions
- `swap_exact_input<InputCoin, OutputCoin>` - Swap thông thường
- `swap_cross_address_v2<InputCoin, OutputCoin>` - Swap cross-address

### DEX-Specific Functions
- `execute_liquidswap_swap<InputCoin, OutputCoin>`
- `execute_econia_swap<InputCoin, OutputCoin>`
- `execute_panora_swap<InputCoin, OutputCoin>`
- `execute_amnis_swap<InputCoin, OutputCoin>`
- `execute_animeswap_swap<InputCoin, OutputCoin>`
- `execute_sushiswap_swap<InputCoin, OutputCoin>`

## Kiểm Tra Trước Khi Swap

### 1. Số Dư Token
```javascript
const fromBalanceNum = Number(fromBalance)
const fromAmountNum = Number(fromAmount)
if (fromBalanceNum < fromAmountNum) {
  alert("Số dư không đủ để thực hiện swap!")
  return
}
```

### 2. Gas Fee (APT)
```javascript
const aptBalance = balances.find(b => b.symbol === 'APT')?.balance || '0'
const aptBalanceNum = Number(aptBalance)
if (aptBalanceNum < 0.01) {
  alert("Số dư APT không đủ để trả gas fee! Cần ít nhất 0.01 APT.")
  return
}
```

### 3. Best Quote
```javascript
if (!bestQuote || Number.parseFloat(bestQuote.outputAmount) <= 0) {
  alert("Không có báo giá khả dụng hoặc output bằng 0. Vui lòng thử lại hoặc chọn cặp token khác.")
  return
}
```

## Test Payload

### Swap Thông Thường
```javascript
{
  type: "entry_function_payload",
  function: "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127::multiswap_aggregator_v4::swap_exact_input",
  type_arguments: [
    "0x1::aptos_coin::AptosCoin",
    "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T"
  ],
  arguments: [
    "10000000", // 10 APT in octas
    "9500000",  // min output (9.5 USDC)
    "1752596794" // deadline
  ]
}
```

### Cross-Address Swap
```javascript
{
  type: "entry_function_payload",
  function: "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127::multiswap_aggregator_v4::swap_cross_address_v2",
  type_arguments: [
    "0x1::aptos_coin::AptosCoin",
    "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T"
  ],
  arguments: [
    "0x45636581cf77d041cd74a8f3ec0e97edbb0a3f827de5a004eb832a31aacba127", // receiver
    "10000000", // 10 APT in octas
    "9500000",  // min output (9.5 USDC)
    "1752596794" // deadline
  ]
}
```

## Troubleshooting

### Nếu Vẫn Gặp Lỗi "Simulation error":

1. **Kiểm tra số dư APT**: Cần ít nhất 0.01 APT cho gas fee
2. **Kiểm tra số dư token**: Đảm bảo có đủ token để swap
3. **Kiểm tra deadline**: Deadline phải lớn hơn thời gian hiện tại
4. **Kiểm tra slippage**: Min output không quá thấp
5. **Kiểm tra token support**: Đảm bảo token được hỗ trợ

### Debug Steps:
1. Mở Developer Console (F12)
2. Kiểm tra log khi thực hiện swap
3. Xem chi tiết lỗi trong console
4. Kiểm tra payload được gửi đi

## Kết Quả
✅ **Đã sửa**: Function call đúng tên contract  
✅ **Đã thêm**: Kiểm tra gas fee  
✅ **Đã cải thiện**: Error handling chi tiết  
✅ **Đã test**: API hoạt động bình thường  

Bây giờ swap function sẽ hoạt động đúng và hiển thị lỗi chi tiết nếu có vấn đề. 