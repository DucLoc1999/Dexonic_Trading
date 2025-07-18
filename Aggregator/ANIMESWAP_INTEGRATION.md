# AnimeSwap Smart Contract Integration

## Tổng quan
Đã tích hợp **AnimeSwap smart contract** vào dự án Dex Aggregator để lấy quote thực tế từ blockchain.

## Thông tin Smart Contract

### Deploy Account (Contract Address)
```
0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa322c
```

### Module Smart Contract
- **AnimeSwapPoolV1** (phiên bản chính)
- **AnimeSwapPoolV1f1** (phiên bản thay thế)

### Function được sử dụng
```
get_amount_out
```

## Tích hợp vào API

### File: `app/api/simulate-swap/route.ts`

#### 1. Gọi Smart Contract (AnimeSwapPoolV1)
```typescript
const animeswapResult = await client.view({
  function: '0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa322c::AnimeSwapPoolV1::get_amount_out',
  type_arguments: [inputToken, outputToken],
  arguments: [inputAmount],
})
```

#### 2. Fallback với AnimeSwapPoolV1f1
Nếu module đầu tiên không hoạt động, API sẽ thử với module thay thế:
```typescript
const animeswapResultV1f1 = await client.view({
  function: '0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa322c::AnimeSwapPoolV1f1::get_amount_out',
  type_arguments: [inputToken, outputToken],
  arguments: [inputAmount],
})
```

#### 3. Parse Kết quả
```typescript
if (animeswapResult && animeswapResult[0]) {
  const outputAmount = animeswapResult[0]
  const outputAmountDecimal = Number(outputAmount) / Math.pow(10, outputDecimals)
  
  animeswapContractQuote = {
    dex: 'AnimeSwap',
    outputAmount: outputAmountDecimal.toFixed(6),
    fee: '0.25',
    priceImpact: '0.12',
    route: ['0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa322c::AnimeSwapPoolV1'],
    hops: '1',
    liquidityScore: '980000',
    executionTime: '1'
  }
}
```

## Tích hợp vào Frontend

### File: `app/swap/page.tsx`

#### Mapping tên DEX
```typescript
function getDexName(quote: any) {
  if (quote.dex === 'AnimeSwap') return 'AnimeSwap';
  // ... các DEX khác
}
```

## Kết quả

### Trên UI
- Hiển thị tên **"AnimeSwap"** trong bảng Compare DEX Quotes
- Quote từ AnimeSwap smart contract sẽ được so sánh với các DEX khác
- Tự động chọn best quote (outputAmount cao nhất)

### Trong API Response
```json
{
  "quotes": [
    {
      "dex": "AnimeSwap",
      "outputAmount": "0.051234",
      "fee": "0.25",
      "priceImpact": "0.12",
      "route": ["0x16fe2df00ea7dde4a63409201f7f4e536bde7bb7335526a35d05111e68aa322c::AnimeSwapPoolV1"],
      "hops": "1",
      "liquidityScore": "980000",
      "executionTime": "1"
    }
  ],
  "bestQuote": { ... }
}
```

## Lợi ích

1. **Giá thực tế**: Lấy quote trực tiếp từ smart contract AnimeSwap trên blockchain
2. **Độ tin cậy cao**: Không phụ thuộc vào API bên ngoài
3. **Tốc độ nhanh**: Gọi trực tiếp on-chain
4. **Fallback tự động**: Thử cả hai module nếu một module không hoạt động
5. **So sánh đa DEX**: Cùng lúc so sánh với các DEX khác

## Lưu ý

- Smart contract call có thể fail nếu module không tồn tại hoặc có lỗi
- API sẽ thử cả AnimeSwapPoolV1 và AnimeSwapPoolV1f1
- Nếu cả hai module đều fail, API sẽ fallback về các DEX khác
- Type arguments cần đúng thứ tự và format theo yêu cầu của contract

## Testing

Để test tích hợp:
1. Gọi API `/api/simulate-swap` với inputToken và outputToken
2. Kiểm tra log để xem AnimeSwap smart contract call
3. Verify kết quả trả về có quote từ "AnimeSwap"
4. Kiểm tra UI hiển thị đúng tên DEX

## So sánh với các DEX khác

Hiện tại dự án đã tích hợp:
- **Aggregator Smart Contract** (chính)
- **Panora (Thala) Smart Contract**
- **AnimeSwap Smart Contract**
- **Liquidswap API**
- **Panora API**
- **Amnis API**
- **Aries API** (fallback)
- **PancakeSwap API** (fallback)

Tất cả quotes sẽ được so sánh và chọn best quote tự động. 