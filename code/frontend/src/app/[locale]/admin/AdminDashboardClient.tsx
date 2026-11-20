"use client";

import {
  Users,
  GraduationCap,
  BookOpen,
  Cpu,
  TrendingUp,
  School,
  UserCheck,
  KeyRound,
  MessageSquareWarning,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DashboardStats, ActivityItem } from "@/types";

export default function AdminDashboardClient({
  data,
}: {
  data: DashboardStats;
}) {
  const t = useTranslations("Admin.Dashboard");

  const {
    schoolName,
    totalStudents,
    activeTeachers,
    totalParents = 0,
    totalClasses = 0,
    totalLessons,
    totalAttempts = 0,
    monthlyCost,
    aiQuota,
    pendingActions,
    dailyActiveData,
    recentActivity,
    completionRate,
  } = data;

  const pieData = [
    { name: t("completed"), value: completionRate, color: "#10B981" },
    {
      name: t("inProgress"),
      value: Math.max(0, 100 - completionRate),
      color: "#6366F1",
    },
  ];

  const pwdTotal = pendingActions?.passwordResets?.total || 0;
  const feedbackTotal = pendingActions?.pendingFeedback || 0;
  const noHomeroomTotal = pendingActions?.classesWithoutHomeroom || 0;
  const hasUrgentActions = pwdTotal > 0 || feedbackTotal > 0 || noHomeroomTotal > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            {t("overview")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {schoolName ? `${schoolName} — ` : ""}
            {t("welcome")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/analytics"
            className="bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-200 font-semibold transition-colors"
          >
            Xem Phân tích chi tiết →
          </Link>
        </div>
      </div>

      {/* Action Center: Urgent Items Needing Admin Attention */}
      {hasUrgentActions && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Mục cần Quản trị viên xử lý ngay
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pwdTotal > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {pwdTotal} yêu cầu quên mật khẩu
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      HS: {pendingActions?.passwordResets.student || 0} • GV:{" "}
                      {pendingActions?.passwordResets.teacher || 0} • PH:{" "}
                      {pendingActions?.passwordResets.parent || 0}
                    </p>
                  </div>
                </div>
                <Link
                  href={
                    (pendingActions?.passwordResets.teacher || 0) > 0
                      ? "/admin/teachers"
                      : (pendingActions?.passwordResets.parent || 0) > 0
                        ? "/admin/parents"
                        : "/admin/students"
                  }
                  className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  Xử lý <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {feedbackTotal > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <MessageSquareWarning className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {feedbackTotal} phản hồi / báo lỗi chờ duyệt
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Từ học sinh, giáo viên và phụ huynh
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/feedback"
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  Kiểm duyệt <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {noHomeroomTotal > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {noHomeroomTotal} lớp chưa có GVCN
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Cần phân công giáo viên chủ nhiệm
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/classes"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  Phân công <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Link
          href="/admin/students"
          className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
            {t("totalStudents")}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalStudents}
          </h3>
        </Link>

        <Link
          href="/admin/teachers"
          className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
            {t("activeTeachers")}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {activeTeachers}
          </h3>
        </Link>

        <Link
          href="/admin/parents"
          className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
            Phụ huynh
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalParents}
          </h3>
        </Link>

        <Link
          href="/admin/classes"
          className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm hover:border-cyan-200 dark:hover:border-cyan-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center mb-3">
            <School className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
            Lớp chính khóa
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalClasses}
          </h3>
        </Link>

        <Link
          href="/admin/courses"
          className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
            {t("totalLessons")}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalLessons}
          </h3>
        </Link>

        <Link
          href="/admin/ai-models"
          className="bg-orange-50/50 dark:bg-card-bg rounded-2xl p-5 border border-orange-100 dark:border-card-border shadow-sm hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800">
              {aiQuota?.percentage ?? 0}% Quota
            </span>
          </div>
          <p className="text-xs text-orange-900/70 dark:text-gray-400 font-semibold uppercase tracking-wider">
            {aiQuota?.isSelfHosted ? "AI Nội bộ" : t("monthlyCost")}
          </p>
          <h3 className="text-2xl font-bold text-orange-950 dark:text-white mt-1">
            {aiQuota?.isSelfHosted ? "$0" : `$${monthlyCost.toFixed(2)}`}
          </h3>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                {t("dailyActive")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("engagementTrend")} (7 ngày gần nhất)
              </p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActiveData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg, #fff)",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                  itemStyle={{ color: "#4F46E5", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Học sinh hoạt động"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("recentActivity")}
            </h3>
            <Link
              href="/admin/audit-logs"
              className="text-sm text-blue-600 hover:underline font-semibold"
            >
              {t("viewAll")}
            </Link>
          </div>

          <div className="space-y-5">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((act: ActivityItem) => (
                <div key={act.id} className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      act.type === "user"
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "bg-purple-50 dark:bg-purple-900/30"
                    }`}
                  >
                    {act.type === "user" ? (
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {act.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {act.description}
                    </p>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {new Date(act.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Chưa có hoạt động nào.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Quota & Active Provider */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("tokenUsage")} & Động cơ AI
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Nhà cung cấp đang hoạt động:{" "}
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {aiQuota?.provider || "Đang cấu hình"}
                </span>
              </p>
            </div>
            <Link
              href="/admin/ai-models"
              className="text-xs font-bold text-blue-600 hover:underline shrink-0"
            >
              Chi tiết →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                Token đã tiêu thụ
              </span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {(aiQuota?.used || 0).toLocaleString()} /{" "}
                {(aiQuota?.limit || 10_000_000).toLocaleString()} (
                {aiQuota?.percentage ?? 0}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  (aiQuota?.percentage ?? 0) >= 85
                    ? "bg-rose-500"
                    : (aiQuota?.percentage ?? 0) >= 60
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(2, aiQuota?.percentage ?? 0)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {aiQuota?.isSelfHosted
                ? "Hệ thống đang chạy mô hình nội bộ (Self-hosted Ollama) nên không phát sinh phí API đám mây."
                : "Hệ thống đang chạy qua API đám mây và ghi nhận chi phí theo từng phiên hỏi đáp."}
            </p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="max-w-[230px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t("completionRate")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Dựa trên {totalAttempts} lượt làm bài kiểm tra toàn trường (Đạt ≥
              50 điểm)
            </p>

            <div className="space-y-3">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[190px] h-[190px] relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {completionRate}%
              </span>
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Tỷ lệ đạt
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
