# 🔄 Hướng dẫn sử dụng tính năng Swap

## 🎯 **Tính năng Swap đã hoạt động!**

Dự án AptosSwap đã được thiết lập thành công và tính năng swap đang hoạt động tại: **http://localhost:3000/swap**

---

## 📋 **Các tính năng đã hoạt động**

### **✅ 1. Giao diện Swap**
- **Token Selection**: Chọn token đầu vào và đầu ra
- **Amount Input**: Nhập số lượng token muốn swap
- **Real-time Quotes**: Hiển thị quote từ các DEX khác nhau
- **Cross-address Swap**: Swap token cho địa chỉ khác
- **Same-address Swap**: Swap token trong cùng địa chỉ

### **✅ 2. Wallet Integration**
- **Petra Wallet**: Kết nối với ví Petra
- **Address Display**: Hiển thị địa chỉ ví đã kết nối
- **Transaction Signing**: Ký và gửi giao dịch

### **✅ 3. API Integration**
- **Simulate Swap**: API endpoint `/api/simulate-swap`
- **Fallback Data**: Dữ liệu mẫu khi API không khả dụng
- **Error Handling**: Xử lý lỗi gracefully

### **✅ 4. Smart Contract Integration**
- **Aggregator Contract**: `0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8`
- **Swap Functions**: 
  - `swap_exact_input` - Swap cùng địa chỉ
  - `swap_cross_address_v2` - Swap chéo địa chỉ
- **Multi-DEX Support**: Liquidswap và Econia

---

## 🚀 **Cách sử dụng**

### **Bước 1: Truy cập trang Swap**
```
http://localhost:3000/swap
```

### **Bước 2: Kết nối ví**
1. Click "Connect Wallet"
2. Chọn Petra Wallet
3. Phê duyệt kết nối

### **Bước 3: Chọn token**
1. **From Token**: Chọn token muốn bán (APT, APDOGE, USDC, USDT, WETH)
2. **To Token**: Chọn token muốn mua
3. Nhập số lượng token

### **Bước 4: Xem quotes**
- Hệ thống sẽ tự động fetch quotes từ các DEX
- Hiển thị output amount, price impact, fee
- Chọn quote tốt nhất

### **Bước 5: Thực hiện swap**
1. Click "Swap" button
2. Xem lại thông tin giao dịch
3. Ký giao dịch trong Petra Wallet
4. Chờ xác nhận trên blockchain

---

## 🔧 **Cấu hình**

### **Swap Settings**
- **Slippage Tolerance**: 0.1%, 0.5%, 1% hoặc tùy chỉnh
- **Transaction Deadline**: 20 phút (mặc định)
- **MEV Protection**: Bật/tắt bảo vệ MEV

### **Network Configuration**
- **Network**: Aptos Mainnet
- **RPC Endpoint**: https://fullnode.mainnet.aptoslabs.com
- **Explorer**: https://explorer.aptoslabs.com

---

## 📊 **Token List**

| Token | Symbol | Address | Decimals |
|-------|--------|---------|----------|
| Aptos | APT | `0x1::aptos_coin::AptosCoin` | 8 |
| AptosDoge | APDOGE | `0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8::aptosdoge::AptosDoge` | 8 |
| USD Coin | USDC | `0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T` | 6 |
| Tether USD | USDT | `0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b::coin::T` | 6 |
| Wrapped ETH | WETH | `0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T` | 8 |

---

## 🛠️ **Troubleshooting**

### **Lỗi thường gặp**

#### **1. "Connect Petra Wallet" không hoạt động**
```bash
# Kiểm tra console browser
# Đảm bảo Petra extension đã cài đặt
# Refresh trang và thử lại
```

#### **2. API errors**
```bash
# Kiểm tra network tab trong DevTools
# API endpoint: /api/simulate-swap
# Fallback data sẽ được sử dụng nếu API fail
```

#### **3. Transaction failed**
```bash
# Kiểm tra balance của token
# Đảm bảo đủ gas fee
# Kiểm tra slippage tolerance
```

### **Debug Commands**
```bash
# Kiểm tra server status
curl http://localhost:3000/swap

# Kiểm tra API endpoint
curl -X POST http://localhost:3000/api/simulate-swap \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"0x1::aptos_coin::AptosCoin","outputToken":"0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8::aptosdoge::AptosDoge","inputAmount":"100000000"}'
```

---

## 🎉 **Kết luận**

Tính năng swap đã hoạt động đầy đủ với:
- ✅ Giao diện người dùng đẹp và responsive
- ✅ Tích hợp ví Petra
- ✅ API simulation và fallback
- ✅ Smart contract integration
- ✅ Multi-DEX aggregation
- ✅ Cross-address swap support

**Dự án sẵn sàng để test và demo!** 🚀 