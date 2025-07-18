# 📚 Chức Năng Các Thành Phần: UI, Backend, Smart Contract

Dưới đây là mô tả chi tiết về chức năng và nhiệm vụ của từng phần trong dự án **Dexonic DEX Aggregator** trên Aptos:

---

## 1. 🖥️ UI (Frontend)

### **Chức năng chính:**

- **Kết nối ví:** Hỗ trợ nhiều loại ví (Petra, Pontem), cho phép người dùng đăng nhập và xác thực.
- **Chọn token & nhập số lượng:** Giao diện trực quan để chọn cặp token, nhập số lượng cần swap.
- **Hiển thị bảng so sánh giá:** So sánh giá, phí, trượt giá từ nhiều DEX, gắn nhãn "Best", "Unstable Pool".
- **Swap 1-click:** Nút Swap luôn thực hiện với DEX tốt nhất.
- **Chế độ Cross Address:** Cho phép gửi token nhận được đến địa chỉ khác nếu DEX hỗ trợ.
- **Thông báo & popup:** Hiển thị toast, card, alert khi swap thành công/thất bại.
- **Quản lý profile, chat, alert:** Các trang phụ trợ như /profile, /chat, /alert.
- **Responsive & Dark mode:** Giao diện đẹp, tối ưu cho mobile và desktop.

---

## 2. 🛠️ Backend (BE / API Aggregator)

### **Chức năng chính:**

- **Tổng hợp báo giá:** Lấy dữ liệu pool, báo giá, phí, trượt giá từ nhiều DEX (AnimeSwap, Liquidswap, Aries, Panora...)
- **So sánh & chọn route tốt nhất:** Xử lý logic chọn DEX tối ưu dựa trên giá, phí, trượt giá.
- **API cho frontend:** Cung cấp endpoint như `/api/simulate-swap` để frontend lấy dữ liệu so sánh giá, mô phỏng swap.
- **Xử lý fallback & lỗi:** Đảm bảo luôn trả về dữ liệu hợp lệ, kể cả khi một DEX không phản hồi.
- **Build transaction payload:** Chuẩn bị dữ liệu giao dịch phù hợp với từng DEX, hỗ trợ frontend/wallet gửi lên blockchain.
- **Không giữ private key:** Backend KHÔNG thực hiện ký giao dịch, không giữ tiền, chỉ xử lý logic tổng hợp.

---

## 3. ⛓️ Smart Contract (Move on Aptos)

### **Chức năng chính:**

- **Thực thi giao dịch swap:** Thực hiện chuyển đổi token, tính toán giá, phí, trượt giá trên blockchain.
- **Quản lý pool thanh khoản:** Lưu trữ, cập nhật trạng thái pool, cung cấp dữ liệu cho backend/frontend.
- **Bảo mật & minh bạch:** Đảm bảo mọi giao dịch swap đều công khai, không thể bị can thiệp.
- **Tích hợp nhiều DEX:** Mỗi DEX có smart contract riêng, backend/frontend chỉ tương tác qua API/SDK.
- **(Nếu có) Aggregator contract:** Có thể hỗ trợ swap qua nhiều DEX trong một giao dịch (multi-hop), nhưng phần lớn aggregator hiện tại chỉ là backend tổng hợp.

---

## 🔄 **Luồng hoạt động tổng quan**

1. **Người dùng thao tác trên UI** (chọn token, nhập số lượng, bấm Swap)
2. **UI gửi yêu cầu lên Backend** để lấy báo giá, so sánh route
3. **Backend tổng hợp dữ liệu từ các Smart Contract DEX**
4. **UI hiển thị bảng so sánh, người dùng xác nhận giao dịch**
5. **UI/wallet gửi transaction lên blockchain, Smart Contract thực thi swap**
6. **Kết quả trả về UI, hiển thị thông báo cho người dùng**

---

**Tóm lại:**

- **UI:** Giao diện người dùng, trải nghiệm, xác nhận giao dịch
- **Backend:** Tổng hợp, so sánh, cung cấp API, build payload
- **Smart Contract:** Thực thi swap, quản lý pool, bảo mật, minh bạch
