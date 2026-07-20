"use client";

import { APP_ROUTES } from '@/constants/routes';
 

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Home, Bot, Calendar, BookOpen, BarChart2, Bell, LogOut, Edit3, MessageSquareWarning, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { logout } from "@/app/[locale]/(auth)/actions";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function StudentNavigation() {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "submitting" | "success">("idle");
  const t = useTranslations("User.Navigation");
  const tNotif = useTranslations("User.Notifications");
  const tFeedback = useTranslations("Admin.FeedbackModal");
  const [hasUnread, setHasUnread] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { fetchApi } = await import('@/lib/api-client');
        const [profileData, notificationsData] = await Promise.all([
          fetchApi('/users/profile').catch(() => null),
          fetchApi('/notifications').catch(() => [])
        ]);
        
        if (profileData) {
          setUserProfile(profileData);
        }
        
        if (Array.isArray(notificationsData)) {
          const unread = notificationsData.some((n: any) => !n.isRead);
          setHasUnread(unread);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUserData();
  }, []);

  // Simple check for active link based on the last segment
  const isActive = (path: string) => {
    // Exact match for /dashboard, or starts with /dashboard/path
    if (path === "/dashboard") {
      return pathname.endsWith("/dashboard");
    }
    return pathname.includes(path);
  };

  const navItems = [
    { name: t("home"), href: "/dashboard", icon: Home },
    { name: t("aiTutor"), href: "/dashboard/ai-tutor", icon: Bot },
    { name: "Khóa học", href: "/dashboard/courses", icon: BookOpen }, // Add explicit translation if possible, for now hardcode "Khóa học"
    { name: t("schedule"), href: "/dashboard/schedule", icon: Calendar },
    { name: t("practice"), href: "/dashboard/practice", icon: Edit3 },
    { name: t("progress"), href: "/dashboard/progress", icon: BarChart2 },
  ];

  return (
    <>
      {/* --- MOBILE TOP HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-16 px-4 flex items-center justify-between">
        
        {/* Left: Avatar & Greeting */}
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors shrink-0 relative"
          >
            <Image src={userProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.fullName || 'User'}`} alt="Avatar" fill className="object-cover bg-gray-100" sizes="40px" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
          </button>

          <div className="flex flex-col">
            <span className="font-bold text-blue-600 dark:text-blue-500 text-sm truncate max-w-[120px]">{userProfile?.fullName || 'Học viên'}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{userProfile?.grade ? `Lớp ${userProfile.grade}` : t("greetingMobile")}</span>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute top-12 left-0 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
              <Link 
                href={APP_ROUTES.ONBOARDING} 
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {t("editProfile")}
              </Link>
              <form action={logout}>
                <button type="submit" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Notifications & ThemeToggle & LanguageSwitcher */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {hasUnread && <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
          </button>
          
          {/* Notifications Dropdown (Mobile) */}
          {showNotifications && (
            <div className="absolute top-14 right-4 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">{tNotif("title")}</span>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{tNotif("markAllRead")}</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Toán 11 - Sắp bắt đầu!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tiết học sẽ bắt đầu trong 15 phút nữa.</p>
                  <p className="text-[10px] text-blue-500 mt-1">Vừa xong</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Bạn nhận được 50 XP</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tuyệt vời! Bạn đã hoàn thành xuất sắc bài tập tiếng Anh.</p>
                  <p className="text-[10px] text-gray-400 mt-1">2 giờ trước</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-center">
                <button className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">{tNotif("viewAll")}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- DESKTOP / TABLET SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-50 bg-white dark:bg-card-bg border-r border-gray-100 dark:border-card-border overflow-y-auto">
        <Link href={APP_ROUTES.HOME} className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">AI Tutor</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("slogan")}</p>
          </div>
        </Link>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Snippet in Sidebar */}
        <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800">
          <Link href={APP_ROUTES.ONBOARDING} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border border-transparent dark:border-gray-800">
            <div className="w-10 h-10 rounded-full shrink-0 relative overflow-hidden">
              <Image
                src={userProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.fullName || 'User'}`}
                alt="Avatar"
                fill
                className="bg-gray-100 object-cover"
                sizes="40px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userProfile?.fullName || 'Học viên'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userProfile?.grade ? `Lớp ${userProfile.grade}` : t("role")}</p>
            </div>
          </Link>
          <form action={logout} className="mt-2">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" />
              {t("logout")}
            </button>
          </form>
        </div>
      </aside>

      {/* --- DESKTOP TOP RIGHT TOOLBAR --- */}
      <div className="hidden md:flex fixed top-4 right-6 z-50 items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-3 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
        <LanguageSwitcher />
        <ThemeToggle />
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="relative w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors tooltip"
          title={tFeedback("buttonText")}
        >
          <MessageSquareWarning className="w-5 h-5" />
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {hasUnread && <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
          </button>
          
          {/* Notifications Dropdown (Desktop) */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <span className="font-bold text-gray-900 dark:text-white">{tNotif("title")}</span>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{tNotif("markAllRead")}</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Toán 11 - Sắp bắt đầu!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tiết học sẽ bắt đầu trong 15 phút nữa.</p>
                  <p className="text-[10px] font-medium text-blue-500 mt-1.5 uppercase tracking-wider">Vừa xong</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Bạn nhận được 50 XP</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tuyệt vời! Bạn đã hoàn thành xuất sắc bài tập tiếng Anh.</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1.5 uppercase tracking-wider">2 giờ trước</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-center bg-gray-50/50 dark:bg-gray-800/50">
                <button className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{tNotif("viewAll")}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card-bg border-t border-gray-100 dark:border-card-border pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                  active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <div className={`p-1.5 rounded-full ${active ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                  <item.icon className={`w-5 h-5 ${active ? "fill-blue-600/20" : ""}`} />
                </div>
                <span className="text-[10px] font-medium leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* --- FEEDBACK MODAL --- */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquareWarning className="w-5 h-5 text-amber-500" />
                  {tFeedback("title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tFeedback("subtitle")}</p>
              </div>
              <button 
                onClick={() => { setShowFeedbackModal(false); setFeedbackStatus("idle"); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {feedbackStatus === "success" ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{tFeedback("successTitle")}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{tFeedback("successMessage")}</p>
                  <button 
                    onClick={() => { setShowFeedbackModal(false); setFeedbackStatus("idle"); }}
                    className="mt-6 w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tFeedback("categoryLabel")}</label>
                    <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      <option value="ai">{tFeedback("catAI")}</option>
                      <option value="content">{tFeedback("catContent")}</option>
                      <option value="system">{tFeedback("catSystem")}</option>
                      <option value="other">{tFeedback("catOther")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tFeedback("contentLabel")}</label>
                    <textarea 
                      rows={4}
                      placeholder={tFeedback("contentPlaceholder")}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {feedbackStatus !== "success" && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {tFeedback("cancel")}
                </button>
                <button 
                  onClick={() => {
                    setFeedbackStatus("submitting");
                    setTimeout(() => setFeedbackStatus("success"), 1000);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  disabled={feedbackStatus === "submitting"}
                >
                  {feedbackStatus === "submitting" ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : null}
                  {tFeedback("submit")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
