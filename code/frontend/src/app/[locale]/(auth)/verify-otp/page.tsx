"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { useState, useRef } from 'react';

export default function VerifyOTPPage() {
  const t = useTranslations('User.AuthFlows');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      router.push('/auth-success');
    }, 1000);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="w-full relative">
      <button onClick={handleBack} className="absolute -top-16 left-0 p-2 bg-white dark:bg-card-bg rounded-full shadow-sm hover:shadow-md transition-shadow">
        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mb-6 shadow-md shadow-blue-500/20">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('otpTitle')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
          {t('otpDesc')}<br/>
          <strong className="text-gray-900 dark:text-gray-200 mt-1 block">+84 9** *** 123</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
            />
          ))}
        </div>

        <div className="text-center">
          <button type="button" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            {t('resendCode')}
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || otp.join('').length !== 6}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {t('verify')} <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
