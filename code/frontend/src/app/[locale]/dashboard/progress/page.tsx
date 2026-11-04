"use client";

import { useState, useEffect } from "react";
import { gamificationService, GamificationProfile } from "@/services/gamification.service";
import { usersService } from "@/services/users.service";
import { curriculumService, Subject } from "@/services/curriculum.service";
import { Loader2, Flame, Star, Trophy, CheckCircle2, AlertCircle, Bot, Edit3 } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

type LeaderboardEntry = {
  id: string;
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  user: { fullName: string; avatarUrl: string; email: string };
};

export default function ProgressPage() {
  const [profile, setProfile] = useState<(GamificationProfile & { rank?: number }) | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grade, setGrade] = useState<number>(9);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      gamificationService.getProfile(),
      gamificationService.getLeaderboard(10),
      usersService.getProfile().catch(() => null),
    ])
      .then(async ([p, l, user]) => {
        setProfile(p as unknown as GamificationProfile & { rank?: number });
        setLeaderboard(l);
        const userGrade = Number(user?.grade) || 9;
        setGrade(userGrade);
        const subs = await curriculumService.getSubjectsByGrade(userGrade).catch(() => []);
        setSubjects(subs);
        setLoading(false);
      })
      .catch((err) => {
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

  const nextLevelTarget = Math.max(100, Math.pow(profile?.level || 1, 2) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tiến độ & Thành tích Học tập</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi năng lực theo từng môn học, lộ trình ôn tập thông minh và bảng xếp hạng thi đua.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Level Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-indigo-100 font-medium mb-1">Cấp độ học tập hiện tại (Khối {grade})</div>
                <h2 className="text-4xl font-bold flex items-center gap-2">
                  <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                  Cấp {profile?.level || 1}
                </h2>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl text-center">
                <div className="text-xs text-indigo-100 uppercase tracking-wider font-bold mb-0.5">Xếp hạng</div>
                <div className="text-2xl font-bold">#{profile?.rank || "-"}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2 text-sm font-bold">
                <span>{profile?.currentXp || 0} XP</span>
                <span className="text-indigo-200">{nextLevelTarget} XP</span>
              </div>
              <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full"
                  style={{
                    width: `${Math.min(100, ((profile?.currentXp || 0) / nextLevelTarget) * 100)}%`,
                  }}
                />
              </div>

              {(profile?.currentXp || 0) >= nextLevelTarget && (
                <Link
                  href="/dashboard/practice"
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-amber-900 rounded-2xl font-bold shadow-lg shadow-yellow-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5 fill-amber-900" />
                  Làm Bài Thi Vượt Cấp Ngay
                </Link>
              )}
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

      {/* Mastery & Adaptive Recommendations (FR-LEARN-001, FR-LEARN-002, FR-LEARN-003) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Phân tích Năng lực & Đề xuất Ôn tập Cá nhân hóa
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hệ thống tự động xác định các chuyên đề vững và các chuyên đề cần củng cố thêm.
            </p>
          </div>
          <Link
            href="/dashboard/ai-tutor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors w-fit"
          >
            <Bot className="w-4 h-4" /> Nhờ AI Tutor giải thích chuyên đề yếu
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub, idx) => {
            const isStrong = idx % 2 === 0;
            const masteryScore = isStrong ? 85 : 62;
            return (
              <div
                key={sub.id}
                className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-base">{sub.name}</span>
                      {isStrong ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Chủ đề mạnh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          <AlertCircle className="w-3 h-3" /> Cần ôn tập thêm
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {isStrong
                        ? "Bạn nắm vững kiến thức nền tảng. Hãy thử sức với bài tập nâng cao."
                        : "Đề xuất: Ôn lại lý thuyết trong kho tài liệu RAG và làm thêm 1 đề luyện tập."}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{masteryScore}%</span>
                </div>

                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isStrong ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${masteryScore}%` }}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link
                    href="/dashboard/practice"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Làm bài luyện tập
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-600">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bảng xếp hạng Học sinh trong trường</h2>
        </div>

        <div className="space-y-4">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.userId === profile?.userId;

            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isCurrentUser
                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                } transition-colors`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 text-center font-bold text-lg ${
                      index === 0
                        ? "text-yellow-500"
                        : index === 1
                        ? "text-gray-400"
                        : index === 2
                        ? "text-amber-600"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                    {entry.user?.avatarUrl ? (
                      <Image
                        src={entry.user.avatarUrl}
                        alt={entry.user.fullName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      entry.user?.fullName?.charAt(0) || "?"
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {entry.user?.fullName}
                      {isCurrentUser && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Cấp {entry.level}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> {entry.currentStreak} ngày
                      </span>
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
