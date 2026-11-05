"use client";
import { notify } from "@/lib/toast";

import { APP_ROUTES } from "@/constants/routes";
import Image from "next/image";
import { Menu, Bell, ChevronLeft, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { usersService, UserProfile } from "@/services/users.service";
import { parentService } from "@/services/parent.service";

export default function SettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersService.getProfile();
        setProfile(data);
        setName(data.fullName || "");
        setPhone((data as any).phone || "");
        setAvatarUrl(data.avatarUrl || "");
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const payload: Record<string, any> = {
        fullName: name.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      };
      if (password.trim()) {
        if (password.trim().length < 6) {
          notify("Mật khẩu mới phải có ít nhất 6 ký tự.");
          setSaving(false);
          return;
        }
        payload.password = password.trim();
      }

      const updated = await usersService.updateProfile(payload);
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setPassword("");
      sessionStorage.removeItem("eduai_student_profile_cache");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: unknown) {
      const err = error as Error;
      notify("Lỗi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLinkCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await parentService.generateLinkCode();
      setLinkCode(res.linkCode);
    } catch (error: unknown) {
      const err = error as Error;
      notify("Không thể tạo mã liên kết: " + err.message);
    } finally {
      setGeneratingCode(false);
    }
  };

  const activeClassName = (profile as any)?.classEnrollments?.[0]?.class?.name;

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 animate-in fade-in duration-500 pb-24">
      {/* Mobile Top Header */}
      <div className="bg-white dark:bg-gray-900 px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 md:hidden">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.DASHBOARD} className="p-1 -ml-1 text-indigo-600 dark:text-indigo-400">
            <Menu className="w-6 h-6" />
          </Link>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">Hồ sơ & Cài đặt</span>
        </div>
        <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 mb-2">
          <Link
            href={APP_ROUTES.DASHBOARD}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hồ sơ cá nhân & Cài đặt</h1>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            Đã lưu thông tin cá nhân vào cơ sở dữ liệu thành công!
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Thông tin học sinh</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-20 h-20 shrink-0">
                  <Image
                    src={avatarUrl || profile?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Minh"}
                    alt="Avatar"
                    fill
                    className="rounded-full border-2 border-indigo-100 dark:border-indigo-900 bg-gray-100 object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-base">
                    {name || profile?.fullName || "Học sinh"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Mã học sinh:{" "}
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {(profile as any)?.studentCode || "Chưa cấp"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Lớp chính khóa:{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {activeClassName ? `Lớp ${activeClassName}` : `Khối ${profile?.grade || 9}`}
                    </span>{" "}
                    (Do nhà trường quản lý)
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Họ và tên</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="090xxxxxxx"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Đường dẫn ảnh đại diện (Avatar URL)</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Đổi mật khẩu mới (Để trống nếu không đổi)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-bold text-gray-900 dark:text-white">Tùy chọn thông báo</h2>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Thông báo đẩy (Push)</span>
                  <button
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${pushEnabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${pushEnabled ? "left-7" : "left-1"}`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email tổng hợp kết quả</span>
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${emailEnabled ? "left-7" : "left-1"}`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Parent Link Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-2">Liên kết Phụ huynh</h2>
              <p className="text-xs text-gray-500 mb-4">
                Tạo mã liên kết một lần để phụ huynh có thể theo dõi tiến trình học tập của bạn.
              </p>

              {linkCode ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center border border-indigo-100 dark:border-indigo-800">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">Mã của bạn là:</p>
                  <p className="text-3xl font-bold tracking-widest text-indigo-700 dark:text-indigo-300">{linkCode}</p>
                </div>
              ) : (
                <button
                  onClick={handleGenerateLinkCode}
                  disabled={generatingCode}
                  className="w-full flex justify-center items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  {generatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo mã liên kết"}
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm mt-4"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lưu thay đổi vào CSDL"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
