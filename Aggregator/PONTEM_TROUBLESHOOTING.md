# Hướng dẫn khắc phục vấn đề Pontem Wallet

## Vấn đề thường gặp

### 1. Pontem Wallet không được phát hiện

**Triệu chứng**: Ứng dụng hiển thị "No wallets detected" hoặc chỉ hiển thị Petra

**Nguyên nhân có thể**:
- Pontem extension chưa được cài đặt đúng cách
- Pontem extension chưa được bật
- Pontem extension chưa được cấp quyền cho trang web

**Cách khắc phục**:

#### Bước 1: Kiểm tra cài đặt Pontem
1. Mở Chrome Extensions (chrome://extensions/)
2. Tìm "Pontem Wallet"
3. Đảm bảo extension được bật (toggle ON)
4. Kiểm tra quyền truy cập vào trang web

#### Bước 2: Refresh trang web
1. Refresh trang AptosSwap
2. Đợi 2-3 giây để extension load
3. Kiểm tra lại nút "Connect Wallet"

#### Bước 3: Sử dụng Debug Tool
1. Mở trang http://localhost:3000/swap
2. Nhấn nút "Debug Wallets" (góc dưới bên phải)
3. Kiểm tra trạng thái Pontem Wallet
4. Nhấn "Test Connection" để thử kết nối

### 2. Pontem Wallet được phát hiện nhưng không kết nối được

**Triệu chứng**: Pontem xuất hiện trong danh sách nhưng khi nhấn kết nối bị lỗi

**Nguyên nhân có thể**:
- Pontem extension chưa được unlock
- Pontem extension đang ở chế độ testnet/mainnet khác
- API của Pontem khác với Petra

**Cách khắc phục**:

#### Bước 1: Unlock Pontem Wallet
1. Mở Pontem extension
2. Nhập mật khẩu để unlock
3. Đảm bảo wallet đã sẵn sàng

#### Bước 2: Kiểm tra Network
1. Mở Pontem extension
2. Kiểm tra network đang sử dụng (Mainnet/Testnet)
3. Đảm bảo network khớp với AptosSwap

#### Bước 3: Thử kết nối thủ công
1. Mở Developer Tools (F12)
2. Chạy script debug:
```javascript
// Kiểm tra Pontem object
console.log("Pontem object:", window.pontem);
console.log("Pontem methods:", Object.keys(window.pontem || {}));

// Thử kết nối
if (window.pontem) {
  window.pontem.connect().then(response => {
    console.log("Success:", response);
  }).catch(error => {
    console.error("Error:", error);
  });
}
```

### 3. Lỗi API không tương thích

**Triệu chứng**: Console hiển thị lỗi về method không tồn tại

**Nguyên nhân**: Pontem sử dụng API khác với Petra

**Cách khắc phục**:

#### Bước 1: Kiểm tra API của Pontem
```javascript
// Trong console
const pontem = window.pontem || window.Pontem;
console.log("Available methods:", Object.keys(pontem));
```

#### Bước 2: Thử các method khác nhau
```javascript
// Thử các method khác nhau
try {
  // Method 1
  await pontem.connect();
} catch (error) {
  try {
    // Method 2
    await pontem.requestConnection();
  } catch (error2) {
    console.error("All methods failed");
  }
}
```

## Debug chi tiết

### 1. Sử dụng Debug Component
1. Mở http://localhost:3000/swap
2. Nhấn nút "Debug Wallets" (góc dưới bên phải)
3. Kiểm tra:
   - Trạng thái Pontem Wallet
   - Các method có sẵn
   - Test connection

### 2. Sử dụng Console Debug
1. Mở Developer Tools (F12)
2. Chạy script debug-pontem.js:
```javascript
// Copy nội dung từ file debug-pontem.js
// Paste vào console và chạy
```

### 3. Kiểm tra Extension
1. Mở chrome://extensions/
2. Tìm Pontem Wallet
3. Kiểm tra:
   - Extension được bật
   - Có quyền truy cập trang web
   - Không có lỗi

## Các bước kiểm tra nhanh

### Bước 1: Kiểm tra cơ bản
- [ ] Pontem extension đã cài đặt
- [ ] Pontem extension được bật
- [ ] Pontem extension đã unlock
- [ ] Network đúng (Mainnet/Testnet)

### Bước 2: Kiểm tra trang web
- [ ] Refresh trang AptosSwap
- [ ] Đợi 2-3 giây
- [ ] Kiểm tra nút "Connect Wallet"
- [ ] Sử dụng Debug tool

### Bước 3: Kiểm tra console
- [ ] Mở Developer Tools (F12)
- [ ] Kiểm tra console có lỗi
- [ ] Chạy debug script
- [ ] Kiểm tra Pontem object

## Thông tin liên hệ

Nếu vẫn gặp vấn đề:
1. Kiểm tra [Pontem Documentation](https://docs.pontem.network/)
2. Tham gia [Pontem Discord](https://discord.gg/pontem)
3. Tạo issue trên GitHub repository

## Lưu ý quan trọng

- Pontem Wallet có thể sử dụng API khác với Petra
- Một số version của Pontem có thể chưa hỗ trợ đầy đủ
- Luôn kiểm tra network trước khi kết nối
- Backup wallet trước khi thử nghiệm 