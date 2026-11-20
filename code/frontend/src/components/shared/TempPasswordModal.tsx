"use client";

import { useState } from "react";
import { KeyRound, Copy, Check, X, ShieldAlert, CheckCircle2 } from "lucide-react";

export interface NotifiedParentInfo {
  id: string;
  fullName: string;
  phone?: string | null;
}

export interface TempPasswordModalData {
  fullName: string;
  studentCode?: string | null;
  email?: string | null;
  className?: string | null;
  roleLabel: string;
  tempPassword: string;
  notifiedParents?: NotifiedParentInfo[];
}

export default function TempPasswordModal({
  data,
  onClose,
}: {
  data: TempPasswordModalData | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" />
            Đã cấp mật khẩu tạm mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/70 border border-slate-200/70 dark:border-gray-700 text-sm space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">
              {data.fullName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {data.roleLabel}
              {data.studentCode ? ` • Mã: ${data.studentCode}` : ""}
              {data.className ? ` • ${data.className}` : ""}
            </div>
            {data.email && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Email: {data.email}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mật khẩu tạm thời (chỉ hiển thị một lần)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 font-mono text-lg font-extrabold tracking-wider text-amber-900 dark:text-amber-200 text-center select-all">
                {data.tempPassword}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Sao chép
                  </>
                )}
              </button>
            </div>
          </div>

          {data.notifiedParents && data.notifiedParents.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Đã tự động gửi thông báo tới tài khoản Phụ huynh liên kết:</strong>{" "}
                {data.notifiedParents
                  .map((p) => `${p.fullName}${p.phone ? ` (${p.phone})` : ""}`)
                  .join(", ")}
                . Phụ huynh mở Cổng Phụ huynh là thấy ngay mật khẩu tạm để chuyển cho con.
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              Toàn bộ phiên đăng nhập cũ của tài khoản này đã bị thu hồi. Hãy gửi
              mật khẩu tạm này cho người dùng; hệ thống sẽ{" "}
              <strong>bắt buộc đổi mật khẩu mới</strong> ngay khi đăng nhập.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold transition-colors"
          >
            Đã ghi nhận & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
