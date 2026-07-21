import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const t = useTranslations('Error');

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Không có quyền truy cập
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Xin lỗi, bạn không có quyền để xem trang này. Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ quản trị viên.
          </p>
        </div>

        <Link href="/">
          <Button className="mt-8" variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Trở về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
