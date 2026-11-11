"use client";

import { APP_ROUTES } from "@/constants/routes";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  GraduationCap,
  BookOpen,
  Users,
  Phone,
} from "lucide-react";
import { login, verifyLoginOtpAction } from "../actions";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "parent">("student");
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);

    if (requireOtp) {
      formData.append("email", otpEmail);
      const result = await verifyLoginOtpAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        setIsLoading(false);
      }
      return;
    }

    const result = await login(formData);

    if (result?.requireOtp) {
      setRequireOtp(true);
      setOtpEmail(result.email as string);
      setIsLoading(false);
      return;
    }

    if (result?.error) {
      const knownErrors = [
        "EMAIL_EXISTS",
        "EMAIL_SEND_FAILED",
        "OTP_NOT_FOUND",
        "OTP_EXPIRED",
        "OTP_INVALID",
        "UNAUTHORIZED_ADMIN_REGISTRATION",
        "PENDING_APPROVAL",
        "INVALID_CREDENTIALS",
        "LOGIN_FAILED",
        "NETWORK_ERROR",
        "SIGNUP_FAILED",
        "OTP_VERIFICATION_FAILED",
        "NOT_ADMIN",
        "ADMIN_USE_PORTAL",
        "roleMismatch",
      ];
      setErrorMsg(
        knownErrors.includes(result.error)
          ? t(`Errors.${result.error}` as Parameters<typeof t>[0])
          : result.error,
      );
      setIsLoading(false);
    }
  }

  if (requireOtp) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Xác thực 2 yếu tố
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Mã OTP (6 chữ số) đã được gửi đến email{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {otpEmail}
            </span>
            . Mã sẽ hết hạn sau 5 phút.
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
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nhập mã OTP
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                name="otp"
                type="text"
                required
                maxLength={6}
                placeholder="Ví dụ: 123456"
                className="pl-11 pr-4 py-3 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:text-white transition-all text-center font-mono text-lg tracking-[0.4em]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold shadow-sm shadow-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" /> Xác thực và Đăng nhập
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <button
            onClick={() => {
              setRequireOtp(false);
              setErrorMsg("");
            }}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Quay lại đăng nhập
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-7">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          {t("welcomeBack")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Chọn vai trò của bạn và nhập thông tin tài khoản do nhà trường cấp phát.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Selection Tabs (Student, Teacher, Parent) */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-7 border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            role === "student"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>Học sinh</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("teacher")}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            role === "teacher"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Giáo viên</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("parent")}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            role === "parent"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Phụ huynh</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="role" value={role} />

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {role === "student" && "Mã học sinh hoặc Email"}
            {role === "teacher" && "Mã giáo viên, Email hoặc Số điện thoại"}
            {role === "parent" && "Số điện thoại hoặc Email đã đăng ký"}
          </label>
          <div className="relative">
            {role === "parent" ? (
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            ) : (
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            )}
            <input
              name="identifier"
              type="text"
              required
              placeholder={
                role === "student"
                  ? "Ví dụ: HS0001 hoặc hs0001@nguyentrai.edu.vn"
                  : role === "teacher"
                    ? "Ví dụ: GV01, mai.nguyen@nguyentrai.edu.vn hoặc 0912345001"
                    : "Ví dụ: 0901000001"
              }
              className="pl-11 pr-4 py-3 w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("passwordLabel")}
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              name="password"
              type="password"
              required
              placeholder={t("passwordPlaceholder")}
              className="pl-11 pr-4 py-3 w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 bg-white dark:bg-slate-800 dark:border-slate-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
              {t("rememberMe")}
            </span>
          </label>
          <Link
            href={APP_ROUTES.FORGOT_PASSWORD}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {t("signingInBtn")}
            </>
          ) : (
            <>
              <span>{t("signInBtn")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-7 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
        Tài khoản Học sinh, Giáo viên và Phụ huynh do Nhà trường cấp phát. Nếu cần cấp lại mật khẩu, vui lòng liên hệ Giáo viên chủ nhiệm hoặc Văn phòng nhà trường.
      </div>
    </div>
  );
}
