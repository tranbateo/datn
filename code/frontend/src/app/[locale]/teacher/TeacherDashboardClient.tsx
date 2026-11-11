"use client";

import { Users, Library, FileQuestion, TrendingUp, AlertCircle, BookOpen, GraduationCap, School } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";

interface HomeroomClassItem {
  id: string;
  name: string;
  grade: number;
  studentsCount: number;
}

interface SubjectClassItem {
  id: string;
  classId: string;
  className: string;
  grade: number;
  subjectId: string;
  subjectName: string;
  studentsCount: number;
}

interface DashboardData {
  teacherProfile?: {
    fullName: string;
    studentCode: string;
    email: string;
    primarySubjects: string[];
  };
  totalStudents: number;
  totalCourses: number;
  totalQuizzes: number;
  averageScore: number;
  homeroomClasses?: HomeroomClassItem[];
  subjectClasses?: SubjectClassItem[];
  performanceData: { name: string; score: number }[];
  needsAttention: { name: string; issues: string }[];
}

export default function TeacherDashboardClient({ data }: { data: DashboardData }) {
  const t = useTranslations("Teacher.Dashboard");

  const {
    teacherProfile,
    totalStudents,
    totalCourses,
    totalQuizzes,
    averageScore,
    homeroomClasses = [],
    subjectClasses = [],
    performanceData,
    needsAttention,
  } = data;

  // Group subjectClasses by subjectName -> grade -> classNames[]
  const classesByGrade = new Map<number, { className: string; subjectName: string; studentsCount: number }[]>();
  subjectClasses.forEach((sc) => {
    const list = classesByGrade.get(sc.grade) || [];
    list.push({
      className: sc.className,
      subjectName: sc.subjectName,
      studentsCount: sc.studentsCount,
    });
    classesByGrade.set(sc.grade, list);
  });
  const sortedGrades = Array.from(classesByGrade.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            {t("title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        {teacherProfile && (
          <div className="flex items-center gap-3 bg-white dark:bg-card-bg px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center">
              {teacherProfile.fullName?.charAt(0) || "G"}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {teacherProfile.fullName}
                {teacherProfile.studentCode && (
                  <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {teacherProfile.studentCode}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Chuyên môn:{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {teacherProfile.primarySubjects?.length
                    ? teacherProfile.primarySubjects.join(", ")
                    : "Giáo viên bộ môn"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Teaching Assignment Summary Card (GVCN & GVBM by Grade/Class) */}
      {(homeroomClasses.length > 0 || subjectClasses.length > 0) && (
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Phân công Giảng dạy Chính khóa (Năm học 2025 - 2026)
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {teacherProfile?.primarySubjects?.map((subj) => (
                <span
                  key={subj}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Tổ bộ môn: {subj}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Homeroom Assignment (GVCN) */}
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2">
                <GraduationCap className="w-4 h-4" />
                Lớp Chủ nhiệm (GVCN)
              </div>
              {homeroomClasses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {homeroomClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 shadow-xs"
                    >
                      <span className="font-bold text-sm text-purple-900 dark:text-purple-200">
                        {cls.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        (Khối {cls.grade} • {cls.studentsCount} HS)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Không kiêm nhiệm công tác chủ nhiệm lớp.
                </p>
              )}
            </div>

            {/* Subject Classes Assignment (GVBM grouped by Grade) */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  <BookOpen className="w-4 h-4" />
                  Các lớp giảng dạy bộ môn (GVBM — {subjectClasses.length} lớp)
                </div>
              </div>
              {sortedGrades.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sortedGrades.map((grade) => {
                    const items = classesByGrade.get(grade) || [];
                    return (
                      <div
                        key={grade}
                        className="px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">
                          Khối {grade}:
                        </span>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {items.map((item) => (
                            <span
                              key={`${grade}-${item.className}`}
                              className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-xs font-bold"
                              title={`Môn ${item.subjectName} - ${item.className}`}
                            >
                              {item.className}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chưa có lớp giảng dạy bộ môn được phân công.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t("totalStudents")}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{totalStudents}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Library className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t("totalCourses")}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{totalCourses}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t("totalQuizzes")}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{totalQuizzes}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t("averageScore")}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{averageScore}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("performanceChart")}
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                  className="dark:stroke-gray-800"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("needsAttention")}
            </h3>
          </div>
          <div className="space-y-4">
            {needsAttention && needsAttention.length > 0 ? (
              needsAttention.map((student: { name: string; issues: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {student.name}
                    </h4>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{student.issues}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Chưa có học sinh nào cần chú ý.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
