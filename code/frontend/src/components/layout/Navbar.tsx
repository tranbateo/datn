import { APP_ROUTES } from '@/constants/routes';
import { Link } from "@/i18n/routing";
import { GraduationCap, LogOut, LayoutDashboard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { logout } from "@/app/[locale]/(auth)/actions";

export default async function Navbar() {
  const t = await getTranslations("Navigation");
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  let user: any | null = null;
  if (token) {
    try {
      user = decodeJwt(token);
    } catch {}
  }

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={APP_ROUTES.HOME} className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-primary">AI Tutor</span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href={APP_ROUTES.HOME} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium text-sm border-b-2 border-transparent hover:border-primary transition-colors py-1">{t('home')}</Link>
            <Link href={APP_ROUTES.FEATURES} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium text-sm border-b-2 border-transparent hover:border-primary transition-colors py-1">{t('features')}</Link>
            <Link href={APP_ROUTES.PRICING} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium text-sm border-b-2 border-transparent hover:border-primary transition-colors py-1">{t('pricing')}</Link>
            <Link href={APP_ROUTES.BLOG} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium text-sm border-b-2 border-transparent hover:border-primary transition-colors py-1">{t('blog')}</Link>
            <Link href={APP_ROUTES.FAQ} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-medium text-sm border-b-2 border-transparent hover:border-primary transition-colors py-1">{t('faq')}</Link>
          </nav>

          {/* Controls & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href={user.role?.toLowerCase() === 'admin' ? "/admin" : "/dashboard"} 
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium hover:text-primary transition-colors px-2 py-1 text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('dashboard')}
                </Link>
                <form action={logout}>
                  <button 
                    type="submit"
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full font-medium hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <Link 
                  href={APP_ROUTES.LOGIN} 
                  className="text-gray-700 dark:text-gray-300 font-medium hover:text-primary transition-colors px-2 py-1"
                >
                  {t('login')}
                </Link>
                <Link 
                  href={APP_ROUTES.REGISTER} 
                  className="bg-primary text-white px-5 py-2.5 rounded-full font-medium hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
