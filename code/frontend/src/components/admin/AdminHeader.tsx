import { User, LogOut, Download, Plus } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { useTranslations } from "next-intl";
import { NotificationBell } from "../common/NotificationBell";
import { logout } from "@/app/[locale]/(auth)/actions";
import { Link } from "@/i18n/routing";

export function AdminHeader() {
  const t = useTranslations("Admin.Header");

  return (
    <header className="h-16 bg-white/90 dark:bg-card-bg/90 backdrop-blur-md border-b border-slate-200/80 dark:border-card-border flex items-center justify-between px-6 sm:px-8 sticky top-0 z-10">
      <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
        {t("title")}
      </h1>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <NotificationBell />
          <ThemeToggle />
        </div>

        <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-700" />

        <a
          href="/api/proxy/schools/export/credentials"
          className="hidden md:inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          {t("exportData")}
        </a>
        <Link
          href="/admin/classes"
          className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-3.5 py-2 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("createNew")}
        </Link>
        <Link
          href="/admin/settings"
          aria-label="Cài đặt nhà trường"
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </Link>
        <form action={logout}>
          <button
            type="submit"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
