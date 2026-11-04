"use client";

import { APP_ROUTES } from '@/constants/routes';
import { Link } from '@/i18n/routing';
import { ShieldAlert, ArrowLeft, School, Users, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="w-full">
      <div className="mb-6 text-center sm:text-left">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 mx-auto sm:mx-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Đăng ký tài khoản nội bộ
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Nền tảng AI Tutor được đóng gói và vận hành theo mô hình bản quyền trường học.
        </p>
      </div>

      <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-start gap-3">
          <School className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Cấp phát tài khoản tập trung:</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tài khoản Học sinh, Phụ huynh và Giáo viên được Ban Giám hiệu / Quản trị viên Nhà trường khởi tạo tự động theo danh sách lớp.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Liên kết lớp & Gia đình tự động:</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Khi nhận tài khoản từ trường, học sinh đã được xếp đúng lớp và phụ huynh đã được liên kết sẵn với con.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Bắt đầu sử dụng:</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Vui lòng sử dụng Mã học sinh hoặc Số điện thoại do Giáo viên chủ nhiệm bàn giao để đăng nhập.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Link
          href={APP_ROUTES.LOGIN}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang Đăng nhập
        </Link>
      </div>
    </div>
  );
}
