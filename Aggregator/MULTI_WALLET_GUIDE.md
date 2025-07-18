# 🔗 Hướng dẫn sử dụng Multi-Wallet - AptosSwap

## 📋 **Tổng quan**

AptosSwap hiện tại hỗ trợ **multi-wallet** với các tính năng sau:

### ✅ **Hỗ trợ Wallet:**
- **Petra Wallet**: Single account (1 ví)
- **Pontem Wallet**: Multi-account (nhiều ví trong cùng extension)

### 🔄 **Tính năng Multi-Wallet:**

1. **Auto-Detection**: Tự động phát hiện wallet có sẵn
2. **Account Switching**: Chuyển đổi giữa các ví trong Pontem
3. **Real-time Updates**: Cập nhật real-time khi đổi ví
4. **Manual Refresh**: Button refresh để cập nhật thủ công
5. **Event Listeners**: Lắng nghe sự kiện thay đổi ví

---

## 🚀 **Cách sử dụng**

### **1. Kết nối Wallet**

#### **Bước 1: Cài đặt Wallet Extension**
- **Petra Wallet**: [https://petra.app/](https://petra.app/)
- **Pontem Wallet**: [https://pontem.network/](https://pontem.network/)

#### **Bước 2: Kết nối**
1. Mở trang [http://localhost:3000/swap](http://localhost:3000/swap)
2. Click button "Connect Wallet"
3. Chọn wallet muốn kết nối:
   - **Petra Wallet**: Single account
   - **Pontem Wallet**: Multi-account support

### **2. Sử dụng Multi-Account (Pontem)**

#### **Chuyển đổi ví:**
1. Kết nối Pontem Wallet
2. Trong Pontem extension, chuyển sang ví khác
3. Trang web sẽ tự động cập nhật sau 2 giây
4. Hoặc click button "Refresh" để cập nhật ngay lập tức

#### **Account Selector:**
- Khi có nhiều ví trong Pontem, sẽ hiển thị "Switch Account (1/3)"
- Click để mở dialog chọn ví
- Chọn ví muốn sử dụng

### **3. Tính năng Auto-Update**

#### **Event Listeners:**
- `accountChanged`: Khi đổi ví trong Pontem
- `accountsChanged`: Khi danh sách ví thay đổi
- `connect`: Khi kết nối mới
- `disconnect`: Khi ngắt kết nối

#### **Polling (Fallback):**
- Kiểm tra thay đổi ví mỗi 2 giây
- Tự động cập nhật nếu phát hiện thay đổi

---

## 🔧 **Troubleshooting**

### **Vấn đề thường gặp:**

#### **1. Wallet không được phát hiện**
```
❌ "No wallets detected"
```
**Giải pháp:**
- Kiểm tra wallet extension đã cài đặt chưa
- Refresh trang web
- Kiểm tra console browser để xem lỗi

#### **2. Không tự động cập nhật khi đổi ví**
```
❌ Đổi ví trong Pontem nhưng trang web không cập nhật
```
**Giải pháp:**
- Click button "Refresh" 
- Đợi 2-3 giây để polling phát hiện
- Kiểm tra console browser

#### **3. Balance không hiển thị**
```
❌ "Balance: 0.00" hoặc "Balance: Loading..."
```
**Giải pháp:**
- Kiểm tra ví có token không
- Refresh wallet state
- Kiểm tra network connection

### **Debug Commands:**

#### **Kiểm tra Wallet Status:**
```javascript
// Trong browser console
console.log('Petra available:', !!(window.aptos))
console.log('Pontem available:', !!(window.pontem || window.Pontem))
```

#### **Manual Refresh:**
```javascript
// Trigger manual refresh
window.dispatchEvent(new Event('pontemAccountChanged'))
```

---

## 📁 **File Structure**

```
components/wallet/
├── multi-wallet-provider.tsx    # Main provider
├── multi-wallet-selector.tsx    # UI component
├── petra-context.tsx           # Petra wallet logic
├── pontem-context.tsx          # Pontem wallet logic
└── wallet-debug.tsx            # Debug component
```

### **Key Components:**

#### **1. MultiWalletProvider**
- Quản lý state của tất cả wallets
- Cung cấp unified interface
- Handle multi-account switching

#### **2. PontemContext**
- Multi-account support
- Event listeners cho account changes
- Polling mechanism
- Manual refresh function

#### **3. PetraContext**
- Single account support
- Consistent interface với Pontem
- Refresh function

---

## 🔄 **API Reference**

### **MultiWalletContext Interface:**

```typescript
interface MultiWalletContextType {
  // Basic wallet info
  connected: boolean
  address: string | null
  network: string | null
  activeWallet: 'petra' | 'pontem' | null
  
  // Connection methods
  connect: (walletType: WalletType) => Promise<void>
  disconnect: () => void
  
  // Multi-account support
  accounts: string[]
  currentAccountIndex: number
  switchAccount: (index: number) => Promise<void>
  getAccounts: () => Promise<string[]>
  refreshWalletState: () => Promise<void>
  
  // Status
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  availableWallets: WalletType[]
}
```

### **Usage Example:**

```typescript
import { useMultiWallet } from '@/components/wallet/multi-wallet-provider'

function MyComponent() {
  const { 
    connected, 
    address, 
    activeWallet,
    accounts,
    switchAccount,
    refreshWalletState 
  } = useMultiWallet()

  // Switch to different account
  const handleSwitchAccount = async (index: number) => {
    await switchAccount(index)
  }

  // Manual refresh
  const handleRefresh = async () => {
    await refreshWalletState()
  }
}
```

---

## 🎯 **Best Practices**

### **1. Error Handling:**
```typescript
try {
  await switchAccount(index)
} catch (error) {
  console.error('Failed to switch account:', error)
  // Show user-friendly error message
}
```

### **2. Loading States:**
```typescript
const [isLoading, setIsLoading] = useState(false)

const handleAction = async () => {
  setIsLoading(true)
  try {
    await refreshWalletState()
  } finally {
    setIsLoading(false)
  }
}
```

### **3. Event Cleanup:**
```typescript
useEffect(() => {
  // Setup event listeners
  return () => {
    // Cleanup event listeners
  }
}, [])
```

---

## 🚀 **Tính năng mới đã thêm:**

### ✅ **Pontem Multi-Account Support:**
- Tự động phát hiện nhiều ví trong Pontem
- Account selector UI
- Real-time switching

### ✅ **Event Listeners:**
- `accountChanged`
- `accountsChanged` 
- `connect`/`disconnect`

### ✅ **Polling Mechanism:**
- Kiểm tra thay đổi mỗi 2 giây
- Fallback khi event listeners không hoạt động

### ✅ **Manual Refresh:**
- Button refresh trong UI
- `refreshWalletState()` function

### ✅ **Debug Tools:**
- Console logging chi tiết
- Debug component (bottom-right corner)
- Error handling

---

## 📞 **Support**

Nếu gặp vấn đề:

1. **Kiểm tra Console**: F12 → Console tab
2. **Debug Component**: Click button "Debug Wallets" 
3. **Manual Refresh**: Click button "Refresh"
4. **Check Network**: Đảm bảo kết nối internet ổn định

**Logs quan trọng:**
- `"Pontem wallet detected"`
- `"Successfully connected to Pontem wallet"`
- `"Pontem account change detected, reconnecting..."`
- `"Address change detected via polling"`

---

*Last updated: January 2025* 