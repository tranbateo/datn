"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Shield, Lock, Mail, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { adminLogin } from './actions';

export default function AdminLoginPage() {
  const t = useTranslations('Auth');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const result = await adminLogin(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 dark:bg-black p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{t('adminPortal')}</h1>
          <p className="text-gray-400 text-sm">{t('adminPortalDesc')}</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/40 border border-red-800 text-sm text-red-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">{t('adminEmail')}</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                name="email"
                type="email" 
                required
                placeholder="admin@edutech.com" 
                className="pl-10 pr-4 py-2.5 w-full bg-gray-900/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-600 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">{t('securityPasskey')}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••" 
                className="pl-10 pr-4 py-2.5 w-full bg-gray-900/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-600 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('authenticatingBtn')}</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> {t('secureLoginBtn')}</>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <Link href={APP_ROUTES.HOME} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            {t('returnPublic')}
          </Link>
        </div>
      </div>
    </div>
  );
}
