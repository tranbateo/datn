import { Search, Bell, User } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslations } from "next-intl";

export function TeacherHeader() {
  const t = useTranslations("Teacher.Dashboard"); // We'll just reuse some text or static text

  return (
    <header className="h-20 bg-white dark:bg-card-bg border-b border-gray-100 dark:border-card-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-primary max-w-[200px] leading-tight">
          Teacher<br/>Portal
        </h1>
        
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <ThemeToggle />
          <LanguageSwitcher />
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>

        <button className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-xl transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Teacher</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">EduAI Staff</p>
          </div>
        </button>
      </div>
    </header>
  );
}
