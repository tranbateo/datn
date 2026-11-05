"use client";

import { Link, usePathname } from "@/i18n/routing";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Library, 
  BarChart3, 
  Bot, 
  UserCheck,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  MessageSquareWarning,
  School,
  ShieldAlert,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { logout } from "@/app/[locale]/(auth)/actions";

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Admin.Sidebar");

  const menuItems = [
    { name: t('overview'), icon: LayoutDashboard, href: "/admin" },
    { name: "Lớp học & Phân công", icon: School, href: "/admin/classes" },
    { name: t('students'), icon: Users, href: "/admin/students" },
    { name: t('teachers'), icon: GraduationCap, href: "/admin/teachers" },
    { name: t('parents'), icon: UserCheck, href: "/admin/parents" },
    { name: t('courses'), icon: Library, href: "/admin/courses" },
    { name: "Kho Tài liệu RAG", icon: FileText, href: "/admin/documents" },
    { name: t('analytics'), icon: BarChart3, href: "/admin/analytics" },
    { name: t('notifications'), icon: Bell, href: "/admin/notifications" },
    { name: t('feedback'), icon: MessageSquareWarning, href: "/admin/feedback" },
    { name: t('aiConfig'), icon: Bot, href: "/admin/ai-models" },
    { name: "Nhật ký Hệ thống", icon: ShieldAlert, href: "/admin/audit-logs" },
    { name: t('settings'), icon: Settings, href: "/admin/settings" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-card-bg border-r border-slate-200/80 dark:border-card-border flex flex-col h-screen sticky top-0">
      {/* Brand & Workspace */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-blue-600/20">
            AI
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight tracking-tight">
              AI Tutor
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              {t("portal")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-hide">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname.endsWith("/admin")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-blue-50/70 dark:hover:bg-slate-800/60 hover:text-blue-700 dark:hover:text-blue-300",
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {t("systemStable")}
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" /> {t("logout")}
          </button>
        </form>
      </div>
    </aside>
  );
}
