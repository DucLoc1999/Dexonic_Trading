# 🔄 Hướng dẫn sử dụng Swap - AptosSwap

## 📋 **Tổng quan về Receiver Address**

### **Receiver Address là gì?**

**Receiver Address** là địa chỉ nhận token khi thực hiện **cross-address swap** (swap chéo địa chỉ). Đây không phải là smart contract swap, mà là địa chỉ ví sẽ nhận token sau khi swap hoàn thành.

### **Cấu hình hiện tại:**

```typescript
// Trong file: app/swap/page.tsx
const AGGREGATOR_ADDRESS = "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8"
const SENDER_ADDRESS = "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8"
const RECEIVER_ADDRESS = "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8"
```

### **Phân biệt các địa chỉ:**

| Địa chỉ | Ý nghĩa | Chức năng |
|---------|---------|-----------|
| **AGGREGATOR_ADDRESS** | Smart Contract Swap | Contract thực hiện swap |
| **SENDER_ADDRESS** | Địa chỉ gửi | Ví người thực hiện swap |
| **RECEIVER_ADDRESS** | Địa chỉ nhận | Ví nhận token sau swap |

---

## 🎯 **Các chế độ Swap**

### **1. Same Address Swap (Swap cùng địa chỉ)**
- **Mô tả**: Swap token trong cùng một ví
- **Sender**: Ví của bạn
- **Receiver**: Cùng ví của bạn
- **Sử dụng**: Function `swap_exact_input()`

### **2. Cross Address Swap (Swap chéo địa chỉ)**
- **Mô tả**: Swap token từ ví này sang ví khác
- **Sender**: Ví của bạn
- **Receiver**: Ví khác (có thể nhập tùy chỉnh)
- **Sử dụng**: Function `swap_cross_address_v2()`

---

## 🚀 **Cách sử dụng Swap**

### **Bước 1: Truy cập trang Swap**
```
http://localhost:3000/swap
```

### **Bước 2: Kết nối ví**
1. Click "Connect Wallet"
2. Chọn Petra Wallet hoặc Pontem Wallet
3. Phê duyệt kết nối

### **Bước 3: Chọn chế độ Swap**

#### **Option A: Same Address Swap**
1. Chọn tab "Same Address"
2. Chọn token đầu vào (From Token)
3. Chọn token đầu ra (To Token)
4. Nhập số lượng muốn swap
5. Xem quote và thực hiện swap

#### **Option B: Cross Address Swap**
1. Chọn tab "Cross Address"
2. Chọn token đầu vào (From Token)
3. Chọn token đầu ra (To Token)
4. Nhập số lượng muốn swap
5. **Nhập Receiver Address** (địa chỉ nhận)
6. Xem quote và thực hiện swap

### **Bước 4: Thực hiện Swap**
1. Click "Swap" button
2. Xem lại thông tin giao dịch
3. Ký giao dịch trong ví
4. Chờ xác nhận trên blockchain

---

## 🔧 **Cấu hình Receiver Address**

### **Mặc định hiện tại:**
```typescript
const RECEIVER_ADDRESS = "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8"
```

### **Ý nghĩa:**
- Địa chỉ này được set mặc định là **Smart Contract Aggregator**
- Khi chọn Cross Address, trường nhận sẽ tự động điền địa chỉ này
- Bạn có thể thay đổi thành địa chỉ ví khác nếu muốn

### **Cách thay đổi:**
1. **Tạm thời**: Nhập địa chỉ khác trong trường "Receiver Address"
2. **Vĩnh viễn**: Sửa biến `RECEIVER_ADDRESS` trong file `app/swap/page.tsx`

---

## 📊 **Smart Contract Information**

### **Deployed Contracts:**
```bash
# Aggregator Contract
Address: 0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8
Module: multiswap_aggregator_v2

# AptosDoge Token
Address: 0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8
Module: aptosdoge::AptosDoge
```

### **Available Functions:**
```move
// Same Address Swap
swap_exact_input<InputCoin, OutputCoin>(
    user: &signer,
    input_amount: u64,
    min_output_amount: u64,
    deadline: u64
)

// Cross Address Swap
swap_cross_address_v2<InputCoin, OutputCoin>(
    sender: &signer,
    receiver: address,
    input_amount: u64,
    min_output_amount: u64,
    deadline: u64
)

// Quote Simulation
simulate_swap<InputCoin, OutputCoin>(
    input_amount: u64
): (u64, u64, u64, u64, u64, vector<address>)
```

