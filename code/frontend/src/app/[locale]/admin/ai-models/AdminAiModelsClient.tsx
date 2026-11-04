"use client";

import { useState, useEffect, useMemo } from "react";
import { Cpu, Settings, Key, Activity, MessageSquare, Coins } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { fetchApi } from "@/lib/api-client";

export default function AdminAiModelsClient({ initialData }: { initialData: any[] }) {
  const t = useTranslations("Admin.AIModels");
  const usages = useMemo(() => (Array.isArray(initialData) ? initialData : []), [initialData]);
  const [license, setLicense] = useState<any>(null);
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    fetchApi("/schools/license/me")
      .then((res: any) => setLicense(res))
      .catch(() => {});
  }, []);

  const totalTokens = useMemo(
    () => usages.reduce((sum, item) => sum + Number(item.tokensUsed || 0), 0),
    [usages]
  );
  const totalMessages = useMemo(
    () => usages.reduce((sum, item) => sum + Number(item.messageCount || 0), 0),
    [usages]
  );
  const totalEstimatedCost = useMemo(
    () => usages.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0),
    [usages]
  );

  const chartData = useMemo(() => {
    const grouped: Record<string, { time: string; tokens: number; messages: number }> = {};
    usages.forEach((u) => {
      const dateKey = new Date(u.date).toLocaleDateString("vi-VN");
      if (!grouped[dateKey]) {
        grouped[dateKey] = { time: dateKey, tokens: 0, messages: 0 };
      }
      grouped[dateKey].tokens += Number(u.tokensUsed || 0);
      grouped[dateKey].messages += Number(u.messageCount || 0);
    });
    return Object.values(grouped).reverse();
  }, [usages]);

  const filteredUsages = useMemo(() => {
    if (!searchUser.trim()) return usages;
    const q = searchUser.toLowerCase();
    return usages.filter(
      (u) =>
        u.user?.fullName?.toLowerCase().includes(q) ||
        u.user?.email?.toLowerCase().includes(q) ||
        u.user?.studentCode?.toLowerCase().includes(q)
    );
  }, [usages, searchUser]);

  const quotaLimit = license?.aiQuotaLimit || 100000;
  const quotaUsed = license?.aiQuotaUsed || totalTokens;
  const quotaPercent = Math.min(100, Math.round((quotaUsed / Math.max(1, quotaLimit)) * 100));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t("title")}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border border-emerald-100 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t("allSystemsOperational")}
          </div>
          <Link
            href="/admin/settings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" /> Cấu hình BYOK
          </Link>
        </div>
      </div>

      {/* Real Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {license?.aiProvider || "GEMINI"} (RAG Engine)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {license?.hasCustomApiKey ? "Sử dụng khóa BYOK của trường" : "Sử dụng hạn mức gói trường học"}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Tổng Tokens đã dùng
              </p>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Gói bản quyền
              </p>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {license?.licensePlan || "STANDARD"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Lượt tương tác AI Tutor</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hỏi đáp RAG & Chấm bài tự luận</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Tổng số tin nhắn
              </p>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalMessages.toLocaleString()}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Số bản ghi phiên
              </p>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{usages.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Coins className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Hạn mức & Chi phí AI</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Giám sát ngân sách trường học</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Chi phí ước tính
              </p>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalEstimatedCost.toFixed(4)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Hạn mức đã dùng
              </p>
              <span className="text-2xl font-bold text-emerald-600">{quotaPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Chart */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lưu lượng Tokens theo ngày</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tổng hợp từ dữ liệu sử dụng AI thực tế của học sinh và giáo viên trong trường
              </p>
            </div>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            {chartData.length === 0 ? (
              "Chưa có dữ liệu tiêu thụ Token"
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card-bg, #fff)",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    name="Tokens"
                    stroke="#2563EB"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* School AI Quota & BYOK Info */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" /> Trạng thái Quota & BYOK
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-1.5">
                  <span>Hạn mức AI trường học</span>
                  <span>
                    {quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-4 border border-gray-100 dark:border-card-border rounded-xl">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Chế độ khóa API (BYOK)</div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-500" />
                  {license?.hasCustomApiKey ? "Đã kích hoạt khóa API riêng" : "Đang dùng khóa mặc định của hệ thống"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Nhà trường có thể nhập Gemini/OpenAI API Key riêng tại mục Cài đặt để không giới hạn lượt hỏi đáp.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/settings"
            className="mt-6 w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-semibold rounded-xl text-center transition-colors"
          >
            Quản lý Khóa API & Hạn mức
          </Link>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-card-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("logsTitle")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("logsSubtitle")}</p>
          </div>
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Tìm theo tên học sinh / giáo viên..."
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white w-full sm:w-72"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/20 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-card-border">
                <th className="px-6 py-4">Ngày (Date)</th>
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4">Nhà cung cấp AI</th>
                <th className="px-6 py-4">Số tin nhắn</th>
                <th className="px-6 py-4">Tokens đã dùng</th>
                <th className="px-6 py-4">Ước tính phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-card-border">
              {filteredUsages.length > 0 ? (
                filteredUsages.map((usage: any) => (
                  <tr key={usage.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {new Date(usage.date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="font-semibold text-gray-900 dark:text-white">{usage.user?.fullName}</div>
                      <div className="text-xs text-gray-400">{usage.user?.studentCode || usage.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        {license?.aiProvider || "Gemini RAG"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-semibold">
                      {usage.messageCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                      {Number(usage.tokensUsed || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      ${Number(usage.estimatedCost || 0).toFixed(4)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    {t("emptyLogs")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
