"use client";

import { APP_ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/routing";
import {
  BookOpen,
  Clock,
  ChevronRight,
  Loader2,
  School,
  Bot,
  Edit3,
  Trophy,
  Flame,
  GraduationCap,
  Calendar,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { gamificationService, GamificationProfile } from "@/services/gamification.service";
import { usersService, UserProfile, formatClassLabel } from "@/services/users.service";
import { curriculumService, Subject } from "@/services/curriculum.service";
import { calendarService, CalendarEvent } from "@/services/calendar.service";

export default function StudentDashboard() {
  const t = useTranslations("User.Dashboard");

  const [profile, setProfile] = useState<
    | (UserProfile & {
        studentCode?: string;
        school?: { name: string };
        classEnrollments?: Array<{
          class?: { name: string; homeroomTeacher?: { fullName: string } };
        }>;
      })
    | null
  >(null);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersService.getProfile(),
      gamificationService.getProfile(),
      calendarService.getEvents().catch(() => []),
    ])
      .then(([user, gamif, eventsData]) => {
        setProfile(user as any);
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
      })
      .then((subs) => {
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeClass = profile?.classEnrollments?.[0]?.class;
  const currentXp = gamification?.currentXp || 0;
  const nextLevelXp = gamification?.nextLevelXp || 1000;
  const xpPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-10">
      {/* --- HERO GREETING & SCHOOL CLASS BANNER --- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white p-6 sm:p-8 shadow-lg shadow-blue-600/15">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {profile?.school?.name && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                  <School className="w-3.5 h-3.5" /> {profile.school.name}
                </span>
              )}
              {activeClass?.name && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-400/20 backdrop-blur-md text-emerald-100 px-3 py-1 rounded-full border border-emerald-300/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {formatClassLabel(activeClass.name)}
                </span>
              )}
              {profile?.studentCode && (
                <span className="inline-flex items-center font-mono text-xs font-semibold bg-slate-900/30 text-blue-100 px-3 py-1 rounded-full border border-white/15">
                  Mã HS: {profile.studentCode}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Chào mừng trở lại, {profile?.fullName || "Học sinh"}!
            </h1>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              {activeClass?.homeroomTeacher?.fullName
                ? `Giáo viên chủ nhiệm: ${activeClass.homeroomTeacher.fullName} • Hãy chọn môn học bên dưới để ôn tập hoặc đặt câu hỏi cho Gia sư AI.`
                : "Hãy chọn môn học bên dưới để làm bài kiểm tra trắc nghiệm hoặc hỏi đáp trực tiếp cùng Gia sư AI có trích dẫn tài liệu của trường."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/ai-tutor"
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Bot className="w-4 h-4" /> Hỏi Gia sư AI
            </Link>
            <Link
              href="/dashboard/practice"
              className="px-5 py-3 bg-blue-900/40 hover:bg-blue-900/60 text-white border border-white/25 rounded-xl text-sm font-bold flex items-center gap-2 transition-all backdrop-blur-sm"
            >
              <Edit3 className="w-4 h-4" /> Làm bài tập
            </Link>
          </div>
        </div>
      </div>

      {/* --- 3-COLUMN KPI STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Level & XP Card */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-card-border flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tiến trình tích lũy
              </p>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Cấp độ học tập {gamification?.level || 1}
              </h2>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 text-xs font-bold">
              <span className="text-blue-600 dark:text-blue-400">{currentXp} XP hiện tại</span>
              <span className="text-slate-400 dark:text-slate-500">Mục tiêu: {nextLevelXp} XP ({xpPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-card-border flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Thói quen học tập
              </p>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Chuỗi {gamification?.streakDays || 0} ngày liên tiếp
              </h2>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Hoàn thành ít nhất 1 bài luyện tập hoặc phiên hỏi đáp AI mỗi ngày để giữ vững chuỗi học tập của bạn.
          </p>
        </div>

        {/* Class & Curriculum Info Card */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-card-border flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Đơn vị học tập
              </p>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {formatClassLabel(activeClass?.name, profile?.grade || 9)}
              </h2>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {activeClass?.homeroomTeacher?.fullName
                ? `GVCN: ${activeClass.homeroomTeacher.fullName}`
                : `Chương trình chuẩn Khối ${profile?.grade || 9}`}
            </span>
            <Link
              href="/dashboard/progress"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Xem tiến độ <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* --- CURRICULUM SUBJECTS --- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Môn học chính khóa (Khối {profile?.grade || 9})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Chọn môn học để làm đề kiểm tra hoặc tra cứu kiến thức cùng AI Tutor
            </p>
          </div>
          <Link
            href="/dashboard/practice"
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            Tất cả bài kiểm tra <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white dark:bg-card-bg rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Chưa có môn học nào được cấu hình cho khối lớp hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-card-bg rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-card-border hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-base group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {sub.name.charAt(0)}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Khối {sub.grade || profile?.grade || 9}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{sub.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ôn tập lý thuyết & bài tập tự luyện
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <Link
                    href="/dashboard/practice"
                    className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/70 dark:hover:bg-blue-950/50 text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Luyện tập
                  </Link>
                  <Link
                    href="/dashboard/ai-tutor"
                    className="px-3 py-2 rounded-lg bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Hỏi AI
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- UP NEXT SCHEDULE --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t("upNext")}</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Các buổi học, hạn nộp bài tập và lịch kiểm tra sắp diễn ra
            </p>
          </div>
          <Link
            href={APP_ROUTES.SCHEDULE}
            className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
          >
            {t("viewAll")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 px-4 bg-white dark:bg-card-bg rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Chưa có lịch học hoặc sự kiện nào sắp tới
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Bạn có thể tự tạo lịch ôn tập cá nhân hoặc xem thời khóa biểu của lớp.
            </p>
            <Link
              href={APP_ROUTES.SCHEDULE}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" /> Mở thời khóa biểu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-white dark:bg-card-bg rounded-2xl p-4 border border-slate-200/80 dark:border-card-border flex items-center justify-between shadow-sm hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{ev.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {new Date(ev.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <BookOpen className="w-3 h-3" /> {ev.type}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={APP_ROUTES.SCHEDULE}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors shrink-0"
                >
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
