// Debug script để kiểm tra Pontem Wallet extension
// Chạy script này trong console của trình duyệt

console.log("=== Debug Pontem Wallet ===");

// Kiểm tra các object có thể có của Pontem
console.log("window.pontem:", window.pontem);
console.log("window.Pontem:", window.Pontem);
console.log("window.pontemWallet:", window.pontemWallet);

// Kiểm tra tất cả các property có chứa "pontem"
const pontemProps = Object.keys(window).filter(key => 
  key.toLowerCase().includes('pontem')
);
console.log("Properties containing 'pontem':", pontemProps);

// Kiểm tra tất cả các property có chứa "wallet"
const walletProps = Object.keys(window).filter(key => 
  key.toLowerCase().includes('wallet')
);
console.log("Properties containing 'wallet':", walletProps);

// Thử kết nối nếu tìm thấy Pontem
if (window.pontem) {
  console.log("Found window.pontem, attempting to connect...");
  try {
    window.pontem.connect().then(response => {
      console.log("Pontem connect response:", response);
    }).catch(error => {
      console.error("Pontem connect error:", error);
    });
  } catch (error) {
    console.error("Pontem connect failed:", error);
  }
}

if (window.Pontem) {
  console.log("Found window.Pontem, attempting to connect...");
  try {
    window.Pontem.connect().then(response => {
      console.log("Pontem connect response:", response);
    }).catch(error => {
      console.error("Pontem connect error:", error);
    });
  } catch (error) {
    console.error("Pontem connect failed:", error);
  }
}

console.log("=== Debug Complete ==="); 