"use client";

import { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { firstTimeChangePasswordAction, logout } from '../actions';

export default function FirstTimeChangePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const result = await firstTimeChangePasswordAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Đổi mật khẩu lần đầu
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Để bảo mật thông tin học tập theo quy định của Nhà trường, bạn bắt buộc phải đổi mật khẩu mặc định trước khi bắt đầu sử dụng hệ thống.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mật khẩu hiện tại (do Nhà trường cấp)
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              name="currentPassword"
              type="password"
              required
              placeholder="Nhập mật khẩu mặc định hiện tại"
              className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mật khẩu mới (tối thiểu 6 ký tự)
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              name="newPassword"
              type="password"
              required
              minLength={6}
              placeholder="Nhập mật khẩu mới của bạn"
              className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              placeholder="Nhập lại mật khẩu mới"
              className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật mật khẩu...
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" /> Lưu mật khẩu mới & Tiếp tục
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất khỏi tài khoản này
          </button>
        </form>
      </div>
    </div>
  );
}

