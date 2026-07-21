"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import { login, verifyLoginOtpAction } from '../actions';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    
    if (requireOtp) {
      // Add email to formData for OTP verification
      formData.append('email', otpEmail);
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
      const knownErrors = ['EMAIL_EXISTS', 'EMAIL_SEND_FAILED', 'OTP_NOT_FOUND', 'OTP_EXPIRED', 'OTP_INVALID', 'UNAUTHORIZED_ADMIN_REGISTRATION', 'PENDING_APPROVAL', 'INVALID_CREDENTIALS', 'LOGIN_FAILED', 'NETWORK_ERROR', 'SIGNUP_FAILED', 'OTP_VERIFICATION_FAILED', 'NOT_ADMIN', 'ADMIN_USE_PORTAL', 'roleMismatch'];
      setErrorMsg(knownErrors.includes(result.error) ? t(`Errors.${result.error}` as Parameters<typeof t>[0]) : result.error);
      setIsLoading(false);
    }
  }

  if (requireOtp) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Xác thực 2 yếu tố</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Mã OTP (6 chữ số) đã được gửi đến email <span className="font-semibold text-gray-900 dark:text-white">{otpEmail}</span>. Mã sẽ hết hạn sau 5 phút.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nhập mã OTP</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                name="otp"
                type="text" 
                required
                maxLength={6}
                placeholder="Ví dụ: 123456" 
                className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow text-center font-mono text-lg tracking-[0.5em]"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực...</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Xác thực và Đăng nhập</>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <button onClick={() => { setRequireOtp(false); setErrorMsg(""); }} className="font-semibold text-primary hover:text-primary-hover transition-colors">
            Quay lại đăng nhập
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('welcomeBack')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('loginDesc')}</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl mb-8">
        <button
          type="button"
          onClick={() => setRole('student')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            role === 'student' 
              ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          👨‍🎓 Học sinh
        </button>
        <button
          type="button"
          onClick={() => setRole('teacher')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            role === 'teacher' 
              ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          👩‍🏫 Giáo viên
        </button>
        <button
          type="button"
          onClick={() => setRole('parent')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            role === 'parent' 
              ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          👨‍👩‍👧 Phụ huynh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hidden input to pass the selected role to the backend if needed */}
        <input type="hidden" name="role" value={role} />
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('emailLabel')}</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              name="email"
              type="email" 
              required
              placeholder={t('emailPlaceholder')} 
              className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('passwordLabel')}</label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              name="password"
              type="password" 
              required
              placeholder={t('passwordPlaceholder')} 
              className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 bg-white dark:bg-gray-800 dark:border-gray-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">{t('rememberMe')}</span>
          </label>
          <Link href={APP_ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
            {t('forgotPassword')}
          </Link>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {t('signingInBtn')}</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> {t('signInBtn')}</>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        {t('noAccount')} {' '}
        <Link href={APP_ROUTES.REGISTER} className="font-semibold text-primary hover:text-primary-hover transition-colors">
          {t('signup')}
        </Link>
      </p>
    </div>
  );
}
