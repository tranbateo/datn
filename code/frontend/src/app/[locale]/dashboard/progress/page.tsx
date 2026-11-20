"use client";

import { useState, useEffect } from "react";
import {
  gamificationService,
  GamificationProfile,
  LearningAnalyticsResponse,
  LeaderboardEntry,
  MasteryStatus,
} from "@/services/gamification.service";
import { formatClassLabel } from "@/services/users.service";
import {
  Loader2,
  Flame,
  Star,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Bot,
  Edit3,
  BookOpen,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardCheck,
  Clock,
  Sparkles,
  Award,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

const STATUS_BADGE_MAP: Record<
  MasteryStatus,
  { label: string; badgeClass: string; barClass: string }
> = {
  strong: {
    label: "Vững kiến thức",
    badgeClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    barClass: "bg-emerald-500",
  },
  developing: {
    label: "Đang tiến bộ",
    badgeClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    barClass: "bg-blue-500",
  },
  weak: {
    label: "Cần củng cố",
    badgeClass:
      "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    barClass: "bg-rose-500",
  },
  unassessed: {
    label: "Chưa đánh giá",
    badgeClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    barClass: "bg-slate-300 dark:bg-slate-700",
  },
};

export default function ProgressPage() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [analytics, setAnalytics] = useState<LearningAnalyticsResponse | null>(
    null,
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardScope, setLeaderboardScope] = useState<"grade" | "school">(
    "grade",
  );
  const [showXpGuide, setShowXpGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      gamificationService.getProfile(),
      gamificationService.getLearningAnalytics(),
    ])
      .then(async ([p, a]) => {
        setProfile(p);
        setAnalytics(a);
        const lb = await gamificationService
          .getLeaderboard(10, a?.grade)
          .catch(() => []);
        setLeaderboard(lb);
      })
      .catch((err) => {
        console.error("Failed to load student progress:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSwitchLeaderboardScope = async (scope: "grade" | "school") => {
    if (scope === leaderboardScope) return;
    setLeaderboardScope(scope);
    setLeaderboardLoading(true);
    try {
      const data = await gamificationService.getLeaderboard(
        10,
        scope === "grade" ? analytics?.grade : undefined,
      );
      setLeaderboard(data);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const grade = analytics?.grade ?? 6;
  const className = analytics?.className ?? null;
  const level = profile?.level || 1;
  const currentXp = profile?.currentXp || 0;
  const currentLevelMinXp =
    profile?.currentLevelMinXp ?? Math.pow(level - 1, 2) * 100;
  const nextLevelXp = profile?.nextLevelXp ?? Math.pow(level, 2) * 100;
  const xpInLevel =
    profile?.xpInCurrentLevel ?? Math.max(0, currentXp - currentLevelMinXp);
  const xpSpan =
    profile?.xpRequiredForNextLevel ??
    Math.max(100, nextLevelXp - currentLevelMinXp);
  const xpRemaining =
    profile?.xpRemainingToNextLevel ?? Math.max(0, nextLevelXp - currentXp);
  const progressPercent =
    profile?.levelProgressPercent ??
    Math.min(100, Math.round((xpInLevel / xpSpan) * 100));

  const buildAiTutorHref = (
    subjectId?: string | null,
    subjectName?: string | null,
    subGrade?: number | null,
  ) => {
    if (!subjectId || !subjectName) return "/dashboard/ai-tutor";
    const qs = new URLSearchParams({
      subjectId,
      subjectName,
      grade: String(subGrade || grade),
    });
    return `/dashboard/ai-tutor?${qs.toString()}`;
  };

  const weakest = analytics?.weakestSubject;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Tiến độ & Phân tích Năng lực Học tập
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Toàn bộ điểm số, cấp độ XP và mức độ nắm vững từng môn đều được tính
            trực tiếp từ bài làm và lịch sử học của bạn
            {className
              ? ` (${formatClassLabel(className)} • Khối ${grade})`
              : ` (Khối ${grade})`}
            .
          </p>
        </div>
        <Link
          href="/dashboard/practice"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs w-fit"
        >
          <Edit3 className="w-4 h-4" /> Làm bài luyện tập tích XP
        </Link>
      </div>

      {/* Top Row: Level Card + Streak Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Level & XP Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden md:col-span-2 flex flex-col justify-between gap-5">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex justify-between items-start gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-100 text-xs sm:text-sm font-medium mb-1">
                <span>Cấp độ học tập (Learning Level • Khối {grade})</span>
                <button
                  type="button"
                  onClick={() => setShowXpGuide((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-semibold text-white transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                  {showXpGuide ? "Ẩn cách tính" : "Cách tính điểm"}
                </button>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-2.5">
                <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                Cấp {level}
              </h2>
              <p className="text-xs text-indigo-100/90 mt-1">
                Tổng tích lũy: <strong className="text-white">{currentXp} XP</strong> •
                Còn thiếu <strong className="text-yellow-300">{xpRemaining} XP</strong> để lên Cấp {level + 1}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-2xl text-center shrink-0">
              <div className="text-[11px] text-indigo-100 uppercase tracking-wider font-bold mb-0.5">
                Hạng trường
              </div>
              <div className="text-2xl font-extrabold">#{profile?.rank || "-"}</div>
            </div>
          </div>

          {/* Transparent XP Formula Drawer */}
          {showXpGuide && (
            <div className="relative z-10 bg-black/20 backdrop-blur-xs border border-white/15 rounded-2xl p-4 text-xs sm:text-[13px] space-y-2">
              <div className="font-bold text-yellow-200 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Quy tắc tính điểm XP & thăng cấp
              </div>
              <ul className="space-y-1 text-indigo-50 list-disc pl-5">
                <li>
                  <strong>+10 XP</strong> cho mỗi câu trả lời đúng khi làm bài Luyện tập / Kiểm tra.
                </li>
                <li>
                  <strong>+2 XP</strong> cho mỗi lượt đặt câu hỏi học tập cùng Gia sư AI.
                </li>
                <li>
                  <strong>Đỗ bài thi vượt cấp (≥ 50%)</strong>: tăng trực tiếp <strong>+1 Cấp độ học tập</strong> (không tự đổi khối lớp chính thức).
                </li>
                <li>
                  <strong>Mốc XP lên cấp:</strong> Cấp 1 (0–99 XP) → Cấp 2 (100–399 XP) → Cấp 3 (400–899 XP) → Cấp 4 (900–1.599 XP) theo công thức{" "}
                  <code className="px-1.5 py-0.5 rounded bg-white/15 font-mono text-[11px]">
                    Cấp = ⌊√(XP / 100)⌋ + 1
                  </code>
                  .
                </li>
              </ul>
            </div>
          )}

          {/* Accurate In-Level Progress Bar */}
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-end text-xs sm:text-sm font-bold">
              <span>
                Tiến độ Cấp {level}: {xpInLevel} / {xpSpan} XP ({progressPercent}%)
              </span>
              <span className="text-indigo-200">
                Mốc Cấp {level + 1}: {nextLevelXp} XP
              </span>
            </div>
            <div className="w-full h-3.5 bg-black/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-orange-100 dark:border-orange-900/30 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-3">
            <Flame className="w-9 h-9 text-orange-500 fill-orange-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
            {profile?.streakDays || 0} ngày
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">
            Chuỗi học tập liên tiếp
          </p>
          <div className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3.5 py-1.5 rounded-full font-bold">
            Kỷ lục dài nhất: {profile?.longestStreak ?? profile?.streakDays ?? 0} ngày
          </div>
        </div>
      </div>

      {/* Real Learning Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <ClipboardCheck className="w-4 h-4 text-blue-600" /> Bài kiểm tra đã làm
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {analytics?.summary.totalAttempts ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Cập nhật theo thời gian thực
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Award className="w-4 h-4 text-indigo-600" /> Điểm trung bình
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {analytics?.summary.overallAverageScore !== null &&
            analytics?.summary.overallAverageScore !== undefined
              ? `${analytics.summary.overallAverageScore}%`
              : "Chưa có"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Tính trên toàn bộ bài đã nộp
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Môn vững / Cần ôn
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            <span className="text-emerald-600">
              {analytics?.summary.strongCount ?? 0}
            </span>
            <span className="text-slate-300 mx-1.5">/</span>
            <span className="text-rose-500">
              {analytics?.summary.weakCount ?? 0}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {analytics?.summary.unassessedCount ?? 0} môn chưa có bài làm
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-slate-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Sparkles className="w-4 h-4 text-purple-600" /> Phiên học cùng AI
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {analytics?.summary.totalAiSessions ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Tích lũy +2 XP mỗi câu hỏi
          </div>
        </div>
      </div>

      {/* Real Per-Subject Mastery Analysis & Personalized Recommendations */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Phân tích Năng lực từng Môn học (Khối {grade})
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Đánh giá hoàn toàn từ kết quả bài kiểm tra thực tế: ≥ 80% Vững kiến
              thức • 60–79% Đang tiến bộ • &lt; 60% Cần củng cố • 0 bài Chưa đánh
              giá.
            </p>
          </div>
          {weakest && (
            <Link
              href={buildAiTutorHref(
                weakest.subjectId,
                weakest.subjectName,
                weakest.grade,
              )}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors w-fit shrink-0 shadow-xs"
            >
              <Bot className="w-4 h-4" />
              {weakest.averageScore !== null
                ? `Hỏi AI ôn môn ${weakest.subjectName} (${weakest.averageScore}%)`
                : `Bắt đầu học môn ${weakest.subjectName} cùng AI`}
            </Link>
          )}
        </div>

        {!analytics || analytics.subjects.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Chưa có danh sách môn học cho Khối {grade}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.subjects.map((sub) => {
              const style = STATUS_BADGE_MAP[sub.masteryStatus];
              const scoreValue = sub.averageScore ?? 0;

              return (
                <div
                  key={sub.subjectId}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white text-base">
                            {sub.subjectName}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${style.badgeClass}`}
                          >
                            {sub.masteryStatus === "strong" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : sub.masteryStatus === "weak" ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : null}
                            {style.label}
                          </span>
                          {sub.trend === "up" && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                              <TrendingUp className="w-3.5 h-3.5" /> Tiến bộ
                            </span>
                          )}
                          {sub.trend === "down" && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-500">
                              <TrendingDown className="w-3.5 h-3.5" /> Giảm
                            </span>
                          )}
                          {sub.trend === "stable" && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400">
                              <Minus className="w-3 h-3" /> Ổn định
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {sub.averageScore !== null ? `${sub.averageScore}%` : "—"}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${style.barClass}`}
                        style={{
                          width: `${sub.averageScore !== null ? scoreValue : 0}%`,
                        }}
                      />
                    </div>

                    {/* Real numeric evidence */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Số bài đã làm:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {sub.attemptsCount}
                        </strong>
                      </span>
                      {sub.bestScore !== null && (
                        <span>
                          Cao nhất:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {sub.bestScore}%
                          </strong>
                        </span>
                      )}
                      {sub.totalQuestionsAnswered > 0 && (
                        <span>
                          Đúng:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {sub.totalCorrectAnswers}/{sub.totalQuestionsAnswered} câu
                          </strong>
                        </span>
                      )}
                      <span>
                        Học AI:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {sub.aiSessionsCount} phiên
                        </strong>
                      </span>
                    </div>

                    {/* Personalized recommendation */}
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {sub.recommendation}
                    </p>

                    {/* Specific recent mistakes if any */}
                    {sub.recentMistakes.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 space-y-1">
                        <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                          Câu làm sai gần đây cần ôn lại:
                        </div>
                        {sub.recentMistakes.map((m, idx) => (
                          <p
                            key={idx}
                            className="text-[11px] text-rose-700/90 dark:text-rose-200/90 leading-snug"
                          >
                            • {m}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct subject-linked action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200/70 dark:border-gray-700/70">
                    <div className="flex items-center gap-3">
                      {sub.courseId && (
                        <Link
                          href={`/dashboard/courses/${sub.courseId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Bài giảng
                        </Link>
                      )}
                      <Link
                        href="/dashboard/practice"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Luyện tập
                      </Link>
                    </div>
                    <Link
                      href={buildAiTutorHref(
                        sub.subjectId,
                        sub.subjectName,
                        sub.grade,
                      )}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5" /> Hỏi AI môn này
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Quiz Attempts History (Evidence Trail) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Lịch sử bài làm gần đây
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nguồn dữ liệu thực tế dùng để chấm điểm năng lực và cộng XP cho bạn
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/practice"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Xem kho đề luyện tập →
          </Link>
        </div>

        {!analytics || analytics.recentAttempts.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-dashed border-slate-200 dark:border-gray-700 space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Bạn chưa hoàn thành bài luyện tập nào.
            </p>
            <p className="text-xs text-slate-400">
              Hãy làm bài kiểm tra đầu tiên để nhận XP và mở phân tích năng lực cá nhân hóa!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {analytics.recentAttempts.map((att) => (
              <div
                key={att.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {att.quizTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300">
                      {att.subjectName}
                    </span>
                    {att.isGraduation && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Vượt cấp
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {att.totalQuestions} câu hỏi •{" "}
                    {new Date(att.completedAt).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-xl text-sm font-extrabold shrink-0 ${
                    att.score >= 80
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : att.score >= 60
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                  }`}
                >
                  {att.score}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard with Grade / School Filter */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Bảng xếp hạng Thi đua XP
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Xếp hạng theo tổng điểm XP tích lũy thực tế
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-gray-800 p-1 text-xs font-bold w-fit">
            <button
              type="button"
              onClick={() => handleSwitchLeaderboardScope("grade")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                leaderboardScope === "grade"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Khối {grade}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLeaderboardScope("school")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                leaderboardScope === "school"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Toàn trường
            </button>
          </div>
        </div>

        {leaderboardLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Chưa có dữ liệu bảng xếp hạng.
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.userId === profile?.userId;
              const displayXp = entry.xp ?? entry.lifetimeXp ?? 0;

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    isCurrentUser
                      ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50"
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  } transition-colors`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-8 text-center font-bold text-lg shrink-0 ${
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                      {entry.user?.avatarUrl ? (
                        <Image
                          src={entry.user.avatarUrl}
                          alt={entry.user.fullName}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        entry.user?.fullName?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span className="truncate">{entry.user?.fullName}</span>
                        {entry.user?.className && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300">
                            {formatClassLabel(entry.user.className)}
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{" "}
                          Cấp {entry.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />{" "}
                          {entry.currentStreak} ngày
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0">
                    {displayXp}{" "}
                    <span className="text-xs text-gray-400 font-normal">XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
