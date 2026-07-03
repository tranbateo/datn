"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "@/i18n/routing";
import { Play, Sparkles, BookOpen, Clock, ChevronRight, Star, Bot } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function StudentDashboard() {
  const t = useTranslations("User.Dashboard");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      {/* --- DESKTOP/TABLET GREETING (Hidden on mobile as it's in header) --- */}
      <div className="hidden md:flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {t('greeting')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* --- GOAL CARD --- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 blur-2xl rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('weeklyGoal')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('goalDesc')}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-sm font-bold">
              <span className="text-lg">🔥</span> {t('daysStreak')}
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-2 text-sm font-bold">
            <span className="text-blue-600 dark:text-blue-400">1,250 XP</span>
            <span className="text-gray-400 dark:text-gray-500">2,000 XP</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '62%' }}></div>
          </div>
        </div>
      </div>

      {/* --- UP NEXT --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('upNext')}</h2>
          <Link href="/dashboard/schedule" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            {t('viewAll')}
          </Link>
        </div>

        {/* Main Next Class */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
          
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          
          <div className="flex-1">
            <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">{t('classTime')}</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5">{t('classTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('classDesc')}</p>
          </div>
          
          <button className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
          </button>
        </div>

        {/* Small Action Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Homework */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center cursor-pointer hover:border-blue-200 transition-colors h-32">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t('mathHomework')}</h4>
            <div className="flex items-center gap-1 text-xs text-rose-500 font-medium">
              <Clock className="w-3 h-3" /> {t('dueToday')}
            </div>
          </div>

          {/* AI Review */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center cursor-pointer hover:border-teal-200 transition-colors h-32">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t('aiReview')}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
              <Bot className="w-3 h-3" /> {t('recommended')}
            </div>
          </div>
        </div>
      </div>

      {/* --- RECENT COURSES --- */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('recentCourses')}</h2>
        
        {/* Horizontal scroll container on mobile, grid on desktop */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:overflow-visible hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
          
          {/* Course 1 */}
          <Link href="/dashboard/lesson/1" className="min-w-[240px] md:min-w-0 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group cursor-pointer shrink-0 flex flex-col hover:shadow-md transition-all">
            <div className="h-32 bg-blue-100 relative w-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop" alt="Code" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold text-gray-900">
                <Star className="w-3 h-3 text-amber-400" fill="currentColor" /> 4.8
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">{t('progCategory')}</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 line-clamp-2">{t('progTitle')}</h3>
              
              <div className="mt-auto">
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-2">
                  <span>{t('progressLabel')}</span>
                  <span>45%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </Link>

          {/* Course 2 */}
          <Link href="/dashboard/lesson/2" className="min-w-[240px] md:min-w-0 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group cursor-pointer shrink-0 flex flex-col hover:shadow-md transition-all">
            <div className="h-32 bg-amber-100 relative w-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=600&auto=format&fit=crop" alt="History" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">{t('histCategory')}</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 line-clamp-2">{t('histTitle')}</h3>
              
              <div className="mt-auto">
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-2">
                  <span>{t('progressLabel')}</span>
                  <span>12%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </Link>
          
        </div>
      </div>
      
    </div>
  );
}
