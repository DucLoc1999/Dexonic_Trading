# 🚀 Hướng dẫn thiết lập và chạy AptosSwap

## 📋 Yêu cầu hệ thống

- **Node.js**: v18+ (khuyến nghị v20+)
- **npm**: v8+ hoặc **pnpm**: v8+
- **Aptos CLI**: v7.6.0+
- **Git**: để clone repository

## 🛠️ Cài đặt

### **Bước 1: Clone repository**
```bash
git clone <repository-url>
cd AptosSwap
```

### **Bước 2: Cài đặt dependencies**
```bash
# Sử dụng pnpm (khuyến nghị)
pnpm install

# Hoặc sử dụng npm
npm install
```

### **Bước 3: Thiết lập Aptos CLI**
```bash
# Khởi tạo Aptos CLI với mainnet
aptos init --profile local
# Chọn "mainnet" khi được hỏi
```

### **Bước 4: Build dự án**
```bash
pnpm build
```

### **Bước 5: Chạy development server**
```bash
pnpm dev
```

## 🌐 Truy cập ứng dụng

Sau khi chạy thành công, bạn có thể truy cập:

- **Localhost**: http://localhost:3000
- **Network**: http://127.0.0.1:3000

## 📱 Các trang chính

### **🏠 Trang chủ** (`/`)
- Landing page với giới thiệu dự án
- Các tính năng chính
- Testimonials và FAQ

### **💱 Trang Swap** (`/swap`)
- Giao diện swap token
- Kết nối ví Petra
- Chọn token và nhập số lượng
- Xem quotes và thực hiện swap

### **💬 Trang Chat** (`/chat`)
- Real-time chat community
- Multiple chat rooms
- User profiles và stats

### **👤 Trang Profile** (`/profile`)
- Thông tin người dùng
- Transaction history
- User statistics

## 🔧 Cấu hình Smart Contracts

### **Deploy Smart Contracts**
```bash
# Di chuyển vào thư mục smart contracts
cd aptos-multiswap-aggregator-v3

# Compile contracts
aptos move compile

# Deploy contracts
aptos move publish

# Initialize aggregator
aptos move run --function-id <YOUR_ADDRESS>::multiswap_aggregator::initialize

# Initialize AptosDoge token
aptos move run --function-id <YOUR_ADDRESS>::aptosdoge::initialize
```

### **Test Smart Contracts**
```bash
# Test swap simulation
aptos move run --function-id <YOUR_ADDRESS>::multiswap_aggregator::simulate_swap \
  --type-args 0x1::aptos_coin::AptosCoin <YOUR_ADDRESS>::aptosdoge::AptosDoge \
  --args 10000000
```

## 🎯 Tính năng chính

### **✅ Đã hoàn thành**
- [x] **Frontend**: Next.js với TypeScript
- [x] **UI Components**: Radix UI + Tailwind CSS
- [x] **Wallet Integration**: Petra wallet mock
- [x] **Smart Contracts**: Move language trên Aptos
- [x] **Chat System**: Real-time với Gun.js
- [x] **Responsive Design**: Mobile + Desktop
- [x] **Dark/Light Theme**: Tự động chuyển đổi

### **🔄 Đang phát triển**
- [ ] **Real Petra Integration**: Kết nối thật với Petra wallet
- [ ] **Live Blockchain Integration**: Kết nối với Aptos mainnet
- [ ] **Advanced Routing**: Multi-hop routing tối ưu
- [ ] **Analytics Dashboard**: Thống kê chi tiết

## 🐛 Troubleshooting

### **Lỗi thường gặp**

#### **Port 3000 đã được sử dụng**
```bash
# Kiểm tra process đang sử dụng port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Hoặc chạy trên port khác
pnpm dev --port 3001
```

#### **Build failed**
```bash
# Xóa cache và rebuild
rm -rf .next
rm -rf node_modules
pnpm install
pnpm build
```

#### **Aptos CLI không tìm thấy**
```bash
# Cài đặt Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Hoặc với Homebrew (macOS)
brew install aptos
```

## 📊 Scripts có sẵn

```bash
# Development
pnpm dev          # Chạy development server
pnpm build        # Build production
pnpm start        # Chạy production server
pnpm lint         # Kiểm tra code style

# Smart Contracts
cd aptos-multiswap-aggregator-v3
aptos move compile    # Compile contracts
aptos move publish    # Deploy contracts
aptos move test       # Run tests
```

## 🔗 Links hữu ích

- **Aptos Documentation**: https://aptos.dev/
- **Petra Wallet**: https://petra.app/
- **Next.js Documentation**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:

1. Kiểm tra console logs trong browser
2. Kiểm tra terminal output
3. Đảm bảo tất cả dependencies đã được cài đặt
4. Restart development server

---

**🎉 Chúc bạn có trải nghiệm tuyệt vời với AptosSwap!** 