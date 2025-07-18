import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Center</h1>
      <p className="mb-4">Chọn chức năng:</p>
      <div className="flex space-x-4">
        <Link href="/auth/callback">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Đăng nhập
          </button>
        </Link>
        <Link href="/auth/success">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Đăng ký
          </button>
        </Link>
      </div>
    </div>
  );
}
