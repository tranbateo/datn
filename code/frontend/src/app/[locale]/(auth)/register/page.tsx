"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signup, verifyOtp } from '../actions';

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [verificationMethod, setVerificationMethod] = useState<"link" | "otp">("link");
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [userEmail, setUserEmail] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    const result = await signup(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    } else {
      setUserEmail(email);
      if (verificationMethod === 'link') {
        setIsVerifyingLink(true);
      } else {
        setIsVerifyingOtp(true);
      }
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    formData.append('email', userEmail);
    
    const result = await verifyOtp(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      setIsVerifyingOtp(false);
      setIsSuccess(true);
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('verifySuccess')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Tài khoản của bạn đã được kích hoạt thành công. Vui lòng đăng nhập lại để sử dụng hệ thống.
        </p>
        <Link href={APP_ROUTES.LOGIN} className="w-full flex justify-center bg-primary hover:bg-primary-hover text-white py-3 rounded-xl text-sm font-semibold transition-colors">
          Đến trang Đăng nhập
        </Link>
      </div>
    );
  }

  if (isVerifyingLink) {
    return (
      <div className="w-full">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('checkEmail')}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Chúng tôi đã gửi một đường link xác nhận đến email: <br/>
            <span className="font-semibold text-gray-900 dark:text-white">{userEmail}</span><br/>
            Vui lòng kiểm tra hộp thư đến (hoặc Spam) và click vào link để đăng nhập.
          </p>
        </div>
        <Link href={APP_ROUTES.LOGIN} className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl text-sm font-semibold transition-colors mt-4">
          <ArrowRight className="w-4 h-4" /> Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  if (isVerifyingOtp) {
    return (
      <div className="w-full">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('checkEmail')}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('checkEmailDesc')} <br/>
            <span className="font-semibold text-gray-900 dark:text-white">{userEmail}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('verifyCode')}</label>
            <input 
              name="token"
              type="text" 
              required
              maxLength={6}
              placeholder="123456" 
              className="px-4 py-3 w-full text-center tracking-widest text-2xl font-bold bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('verifyingBtn')}</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> {t('verifyBtn')}</>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('resendCode')} {' '}
          <button type="button" className="font-semibold text-primary hover:text-primary-hover transition-colors">
            {t('resendBtn')}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('createAccount')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('createAccountDesc')}</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('firstName')}</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                name="firstName"
                type="text" 
                required
                placeholder="John" 
                className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('lastName')}</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                name="lastName"
                type="text" 
                required
                placeholder="Doe" 
                className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
              />
            </div>
          </div>
        </div>

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
              minLength={6}
              placeholder={t('passwordPlaceholder')} 
              className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-shadow"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{t('passwordMin')}</p>
        </div>

        <div className="space-y-4 pt-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phương thức xác thực</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="verificationMethod" 
                value="link" 
                checked={verificationMethod === 'link'} 
                onChange={() => setVerificationMethod('link')}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Gửi Link xác nhận</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="verificationMethod" 
                value="otp" 
                checked={verificationMethod === 'otp'} 
                onChange={() => setVerificationMethod('otp')}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Gửi mã OTP</span>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {t('creatingAccountBtn')}</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> {t('createAccountBtn')}</>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        {t('alreadyAccount')} {' '}
        <Link href={APP_ROUTES.LOGIN} className="font-semibold text-primary hover:text-primary-hover transition-colors">
          {t('login')}
        </Link>
      </p>
    </div>
  );
}
