"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Home, FileText, CheckCircle2, XCircle, Clock, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function QuizResultPage() {
  const t = useTranslations('User.Quiz');
  const router = useRouter();
  const [score, setScore] = useState(0);

  // Animate score from 0 to 80
  useEffect(() => {
    const timer = setTimeout(() => setScore(80), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] p-4 sm:p-6 lg:p-8 flex justify-center items-center">
      <div className="w-full max-w-md bg-white dark:bg-card-bg rounded-3xl shadow-sm border border-gray-100 dark:border-card-border overflow-hidden flex flex-col items-center p-6 sm:p-8 relative">
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/10 dark:to-card-bg opacity-50 -z-10"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>

        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider border border-blue-100 dark:border-blue-900/50 mb-6">
          {t('completedSubtitle')}
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{t('awesome')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[250px] mb-8 leading-relaxed">
          {t('completedDesc')}
        </p>

        {/* Score Circle */}
        <div className="relative w-48 h-48 mb-8 flex justify-center items-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="2.5"
              className="dark:stroke-gray-800"
            />
            {/* Foreground Circle (Animated) */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeDasharray={`${score}, 100`}
              className="transition-all duration-1000 ease-out drop-shadow-md"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">8/10</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('score')}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="w-full flex gap-4 mb-8">
          <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 flex flex-col items-center border border-gray-100 dark:border-gray-800">
            <Clock className="w-5 h-5 text-gray-400 mb-2" />
            <span className="font-bold text-gray-900 dark:text-white text-lg">12:45</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase">{t('timeTaken')}</span>
          </div>
          <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 flex flex-col items-center border border-amber-100 dark:border-amber-900/30">
            <Star className="w-5 h-5 text-amber-500 mb-2" />
            <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">+150</span>
            <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500 uppercase">{t('xpEarned')}</span>
          </div>
        </div>

        {/* Details List */}
        <div className="w-full space-y-4 mb-8">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white px-2">{t('details')}</h3>
          <div className="bg-white dark:bg-card-bg border border-gray-100 dark:border-card-border rounded-2xl shadow-sm divide-y divide-gray-50 dark:divide-gray-800/50">
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('correct')}</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">8 {t('questions')}</span>
            </div>
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('incorrect')}</span>
              </div>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">2 {t('questions')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <button 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" /> {t('reviewAnswers')}
          </button>
          <button 
            onClick={() => router.push(APP_ROUTES.DASHBOARD)}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3.5 rounded-2xl text-sm font-bold transition-colors border border-gray-200 dark:border-gray-700"
          >
            <Home className="w-4 h-4" /> {t('backToHome')}
          </button>
        </div>

      </div>
    </div>
  );
}
