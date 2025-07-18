import { Alert } from "@/components/ui/alert";

export default function AlertPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Alert Component Demo</h1>
      <Alert>
        Đây là Alert mặc định. Bạn có thể chỉnh sửa file này để thiết kế tính
        năng cho Alert.
      </Alert>
    </div>
  );
}
