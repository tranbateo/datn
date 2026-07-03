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
    <aside className="w-64 bg-green-50/50 dark:bg-card-bg border-r border-gray-100 dark:border-card-border flex flex-col h-screen sticky top-0">
      {/* Brand & Workspace */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            E
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">EduAI</h2>
            <p className="text-xs text-green-600 font-medium">Teacher Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide">
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-green-600 text-white shadow-md shadow-green-600/20" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-gray-800 hover:text-green-700 dark:hover:text-green-500"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-green-600")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-gray-100 dark:border-card-border bg-white dark:bg-card-bg mt-auto">
        <div className="space-y-1 mb-4">
          <Link href="/teacher/help" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-gray-800 transition-colors">
            <HelpCircle className="w-5 h-5 text-gray-400" />
            Help & Support
          </Link>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            {t('logout')}
          </button>
        </div>
      </div>
    </aside>
  );
}
