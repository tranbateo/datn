"use client";

import { Bell } from "lucide-react";
import { useState, useEffect } from "react";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const { fetchApi } = await import('@/lib/api-client');
        const data = await fetchApi('/notifications');
        if (Array.isArray(data)) {
          const unread = data.some((n: Record<string, unknown>) => !n.isRead);
          setHasUnread(unread);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
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
