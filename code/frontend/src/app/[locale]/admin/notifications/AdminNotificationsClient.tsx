"use client";

import { notify } from "@/lib/toast";
import {
  Send,
  Clock,
  Users,
  Search,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { fetchApi } from "@/lib/api-client";

export default function AdminNotificationsClient({
  initialData,
}: {
  initialData: any[];
}) {
  const t = useTranslations("Admin.Notifications");
  const [notifications, setNotifications] = useState<any[]>(initialData || []);
  const [classes, setClasses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<"SCHOOL" | "GRADE" | "CLASS">("SCHOOL");
  const [selectedGrade, setSelectedGrade] = useState(6);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [sending, setSending] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    fetchApi<any[]>("/admin/classes")
      .then((res) => setClasses(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const reloadHistory = async () => {
    setReloading(true);
    try {
      const res = await fetchApi<any[]>("/admin/notifications");
      if (Array.isArray(res)) setNotifications(res);
    } catch {
      // ignore
    } finally {
      setReloading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => {
      const text =
        `${n.title || ""} ${n.body || n.message || ""} ${n.targetRole || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [notifications, searchTerm]);

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      notify("Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!");
      return;
    }
    if (scope === "CLASS" && !selectedClassId) {
      notify("Vui lòng chọn lớp học nhận thông báo!");
      return;
    }
    setSending(true);
    try {
      const res = await fetchApi<{ recipientCount?: number; message?: string }>(
        "/admin/notifications",
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            targetRole,
            ...(scope === "GRADE" ? { grade: Number(selectedGrade) } : {}),
            ...(scope === "CLASS" ? { classId: selectedClassId } : {}),
          }),
        },
      );
      setTitle("");
      setBody("");
      notify(
        res?.message ||
          `Đã gửi thông báo tới ${res?.recipientCount ?? 0} tài khoản!`,
      );
      await reloadHistory();
    } catch (error: any) {
      console.error(error);
      notify(error?.message || "Gửi thông báo thất bại. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {t("subtitle")} — Gửi thông báo toàn trường, theo Khối hoặc theo Lớp
            tới Học sinh, Giáo viên và Phụ huynh.
          </p>
        </div>
        <button
          type="button"
          onClick={reloadHistory}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-bg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 ${reloading ? "animate-spin" : ""}`} />
          Làm mới lịch sử
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Broadcast Form */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />{" "}
              {t("createNotification")}
            </h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Phạm vi gửi
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                {(
                  [
                    { id: "SCHOOL", label: "Toàn trường" },
                    { id: "GRADE", label: "Theo Khối" },
                    { id: "CLASS", label: "Theo Lớp" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScope(item.id)}
                    className={`py-2 rounded-lg transition-colors ${
                      scope === item.id
                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {scope === "GRADE" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Chọn khối lớp
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === "CLASS" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Chọn lớp học
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Khối {cls.grade} — {cls._count?.enrollments || 0} HS)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t("target")}
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              >
                <option value="ALL">Tất cả (Học sinh, Giáo viên & Phụ huynh)</option>
                <option value="STUDENT">Chỉ Học sinh</option>
                <option value="TEACHER">Chỉ Giáo viên</option>
                <option value="PARENT">Chỉ Phụ huynh</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t("messageTitle")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                placeholder="VD: Thông báo lịch nghỉ lễ / lịch kiểm tra học kỳ..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t("messageContent")}
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-none"
                placeholder="Nhập nội dung thông báo chi tiết..."
              />
            </div>

            <button
              type="button"
              onClick={handleSendNotification}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Đang phát thông báo..." : "Gửi thông báo ngay"}
            </button>
          </div>
        </div>

        {/* Right Column: Grouped Sent Notifications Table */}
        <div className="w-full lg:w-2/3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-xl text-sm shadow-sm dark:text-white"
            />
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm overflow-hidden min-h-[480px]">
            <div className="overflow-x-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Chưa có thông báo nào
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">
                        {t("messageTitle")} & {t("messageContent")}
                      </th>
                      <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                        Đối tượng nhận
                      </th>
                      <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                        {t("sentAt")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {filteredNotifications.map((notif: any) => (
                      <tr
                        key={notif.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors align-top"
                      >
                        <td className="px-5 py-4 max-w-md">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {notif.body || notif.message}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{notif.targetRole || "Toàn trường"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(notif.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
