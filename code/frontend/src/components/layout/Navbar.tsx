import { APP_ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/routing";
import {
  GraduationCap,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "../ThemeToggle";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { logout } from "@/app/[locale]/(auth)/actions";

export default async function Navbar() {
  const t = await getTranslations("Navigation");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  let user: { role?: string } | null = null;
  if (token) {
    try {
      user = decodeJwt(token) as { role?: string };
    } catch {
      user = null;
    }
  }

  const getDashboardHref = (role?: string) => {
    const r = (role || "").toUpperCase();
    if (r === "ADMIN" || r === "SCHOOL_ADMIN") return "/admin";
    if (r === "TEACHER") return "/teacher";
    if (r === "PARENT") return "/parent";
    return "/dashboard";
  };

  return (
    <header className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link href={APP_ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                AI Tutor
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Giáo dục thông minh K-12
              </span>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-7"
          >
            <Link
              href={APP_ROUTES.HOME}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
            >
              {t("home")}
            </Link>
            <Link
              href={APP_ROUTES.FEATURES}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
            >
              {t("features")}
            </Link>
            <Link
              href={APP_ROUTES.PRICING}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
            >
              {t("pricing")}
            </Link>
            <Link
              href="/admin/login"
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Cổng Nhà trường
            </Link>
          </nav>

          {/* Controls & Auth Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700" />
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href={getDashboardHref(user.role)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t("dashboard")}</span>
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl font-medium hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("logout")}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/admin/login"
                  className="hidden lg:inline-flex items-center text-slate-600 dark:text-slate-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 text-sm"
                >
                  Quản trị viên
                </Link>
                <Link
                  href={APP_ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 hover:shadow-md transition-all"
                >
                  <span>{t("login")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
