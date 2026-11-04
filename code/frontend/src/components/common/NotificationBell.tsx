"use client";

import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api-client";

interface NotificationBellProps {
  className?: string;
}

const NOTIF_CACHE_KEY = "eduai_unread_notif_cache";
const CACHE_TTL_MS = 60_000;

export function NotificationBell({ className }: NotificationBellProps) {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const cached = sessionStorage.getItem(NOTIF_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL_MS) {
            setHasUnread(Boolean(parsed.hasUnread));
            return;
          }
        }
        const data = await fetchApi<any[]>('/notifications');
        if (Array.isArray(data)) {
          const unread = data.some((n: any) => !n.isRead);
          setHasUnread(unread);
          sessionStorage.setItem(
            NOTIF_CACHE_KEY,
            JSON.stringify({ hasUnread: unread, ts: Date.now() }),
          );
        }
      } catch {
        // Ignore silent notification check error
      }
    };
    checkNotifications();
  }, []);

  return (
    <>
      <Bell className={className || "w-5 h-5"} />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
      )}
    </>
  );
}
