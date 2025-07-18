# Panora/Thala Smart Contract Integration

## Tổng quan
Đã tích hợp **Panora smart contract trên Thala** vào dự án Dex Aggregator để lấy quote thực tế từ blockchain.

## Thông tin Smart Contract

### Địa chỉ Module
```
0x1111af3905d49c220e236b657b31c9b8c579f7cd4e3e60a15daaed991fe519de::panora_swap
```

### Function được sử dụng
```
get_quote
```

### Type Arguments
Contract sử dụng 32 type arguments để hỗ trợ nhiều loại token:
- APT: `0x1::aptos_coin::AptosCoin`
- USDC: `0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC`
- USDT: `0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT`
- Và nhiều token khác...

## Tích hợp vào API

### File: `app/api/simulate-swap/route.ts`

#### 1. Gọi Smart Contract
```typescript
const panoraResult = await client.view({
  function: '0x1111af3905d49c220e236b657b31c9b8c579f7cd4e3e60a15daaed991fe519de::panora_swap::get_quote',
  type_arguments: [
    '0x1::aptos_coin::AptosCoin',
    // ... 31 type arguments khác
  ],
  arguments: [inputAmount],
})
```

#### 2. Parse Kết quả
```typescript
if (panoraResult && panoraResult[0]) {
  const outputAmount = panoraResult[0]
  const outputAmountDecimal = Number(outputAmount) / Math.pow(10, outputDecimals)
  
  panoraContractQuote = {
    dex: 'Panora (Thala)',
    outputAmount: outputAmountDecimal.toFixed(6),
    fee: '0.30',
    priceImpact: '0.15',
    route: ['0x1111af3905d49c220e236b657b31c9b8c579f7cd4e3e60a15daaed991fe519de::panora_swap'],
    hops: '1',
    liquidityScore: '950000',
    executionTime: '2'
  }
}
```

## Tích hợp vào Frontend

### File: `app/swap/page.tsx`

#### Mapping tên DEX
```typescript
function getDexName(quote: any) {
  if (quote.dex === 'Panora (Thala)') return 'Panora (Thala)';
  // ... các DEX khác
}
```

## Kết quả

### Trên UI
- Hiển thị tên **"Panora (Thala)"** trong bảng Compare DEX Quotes
- Quote từ Panora smart contract sẽ được so sánh với các DEX khác
- Tự động chọn best quote (outputAmount cao nhất)

### Trong API Response
```json
{
  "quotes": [
    {
      "dex": "Panora (Thala)",
      "outputAmount": "0.051234",
      "fee": "0.30",
      "priceImpact": "0.15",
      "route": ["0x1111af3905d49c220e236b657b31c9b8c579f7cd4e3e60a15daaed991fe519de::panora_swap"],
      "hops": "1",
      "liquidityScore": "950000",
      "executionTime": "2"
    }
  ],
  "bestQuote": { ... }
}
```

## Lợi ích

1. **Giá thực tế**: Lấy quote trực tiếp từ smart contract Panora trên blockchain
2. **Độ tin cậy cao**: Không phụ thuộc vào API bên ngoài
3. **Tốc độ nhanh**: Gọi trực tiếp on-chain
4. **So sánh đa DEX**: Cùng lúc so sánh với các DEX khác

## Lưu ý

- Smart contract call có thể fail nếu module không tồn tại hoặc có lỗi
- API sẽ fallback về các DEX khác nếu Panora call thất bại
- Type arguments cần đúng thứ tự và format theo yêu cầu của contract

## Testing

Để test tích hợp:
1. Gọi API `/api/simulate-swap` với inputToken và outputToken
2. Kiểm tra log để xem Panora smart contract call
3. Verify kết quả trả về có quote từ "Panora (Thala)"
4. Kiểm tra UI hiển thị đúng tên DEX 