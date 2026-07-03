"use client";

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Mail, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const t = useTranslations('User.AuthFlows');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      router.push('/verify-otp');
    }, 1000);
  };

  return (
    <div className="w-full">
      <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        {t('backToLogin')}
      </Link>

      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-md shadow-blue-500/20">
          <RotateCcw className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('forgotPwdTitle')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{t('forgotPwdDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('emailLabel')}</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              name="email"
              type="email" 
              required
              placeholder={t('emailPlaceholder')} 
              className="pl-11 pr-4 py-3 w-full bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {t('sendCode')} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="mt-8 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {t('supportText')}
      </p>
    </div>
  );
}
