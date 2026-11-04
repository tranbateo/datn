"use client";

import { Send, CheckCircle2, Clock, Users, Search, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { fetchApi } from "@/lib/api-client";

export default function AdminNotificationsClient({ initialData }: { initialData: any[] }) {
  const t = useTranslations("Admin.Notifications");
  const [notifications, setNotifications] = useState<any[]>(initialData || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [sending, setSending] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (!searchTerm) return true;
      const text = `${n.title || ""} ${n.body || n.message || ""}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });
  }, [notifications, searchTerm]);

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!");
      return;
    }
    setSending(true);
    try {
      const res = await fetchApi<{ count: number; message: string }>("/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          targetRole,
        }),
      });
      const newNotif = {
        id: Date.now().toString(),
        title: title.trim(),
        body: body.trim(),
        targetRole,
        createdAt: new Date().toISOString(),
      };
      setNotifications([newNotif, ...notifications]);
      setTitle("");
      setBody("");
      alert(res?.message || "Đã gửi thông báo thành công!");
    } catch (error) {
      console.error(error);
      alert("Gửi thông báo thất bại. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-400 shadow-sm"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Notification Form */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" /> {t('createNotification')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('messageTitle')}</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('messageContent')}</label>
                <textarea 
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Nhập nội dung thông báo..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('target')}</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả người dùng trong trường</option>
                  <option value="STUDENT">Học sinh</option>
                  <option value="TEACHER">Giáo viên</option>
                  <option value="PARENT">Phụ huynh</option>
                </select>
              </div>

              <button
                onClick={handleSendNotification}
                disabled={sending}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Đang gửi..." : "Gửi thông báo"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sent Notifications Table */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('subtitle')}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm flex flex-col min-h-[500px]">
            {/* Table */}
            <div className="overflow-x-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Chưa có thông báo nào
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Loại</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('messageTitle')} & {t('messageContent')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('target')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('sentAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {filteredNotifications.map((notif: any) => (
                      <tr key={notif.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><Info className="w-4 h-4 text-blue-500" /></div>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-normal line-clamp-2">{notif.body || notif.message}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit">
                            <Users className="w-3.5 h-3.5" /> <span className="text-xs font-medium">{notif.targetRole || 'Tất cả'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
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
