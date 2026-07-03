"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Check } from 'lucide-react';

export default function AuthSuccessPage() {
  const t = useTranslations('User.AuthFlows');
  const router = useRouter();

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      
      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-500/30 animate-bounce-short">
        <Check className="w-10 h-10 stroke-[3]" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('successTitle')}</h1>
      
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mb-10">
        {t('successDesc')}
      </p>

      <button 
        onClick={handleContinue}
        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
      >
        {t('goToHome')}
      </button>

      <style jsx>{`
        .animate-bounce-short {
          animation: bounce-short 1s ease-in-out 1;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
