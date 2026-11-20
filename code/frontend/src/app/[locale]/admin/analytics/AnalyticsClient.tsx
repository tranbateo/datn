"use client";

import { useState } from "react";
import {
  HardDrive,
  TrendingUp,
  MessageSquare,
  Award,
  Loader2,
  BookOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";
import { fetchApi } from "@/lib/api-client";

interface AnalyticsData {
  range?: "24h" | "7d" | "30d";
  storage?: {
    usedMb: number;
    maxMb: number;
    percentage: number;
    totalDocuments: number;
    embeddedDocuments: number;
  };
  engagement?: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    activeStudents: number;
    totalStudents: number;
    studentAiQuestions: number;
  };
  dailyTrend?: Array<{
    label: string;
    attempts: number;
    aiQuestions: number;
  }>;
  heatmap?: Array<{
    day: string;
    slots: Array<{ count: number; intensity: number }>;
  }>;
  subjectPerformance?: Array<{
    subjectName: string;
    attemptsCount: number;
    averageScore: number;
    uniqueStudents: number;
    documentsCount: number;
  }>;
  totals?: {
    users: number;
    quizzes: number;
    attempts: number;
  };
}

export default function AnalyticsClient({
  data: initialData,
}: {
  data: AnalyticsData;
}) {
  const t = useTranslations("Admin.Analytics");
  const [data, setData] = useState<AnalyticsData>(initialData || {});
  const [range, setRange] = useState<"24h" | "7d" | "30d">(
    initialData?.range || "7d",
  );
  const [loadingRange, setLoadingRange] = useState(false);

  const handleSelectRange = async (nextRange: "24h" | "7d" | "30d") => {
    if (nextRange === range) return;
    setRange(nextRange);
    setLoadingRange(true);
    try {
      const updated = await fetchApi<AnalyticsData>(
        `/admin/analytics/stats?range=${nextRange}`,
      );
      if (updated) setData(updated);
    } catch (error) {
      console.error("Failed to reload analytics:", error);
    } finally {
      setLoadingRange(false);
    }
  };

  const storage = data.storage || {
    usedMb: 0,
    maxMb: 500,
    percentage: 0,
    totalDocuments: 0,
    embeddedDocuments: 0,
  };
  const engagement = data.engagement || {
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    activeStudents: 0,
    totalStudents: 0,
    studentAiQuestions: 0,
  };
  const dailyTrend = data.dailyTrend || [];
  const heatmap = data.heatmap || [];
  const subjectPerformance = data.subjectPerformance || [];

  const assessedSubjects = subjectPerformance.filter(
    (s) => s.attemptsCount > 0 || s.documentsCount > 0,
  );
  const chartSubjects = (
    assessedSubjects.length > 0 ? assessedSubjects : subjectPerformance
  ).slice(0, 10);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            {t("title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t("subtitle")} — Tổng hợp 100% từ dữ liệu học tập và kho RAG thực
            tế của nhà trường.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadingRange && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          )}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(["24h", "7d", "30d"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectRange(opt)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  range === opt
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {opt === "24h" ? "24 giờ" : opt === "7d" ? "7 ngày" : "30 ngày"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* RAG Storage */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-blue-600" /> Kho tài liệu RAG
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {storage.embeddedDocuments}/{storage.totalDocuments} Ready
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {storage.usedMb}
              </span>
              <span className="text-xs font-medium text-gray-500">
                / {storage.maxMb} MB
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  storage.percentage >= 85
                    ? "bg-rose-500"
                    : storage.percentage >= 60
                      ? "bg-amber-500"
                      : "bg-blue-600"
                }`}
                style={{ width: `${Math.max(2, storage.percentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Đã dùng {storage.percentage}% dung lượng lưu trữ trường
            </p>
          </div>
        </div>

        {/* Quiz Attempts & Pass Rate */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Award className="w-4 h-4" /> Kết quả kiểm tra
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Đạt {engagement.passRate}%
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {engagement.totalAttempts}
              </span>
              <span className="text-xs text-gray-500">lượt nộp bài</span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Điểm TB:{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {engagement.totalAttempts > 0
                  ? `${engagement.averageScore}/100`
                  : "Chưa có"}
              </span>
            </p>
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" /> Học sinh hoạt động
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {engagement.activeStudents}
              </span>
              <span className="text-xs text-gray-500">
                / {engagement.totalStudents} học sinh
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Tỷ lệ tham gia:{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {engagement.totalStudents > 0
                  ? Math.round(
                      (engagement.activeStudents / engagement.totalStudents) *
                        100,
                    )
                  : 0}
                %
              </span>
            </p>
          </div>
        </div>

        {/* AI Tutor Questions */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" /> Hỏi đáp Gia sư AI
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {engagement.studentAiQuestions}
              </span>
              <span className="text-xs text-gray-500">câu hỏi</span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Tổng đề thi trong trường: {data.totals?.quizzes ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Trend Chart */}
      <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Xu hướng Làm bài & Hỏi đáp Gia sư AI
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Số lượt nộp bài kiểm tra và câu hỏi gửi Gia sư AI theo{" "}
            {range === "24h" ? "từng giờ" : "từng ngày"}
          </p>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend />
              <Bar
                dataKey="attempts"
                name="Lượt làm Quiz"
                fill="#4F46E5"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="aiQuestions"
                name="Câu hỏi Gia sư AI"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Activity Heatmap */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("userActivity")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Phân bổ lượt làm bài & chat AI theo Thứ và khung giờ (di chuột để
              xem số lượt thật)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-separate border-spacing-1.5">
              <thead>
                <tr className="text-xs text-gray-500 font-medium">
                  <th className="font-normal pb-1 text-left w-10"></th>
                  <th className="font-normal pb-1">0–4h</th>
                  <th className="font-normal pb-1">4–8h</th>
                  <th className="font-normal pb-1">8–12h</th>
                  <th className="font-normal pb-1">12–16h</th>
                  <th className="font-normal pb-1">16–20h</th>
                  <th className="font-normal pb-1">20–24h</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-500 font-medium">
                {heatmap.map((row) => (
                  <tr key={row.day}>
                    <td className="text-left py-1 font-semibold text-gray-600 dark:text-gray-300">
                      {row.day}
                    </td>
                    {row.slots.map((slot, colIdx) => (
                      <td key={colIdx}>
                        <div
                          className="h-8 rounded-md flex items-center justify-center text-[11px] font-bold transition-all"
                          style={{
                            backgroundColor:
                              slot.count > 0
                                ? `rgba(79, 70, 229, ${slot.intensity})`
                                : "rgba(148, 163, 184, 0.12)",
                            color: slot.intensity >= 0.5 ? "#fff" : "#64748b",
                          }}
                          title={`${row.day} (${colIdx * 4}h–${(colIdx + 1) * 4}h): ${slot.count} hoạt động`}
                        >
                          {slot.count > 0 ? slot.count : ""}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real Subject Performance */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {t("subjectEngagement")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Điểm trung bình, số lượt thi và số tài liệu RAG theo từng môn học
            </p>
          </div>
          {chartSubjects.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {chartSubjects.map((sub) => (
                <div
                  key={sub.subjectName}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {sub.subjectName}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {sub.attemptsCount > 0
                        ? `TB: ${sub.averageScore}/100`
                        : "Chưa có bài thi"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.averageScore >= 80
                          ? "bg-emerald-500"
                          : sub.averageScore >= 60
                            ? "bg-amber-500"
                            : sub.attemptsCount > 0
                              ? "bg-rose-500"
                              : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      style={{ width: `${sub.averageScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {sub.attemptsCount} lượt thi • {sub.uniqueStudents} HS
                      tham gia
                    </span>
                    <span>{sub.documentsCount} tài liệu RAG</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
              Chưa có dữ liệu môn học.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
