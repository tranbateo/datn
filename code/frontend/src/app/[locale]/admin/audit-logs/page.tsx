"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, Clock, User } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<any[]>("/admin/audit-logs");
      setLogs(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const text = `${log.action || ""} ${log.entityType || ""} ${log.user?.fullName || ""} ${log.user?.email || ""} ${JSON.stringify(log.details || {})}`.toLowerCase();
    const matchesSearch = !searchQuery.trim() || text.includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-600" /> Nhật ký Kiểm toán Hệ thống (Audit Logs)
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Theo dõi toàn bộ thao tác quan trọng của Quản trị viên và Giáo viên: Tạo/Khóa tài khoản, Import Excel, Chuyển lớp, Sửa điểm, Cấu hình AI.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2.5 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo người thực hiện, hành động, chi tiết..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-400 uppercase">Hành động:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <option value="ALL">Tất cả hành động ({logs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Thời gian</th>
                <th className="py-3.5 px-6">Người thực hiện</th>
                <th className="py-3.5 px-6">Hành động</th>
                <th className="py-3.5 px-6">Đối tượng</th>
                <th className="py-3.5 px-6">Chi tiết thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Đang tải nhật ký hệ thống...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Chưa có bản ghi nhật ký nào.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            {log.user.fullName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {log.user.role} • {log.user.email || log.user.studentCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Hệ thống</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600 dark:text-gray-300 font-medium">
                      <div>{log.entityType || "-"}</div>
                      {log.entityId && <div className="text-[11px] text-gray-400 font-mono">{String(log.entityId).slice(0, 12)}</div>}
                    </td>
                    <td className="py-4 px-6">
                      {log.details ? (
                        <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 max-w-md overflow-x-auto font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
