# Hướng dẫn thiết lập Petra Wallet

## Vấn đề hiện tại
Ứng dụng hiện tại đang sử dụng địa chỉ ví giả `0xe92e80d3819badc3c8881b1eaafc43f2563bac722b0183068ffa90af27917bd8` thay vì kết nối với Petra wallet thực tế của bạn.

## Giải pháp

### 1. Cài đặt Petra Wallet Extension

1. Truy cập [Petra Wallet](https://petra.app/)
2. Tải xuống extension cho trình duyệt của bạn (Chrome, Firefox, Safari)
3. Cài đặt extension

### 2. Tạo ví mới hoặc import ví hiện có

1. Mở Petra Wallet extension
2. Chọn "Create New Wallet" hoặc "Import Existing Wallet"
3. Lưu trữ seed phrase an toàn
4. Đặt mật khẩu cho ví

### 3. Kết nối với AptosSwap

1. Mở trang web AptosSwap tại http://localhost:3000/swap
2. Nhấn nút "Connect Wallet"
3. Chọn "Petra" từ danh sách ví
4. Chấp nhận kết nối trong extension Petra

### 4. Kiểm tra kết nối

Sau khi kết nối thành công:
- Địa chỉ ví sẽ hiển thị địa chỉ thực tế của bạn
- Trạng thái sẽ chuyển từ "disconnected" sang "connected"
- Bạn có thể thực hiện swap với ví thực tế

## Troubleshooting

### Nếu Petra Wallet không xuất hiện:
1. Đảm bảo extension đã được cài đặt
2. Refresh trang web
3. Kiểm tra console để xem lỗi

### Nếu không thể kết nối:
1. Kiểm tra xem Petra Wallet có đang mở không
2. Thử disconnect và connect lại
3. Kiểm tra network (mainnet/testnet) trong Petra Wallet

### Nếu vẫn hiển thị địa chỉ giả:
1. Mở Developer Tools (F12)
2. Kiểm tra Console để xem log
3. Đảm bảo `window.aptos` tồn tại trong console

## Lưu ý bảo mật

- Không bao giờ chia sẻ seed phrase
- Chỉ kết nối với các trang web đáng tin cậy
- Kiểm tra địa chỉ ví trước khi thực hiện giao dịch
- Sử dụng ví testnet cho việc thử nghiệm 