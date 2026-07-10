"use client";

import { useState, useEffect } from "react";
import { gamificationService, GamificationProfile } from "@/services/gamification.service";
import { Loader2, Flame, Star, Trophy } from "lucide-react";
import Image from "next/image";

type LeaderboardEntry = {
  id: string;
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  user: { fullName: string; avatarUrl: string; email: string };
};

export default function ProgressPage() {
  const [profile, setProfile] = useState<GamificationProfile & { rank?: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      gamificationService.getProfile(),
      gamificationService.getLeaderboard(10)
    ]).then(([p, l]) => {
      setProfile(p as unknown as GamificationProfile & { rank?: number });
      setLeaderboard(l);
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tiến độ & Thành tích</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Theo dõi quá trình học tập và thi đua cùng bạn bè.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Level Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-indigo-100 font-medium mb-1">Cấp độ hiện tại</div>
                <h2 className="text-4xl font-bold flex items-center gap-2">
                  <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" /> 
                  Cấp {profile?.level || 1}
                </h2>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl text-center">
                <div className="text-xs text-indigo-100 uppercase tracking-wider font-bold mb-0.5">Xếp hạng</div>
                <div className="text-2xl font-bold">#{profile?.rank || '-'}</div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2 text-sm font-bold">
                <span>{profile?.currentXp || 0} XP</span>
                <span className="text-indigo-200">
                  {/* Fake next level logic just for UI display if backend didn't send */}
                  {Math.pow(profile?.level || 1, 2) * 100} XP
                </span>
              </div>
              <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full"
                  style={{ width: `${Math.min(100, ((profile?.currentXp || 0) / (Math.pow(profile?.level || 1, 2) * 100)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-orange-100 dark:border-orange-900/30 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
            <Flame className="w-10 h-10 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{profile?.streakDays || 0}</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">Ngày học liên tiếp</p>
          <div className="text-sm bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full font-bold">
            Kỷ lục: {profile?.streakDays || 0} ngày
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-600">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bảng xếp hạng</h2>
        </div>
        
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = false; // We don't have userId on GamificationProfile
            
            return (
              <div 
                key={entry.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isCurrentUser 
                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50' 
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                } transition-colors`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 text-center font-bold text-lg ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-amber-600' :
                    'text-gray-400 dark:text-gray-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                    {entry.user?.avatarUrl ? (
                      <Image src={entry.user.avatarUrl} alt={entry.user.fullName} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      entry.user?.fullName?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {entry.user?.fullName}
                      {isCurrentUser && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Bạn</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Cấp {entry.level}</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> {entry.currentStreak} ngày</span>
                    </div>
                  </div>
                </div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  {entry.xp} <span className="text-xs text-gray-400 font-normal">XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
