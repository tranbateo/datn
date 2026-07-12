"use client";

import { APP_ROUTES } from '@/constants/routes';
 

import { Link } from "@/i18n/routing";
import { BookOpen, Clock, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { gamificationService, GamificationProfile } from "@/services/gamification.service";
import { usersService, UserProfile } from "@/services/users.service";
import { curriculumService, Subject } from "@/services/curriculum.service";
import { calendarService, CalendarEvent } from "@/services/calendar.service";

export default function StudentDashboard() {
  const t = useTranslations("User.Dashboard");
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersService.getProfile(),
      gamificationService.getProfile(),
      calendarService.getEvents().catch(() => [])
    ]).then(([user, gamif, eventsData]) => {
      setProfile(user);
      setGamification(gamif);
      
      const now = new Date();
      const upcoming = eventsData
        .filter((e) => new Date(e.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 3);
      setUpcomingEvents(upcoming);
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
      <div className="flex justify-between items-center bg-white dark:bg-card-bg p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-card-border">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chào mừng trở lại, {profile?.fullName || 'Học sinh'}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Bạn đã hoàn thành 80% mục tiêu tuần này. Tiếp tục phát huy nhé!Môn học</p>
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
          {subjects.map((sub) => (
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
          <Link href={APP_ROUTES.SCHEDULE} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            {t('viewAll')}
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-6 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có lịch học nào sắp tới.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((ev) => (
              <div key={ev.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {profile?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{ev.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ev.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {ev.type}</span>
                    </div>
                  </div>
                </div>
                <Link href={APP_ROUTES.SCHEDULE} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
