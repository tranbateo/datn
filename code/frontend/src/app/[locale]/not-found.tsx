"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const t = useTranslations("Errors");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-card-bg p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-card-border text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('404Title')}</h2>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          {t('404Desc')}
        </p>
        
        <Link 
          href={APP_ROUTES.HOME} 
          className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          <Home className="w-5 h-5" />
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
