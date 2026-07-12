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
  MessageSquareWarning
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { logout } from "@/app/[locale]/(auth)/actions";

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Admin.Sidebar");

  const menuItems = [
    { name: t('overview'), icon: LayoutDashboard, href: "/admin" },
    { name: t('analytics'), icon: BarChart3, href: "/admin/analytics" },
    { name: t('students'), icon: Users, href: "/admin/students" },
    { name: t('teachers'), icon: GraduationCap, href: "/admin/teachers" },
    { name: t('parents'), icon: UserCheck, href: "/admin/parents" },
    { name: t('courses'), icon: Library, href: "/admin/courses" },
    { name: t('notifications'), icon: Bell, href: "/admin/notifications" },
    { name: t('feedback'), icon: MessageSquareWarning, href: "/admin/feedback" },
    { name: t('aiConfig'), icon: Bot, href: "/admin/ai-models" },
    { name: t('settings'), icon: Settings, href: "/admin/settings" },
  ];

  return (
    <aside className="w-64 bg-blue-50/50 dark:bg-card-bg border-r border-gray-100 dark:border-card-border flex flex-col h-screen sticky top-0">
      {/* Brand & Workspace */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            E
          </div>
          <div>
            <h2 className="font-bold text-blue-900 dark:text-white text-lg leading-tight tracking-tight">EduAI</h2>
            <p className="text-xs text-blue-600/70 font-medium">{t('portal')}</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                isActive 
                  ? "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 space-y-1">
        <div className="bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4 mx-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {t('systemStable')}
        </div>
        
        <Link href="/admin/help" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-colors">
          <HelpCircle className="w-5 h-5" /> {t('support')}
        </Link>
        <form action={logout}>
          <button type="submit" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-colors text-left">
            <LogOut className="w-5 h-5" /> {t('logout')}
          </button>
        </form>
      </div>
    </aside>
  );
}
