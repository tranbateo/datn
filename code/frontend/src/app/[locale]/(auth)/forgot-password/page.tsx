"use client";

import { APP_ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  GraduationCap,
  BookOpen,
  Users,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { fetchApi } from "@/lib/api-client";

type ResetRole = "STUDENT" | "TEACHER" | "PARENT";

interface ResetRequestResponse {
  success: boolean;
  role: string;
  schoolName?: string;
  homeroomTeacherName?: string | null;
  className?: string | null;
  handlerText: string;
  message: string;
}

export default function ForgotPasswordPage() {
  const [role, setRole] = useState<ResetRole>("STUDENT");
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedResult, setSubmittedResult] =
    useState<ResetRequestResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetchApi<ResetRequestResponse>(
        "/auth/password-reset-request",
        {
          method: "POST",
          body: JSON.stringify({
            role,
            identifier: identifier.trim(),
            reason: reason.trim() || undefined,
          }),
        },
      );
      setSubmittedResult(res);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể gửi yêu cầu cấp lại mật khẩu. Vui lòng thử lại.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="w-full space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Đã gửi yêu cầu cấp lại mật khẩu
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {submittedResult.message}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Quy trình nhận mật khẩu mới
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-300">
            <li>
              <strong>{submittedResult.handlerText}</strong> đã nhận được thông
              báo yêu cầu của bạn trên hệ thống.
            </li>
            <li>
              {submittedResult.role === "STUDENT"
                ? "Nhận mật khẩu tạm trực tiếp từ Giáo viên chủ nhiệm / Văn phòng nhà trường, hoặc xem thông báo gửi tự động trong tài khoản Phụ huynh đã liên kết."
                : "Liên hệ Quản trị viên / Văn phòng nhà trường để nhận mật khẩu tạm."}
            </li>
            <li>
              Quay lại trang Đăng nhập với mật khẩu tạm — hệ thống sẽ tự động mở
              màn hình để bạn <strong>tự đặt mật khẩu mới</strong>.
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={APP_ROUTES.LOGIN}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmittedResult(null);
              setIdentifier("");
              setReason("");
            }}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Gửi yêu cầu khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        href={APP_ROUTES.LOGIN}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-7"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại đăng nhập
      </Link>

      <div className="mb-6">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-5 shadow-md shadow-blue-500/20">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Yêu cầu cấp lại mật khẩu
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Tài khoản do Nhà trường quản lý. Chọn đúng vai trò để gửi yêu cầu cấp
          mật khẩu tạm tới đúng đơn vị phụ trách.
        </p>
      </div>

      {/* Role tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5 border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => {
            setRole("STUDENT");
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            role === "STUDENT"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>Học sinh</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("TEACHER");
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            role === "TEACHER"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Giáo viên</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("PARENT");
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            role === "PARENT"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Phụ huynh</span>
        </button>
      </div>

      {/* Role-specific handler info */}
      <div className="mb-5 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
        {role === "STUDENT" ? (
          <>
            <strong>Đơn vị tiếp nhận:</strong> Yêu cầu của Học sinh sẽ được gửi
            trực tiếp tới <strong>Giáo viên chủ nhiệm lớp</strong> và{" "}
            <strong>Quản trị viên nhà trường</strong> để xác minh và cấp mật khẩu
            tạm.
          </>
        ) : role === "TEACHER" ? (
          <>
            <strong>Đơn vị tiếp nhận:</strong> Yêu cầu của Giáo viên sẽ được gửi
            trực tiếp tới <strong>Quản trị viên nhà trường (Admin)</strong> để
            cấp lại mật khẩu tạm.
          </>
        ) : (
          <>
            <strong>Đơn vị tiếp nhận:</strong> Yêu cầu của Phụ huynh sẽ được gửi
            tới <strong>Quản trị viên nhà trường (Admin)</strong> để xác minh và
            cấp lại mật khẩu tạm.
          </>
        )}
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {role === "STUDENT" && "Mã học sinh hoặc Email *"}
            {role === "TEACHER" && "Mã giáo viên, Email hoặc Số điện thoại *"}
            {role === "PARENT" && "Số điện thoại hoặc Email đã đăng ký *"}
          </label>
          <div className="relative">
            {role === "PARENT" ? (
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            ) : (
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            )}
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                role === "STUDENT"
                  ? "Ví dụ: HS0001 hoặc hs0001@nguyentrai.edu.vn"
                  : role === "TEACHER"
                    ? "Ví dụ: GV01 hoặc mai.nguyen@nguyentrai.edu.vn"
                    : "Ví dụ: 0901000001"
              }
              className="pl-11 pr-4 py-3 w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Ghi chú cho{" "}
            {role === "STUDENT" ? "GVCN / Nhà trường" : "Quản trị viên"} (tùy
            chọn)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              role === "STUDENT"
                ? "Ví dụ: Em quên mật khẩu đăng nhập, nhờ cô cấp lại giúp em..."
                : "Ví dụ: Quên mật khẩu tài khoản giảng dạy..."
            }
            className="w-full px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !identifier.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi yêu cầu...
            </>
          ) : (
            <>
              Gửi yêu cầu cấp lại mật khẩu <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
