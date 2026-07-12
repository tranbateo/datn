import { Search, Printer, Grid, User } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslations } from "next-intl";
import { NotificationBell } from "../common/NotificationBell";
import { LogOut } from "lucide-react";
import { logout } from "@/app/[locale]/(auth)/actions";

export function AdminHeader() {
  const t = useTranslations("Admin.Header");


  return (
    <header className="h-20 bg-white dark:bg-card-bg border-b border-gray-100 dark:border-card-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-primary max-w-[200px] leading-tight">
          {t('title').split(' ').map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h1>
        
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Printer className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
            <NotificationBell />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Grid className="w-5 h-5" />
          </button>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
        
        <div className="flex items-center gap-3">
          <button className="text-primary font-medium text-sm px-4 py-2 border border-primary/20 hover:bg-primary/5 rounded-lg transition-colors">
            {t('exportData')}
          </button>
          <button className="bg-primary hover:bg-primary-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">
            {t('createNew')}
          </button>
          <form action={logout}>
            <button type="submit" title="Đăng xuất" className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/50 transition-colors">
              <LogOut className="w-4 h-4 ml-1" />
            </button>
          </form>
          <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Avatar placeholder */}
            <User className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
