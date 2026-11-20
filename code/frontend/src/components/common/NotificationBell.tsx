"use client";

import {
  Bell,
  CheckCheck,
  KeyRound,
  ArrowRight,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api-client";
import { Link, usePathname } from "@/i18n/routing";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchApi<NotificationItem[]>("/notifications");
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // Ignore silent notification check error
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchSilent = () => {
      fetchApi<NotificationItem[]>("/notifications")
        .then((data) => {
          if (active && Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch(() => undefined);
    };
    fetchSilent();
    const interval = setInterval(fetchSilent, 45_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      void loadNotifications(notifications.length === 0);
    }
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await fetchApi(`/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // Ignore error
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetchApi("/notifications/read-all", { method: "PATCH" });
    } catch {
      // Ignore error
    }
  };

  const resolveActionHref = (notif: NotificationItem): string | null => {
    const isPwdReset = /cấp lại mật khẩu|quên mật khẩu/i.test(notif.title);
    const isParentMessageOrProposal =
      /tin nhắn mới|kiến nghị|đề xuất/i.test(notif.title);
    if (pathname.startsWith("/teacher")) {
      if (isPwdReset) return "/teacher/notifications?tab=password-resets";
      if (isParentMessageOrProposal) return "/teacher/notifications?tab=parents";
      return "/teacher/notifications";
    }
    if (pathname.startsWith("/admin")) {
      if (isPwdReset && /giáo viên/i.test(notif.title)) return "/admin/teachers";
      if (isPwdReset) return "/admin/students";
      return "/admin/notifications";
    }
    if (pathname.startsWith("/parent")) {
      if (isParentMessageOrProposal) return "/parent/contact";
      return "/parent";
    }
    return null;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={
          unreadCount > 0
            ? `Bạn có ${unreadCount} thông báo chưa đọc`
            : "Thông báo"
        }
      >
        <Bell className={className || "w-5 h-5"} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between gap-2">
            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300 font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-800">
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs text-slate-400">
                Hiện chưa có thông báo nào.
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => {
                const isPwdReset = /cấp lại mật khẩu|quên mật khẩu/i.test(
                  notif.title,
                );
                const isMsgOrProposal =
                  /tin nhắn mới|kiến nghị|đề xuất/i.test(notif.title);
                const actionHref = resolveActionHref(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) void handleMarkRead(notif.id);
                    }}
                    className={`p-3.5 transition-colors cursor-pointer ${
                      notif.isRead
                        ? "bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800/50"
                        : "bg-blue-50/60 dark:bg-blue-950/25 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isPwdReset
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
                            : isMsgOrProposal
                              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}
                      >
                        {isPwdReset ? (
                          <KeyRound className="w-3.5 h-3.5" />
                        ) : isMsgOrProposal ? (
                          <MessageSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {notif.body}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-[11px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleString("vi-VN")}
                          </span>
                          {actionHref && (
                            <Link
                              href={actionHref}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {isPwdReset
                                ? "Xử lý ngay"
                                : isMsgOrProposal
                                  ? "Mở hội thoại"
                                  : "Xem chi tiết"}
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {pathname.startsWith("/teacher") && (
            <div className="p-2.5 border-t border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-950/50 text-center">
              <Link
                href="/teacher/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Mở trung tâm Thông báo & Phụ huynh →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
