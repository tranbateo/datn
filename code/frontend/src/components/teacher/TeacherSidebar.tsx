"use client";

import { Link, usePathname } from "@/i18n/routing";
import { 
  LayoutDashboard, 
  Users, 
  Library, 
  Settings,
  HelpCircle,
  LogOut,
  FileQuestion,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { logout } from "@/app/[locale]/(auth)/actions";

export function TeacherSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Teacher.Sidebar");

  const menuItems = [
    { name: t('dashboard'), icon: LayoutDashboard, href: "/teacher" },
    { name: t('courses'), icon: Library, href: "/teacher/courses" },
    { name: t('quiz'), icon: FileQuestion, href: "/teacher/quiz" },
    { name: t('documents'), icon: FileText, href: "/teacher/documents" },
    { name: t('students'), icon: Users, href: "/teacher/students" },
    { name: t('settings'), icon: Settings, href: "/teacher/settings" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-card-bg border-r border-slate-200/80 dark:border-card-border flex flex-col h-screen sticky top-0">
      {/* Brand & Workspace */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-emerald-600/20">
            AI
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              AI Tutor
            </h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Cổng Giáo viên
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-5 overflow-y-auto scrollbar-hide">
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/teacher"
                ? pathname.endsWith("/teacher")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-emerald-600",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-slate-100 dark:border-card-border bg-white dark:bg-card-bg mt-auto">
        <div className="space-y-1">
          <Link
            href="/teacher/settings"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-slate-400" />
            Trợ giúp & Cài đặt
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            {t("logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
