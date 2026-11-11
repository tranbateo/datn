"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Shield, Lock, Mail, ArrowRight, Loader2, AlertTriangle, KeyRound, ChevronLeft } from 'lucide-react';
import { adminLogin, verifyAdminLoginOtpAction } from './actions';

export default function AdminLoginPage() {
  const t = useTranslations('Auth');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);

    if (requireOtp) {
      formData.append('email', otpEmail);
      const result = await verifyAdminLoginOtpAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        setIsLoading(false);
      }
      return;
    }

    const result = await adminLogin(formData);

    if (result?.requireOtp) {
      setRequireOtp(true);
      setOtpEmail(result.email as string);
      setIsLoading(false);
      return;
    }

    if (result?.error) {
      const knownErrors = ['EMAIL_EXISTS', 'EMAIL_SEND_FAILED', 'OTP_NOT_FOUND', 'OTP_EXPIRED', 'OTP_INVALID', 'UNAUTHORIZED_ADMIN_REGISTRATION', 'PENDING_APPROVAL', 'INVALID_CREDENTIALS', 'LOGIN_FAILED', 'NETWORK_ERROR', 'SIGNUP_FAILED', 'OTP_VERIFICATION_FAILED', 'NOT_ADMIN', 'roleMismatch'];
      setErrorMsg(knownErrors.includes(result.error) ? t(`Errors.${result.error}` as Parameters<typeof t>[0]) : result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/20 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/25 text-white">
            <Shield className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full mb-3">
            Cổng Quản Trị Trường Học (School Admin)
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">{t('adminPortal')}</h1>
          <p className="text-slate-400 text-sm">
            {requireOtp ? 'Xác thực bảo mật 2 lớp (2FA OTP)' : t('adminPortalDesc')}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-sm text-red-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {requireOtp ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 text-center mb-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                Mã OTP (6 chữ số) đã được gửi đến <span className="font-semibold text-white">{otpEmail}</span>. Mã sẽ hết hạn sau 5 phút.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Nhập mã OTP xác thực</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="pl-11 pr-4 py-3 w-full bg-slate-950/70 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-white placeholder-slate-600 transition-all text-center font-mono text-lg tracking-[0.5em]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực...</>
              ) : (
                <><ArrowRight className="w-4 h-4" /> Xác thực OTP</>
              )}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setRequireOtp(false); setErrorMsg(""); }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Quay lại bước nhập tài khoản
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('adminEmail')}</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@thptchuvanan.edu.vn"
                  className="pl-11 pr-4 py-3 w-full bg-slate-950/70 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-white placeholder-slate-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('securityPasskey')}</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-11 pr-4 py-3 w-full bg-slate-950/70 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-white placeholder-slate-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('authenticatingBtn')}</>
              ) : (
                <><ArrowRight className="w-4 h-4" /> {t('secureLoginBtn')}</>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <Link href={APP_ROUTES.LOGIN} className="hover:text-white transition-colors inline-flex items-center gap-1 font-medium">
            <ChevronLeft className="w-3.5 h-3.5" /> Cổng Học sinh / Giáo viên
          </Link>
          <Link href={APP_ROUTES.HOME} className="hover:text-white transition-colors font-medium">
            {t('returnPublic')}
          </Link>
        </div>
      </div>
    </div>
  );
}
