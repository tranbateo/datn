"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "@/i18n/routing";
import { Play, Sparkles, BookOpen, Clock, ChevronRight, Star, Bot, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { gamificationService, GamificationProfile } from "@/services/gamification.service";
import { usersService, UserProfile } from "@/services/users.service";
import { curriculumService, Subject } from "@/services/curriculum.service";

export default function StudentDashboard() {
  const t = useTranslations("User.Dashboard");
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersService.getProfile(),
      gamificationService.getProfile()
    ]).then(([user, gamif]) => {
      setProfile(user);
      setGamification(gamif);
      if (user.grade) {
        return curriculumService.getSubjectsByGrade(user.grade);
      }
      return [];
    }).then(subs => {
      setSubjects(subs);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      {/* --- DESKTOP/TABLET GREETING (Hidden on mobile as it's in header) --- */}
      <div className="hidden md:flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Chào mừng trở lại, {profile?.name || "Học viên"}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Lớp {profile?.grade || "?"} • {subjects.length} Môn học</p>
        </div>
      </div>

      {/* --- GOAL CARD --- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 blur-2xl rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Cấp độ {gamification?.level || 1}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cố gắng thêm chút nữa để lên cấp!</p>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-sm font-bold">
              <span className="text-lg">🔥</span> {gamification?.streakDays || 0} ngày
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-2 text-sm font-bold">
            <span className="text-blue-600 dark:text-blue-400">{gamification?.currentXp || 0} XP</span>
            <span className="text-gray-400 dark:text-gray-500">{gamification?.nextLevelXp || 1000} XP</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
               className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" 
               style={{ width: `${Math.min(100, ((gamification?.currentXp || 0) / (gamification?.nextLevelXp || 1000)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- CURRICULUM SUBJECTS --- */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chương trình học (Lớp {profile?.grade})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {subjects.map((sub, idx) => (
            <div key={sub.id} className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 cursor-pointer hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                {sub.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{sub.name}</h4>
              </div>
            </div>
          ))}
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
      </div>
      
    </div>
  );
}