---

## 🎨 **Giao diện Swap**

### **Main Features:**
- **Token Selection**: Dropdown chọn token đầu vào/ra
- **Amount Input**: Nhập số lượng token
- **Balance Display**: Hiển thị số dư token
- **Quote Display**: Hiển thị quote từ DEX
- **Swap Mode Toggle**: Chuyển đổi Same/Cross Address
- **Receiver Input**: Nhập địa chỉ nhận (Cross Address mode)

### **Settings Panel:**
- **Slippage Tolerance**: 0.1%, 0.5%, 1%, Custom
- **Transaction Deadline**: 20 phút (mặc định)
- **MEV Protection**: Bật/tắt bảo vệ MEV

---

## 🛠️ **Troubleshooting**

### **Lỗi thường gặp:**

#### **1. "Receiver Address không hợp lệ"**
```bash
# Kiểm tra:
- Địa chỉ có đúng format Aptos không?
- Địa chỉ có tồn tại trên blockchain không?
- Địa chỉ có hỗ trợ token đang swap không?
```

#### **2. "Insufficient Balance"**
```bash
# Giải pháp:
- Kiểm tra số dư token đầu vào
- Đảm bảo đủ APT cho gas fee
- Thử giảm số lượng swap
```

#### **3. "Transaction Failed"**
```bash
# Kiểm tra:
- Slippage tolerance có đủ không?
- Deadline có hết hạn không?
- Network có ổn định không?
```

### **Debug Commands:**
```bash
# Kiểm tra balance
curl -X POST http://localhost:3000/api/simulate-swap \
  -H "Content-Type: application/json" \
  -d '{
    "inputToken": "0x1::aptos_coin::AptosCoin",
    "outputToken": "0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8::aptosdoge::AptosDoge",
    "inputAmount": "10000000"
  }'

# Kiểm tra contract status
aptos move view --function-id 0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8::multiswap_aggregator_v2::get_config
```

---

## 📱 **Mobile Support**

### **Responsive Design:**
- **Mobile Menu**: Collapsible navigation
- **Touch-Friendly**: Large buttons và gestures
- **Quick Actions**: Easy access to common functions
- **Mobile Optimization**: Optimized for small screens

---

## 🔒 **Security Features**

### **Built-in Protection:**
- **MEV Protection**: Chống front-running
- **Slippage Control**: Kiểm soát slippage
- **Deadline Enforcement**: Tránh stuck transactions
- **Input Validation**: Kiểm tra input hợp lệ

---

## 📈 **Performance Tips**

### **Tối ưu hóa:**
1. **Use Same Address**: Nhanh hơn Cross Address
2. **Set Appropriate Slippage**: Không quá thấp hoặc cao
3. **Check Network**: Đảm bảo network ổn định
4. **Monitor Gas**: Theo dõi gas fee

---

## 🎯 **Best Practices**

### **Khi sử dụng Cross Address Swap:**
1. **Verify Receiver**: Kiểm tra địa chỉ nhận kỹ lưỡng
2. **Test Small Amount**: Thử với số lượng nhỏ trước
3. **Check Balance**: Đảm bảo đủ balance
4. **Monitor Transaction**: Theo dõi trạng thái giao dịch

### **Khi sử dụng Same Address Swap:**
1. **Check Balance**: Kiểm tra số dư token
2. **Review Quote**: Xem kỹ quote trước khi swap
3. **Set Slippage**: Điều chỉnh slippage phù hợp
4. **Confirm Details**: Xác nhận thông tin giao dịch

---

## 📞 **Support**

### **Khi gặp vấn đề:**
1. **Check Console**: Xem lỗi trong browser console
2. **Network Tab**: Kiểm tra API calls
3. **Transaction Explorer**: Xem chi tiết giao dịch
4. **Contact Support**: Liên hệ support nếu cần

### **Useful Links:**
- **Aptos Explorer**: https://explorer.aptoslabs.com
- **Contract Address**: 0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8
- **Frontend**: http://localhost:3000/swap

---

**📝 Lưu ý**: Tài liệu này được cập nhật lần cuối vào tháng 1/2025. Mọi thay đổi về contract hoặc giao diện sẽ được cập nhật trong tài liệu này. 