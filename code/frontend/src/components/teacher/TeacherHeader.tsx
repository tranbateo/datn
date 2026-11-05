"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { NotificationBell } from "../common/NotificationBell";
import { fetchApi } from "@/lib/api-client";
import { Link } from "@/i18n/routing";

interface TeacherProfile {
  fullName?: string | null;
  school?: { name?: string | null } | null;
}

export function TeacherHeader() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    fetchApi<TeacherProfile>("/users/profile")
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  return (
    <header className="h-16 bg-white/90 dark:bg-card-bg/90 backdrop-blur-md border-b border-slate-200/80 dark:border-card-border flex items-center justify-between px-6 sm:px-8 sticky top-0 z-10">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
          Cổng Giáo viên
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {profile?.school?.name || "Quản lý lớp học, tài liệu và đề kiểm tra"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <NotificationBell />
          <ThemeToggle />
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

        <Link
          href="/teacher/settings"
          className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-colors"
          aria-label="Mở cài đặt tài khoản giáo viên"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {profile?.fullName || "Giáo viên"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tài khoản của tôi</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
