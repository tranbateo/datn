"use client";
import { notify } from "@/lib/toast";

import { APP_ROUTES } from "@/constants/routes";
import {
  ChevronLeft,
  Loader2,
  Lock,
  CheckCircle2,
  Upload,
  Camera,
  RotateCcw,
  Users,
  Phone,
  Link2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useState, useEffect, useRef } from "react";
import {
  usersService,
  UserProfile,
  formatClassLabel,
  getFallbackAvatar,
  processAvatarFile,
} from "@/services/users.service";
import { parentService } from "@/services/parent.service";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // One-time 6-digit Parent Link Code (BR-LINK-001)
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkExpiresAt, setLinkExpiresAt] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGenerateLinkCode = async () => {
    setGeneratingCode(true);
    try {
      const res = (await parentService.generateLinkCode()) as {
        linkCode: string;
        expiresAt?: string;
      };
      setLinkCode(res.linkCode);
      setLinkExpiresAt(res.expiresAt || null);
      notify("Đã tạo mã liên kết Phụ huynh (hiệu lực 15 phút)!");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Không thể tạo mã liên kết.");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyLinkCode = async () => {
    if (!linkCode) return;
    try {
      await navigator.clipboard.writeText(linkCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await processAvatarFile(file);
      setAvatarUrl(dataUrl);
      notify("Đã tải ảnh lên. Nhấn 'Lưu thay đổi' để áp dụng.");
    } catch (err: unknown) {
      const error = err as Error;
      notify(error.message || "Không thể xử lý file ảnh.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const payload: Record<string, any> = {
        fullName: name.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || "",
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
      notify("Đã lưu thông tin cá nhân thành công!");
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: unknown) {
      const err = error as Error;
      notify("Lỗi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeClassName = (profile as any)?.classEnrollments?.[0]?.class?.name;
  const linkedParents: Array<{
    id: string;
    relationship?: string | null;
    parent?: { id: string; fullName?: string | null; phone?: string | null; email?: string | null };
  }> = (profile as any)?.studentLinks || [];

  const fallbackAvatar = getFallbackAvatar(name || profile?.fullName || "Student");
  const displayAvatar = avatarUrl || profile?.avatarUrl || fallbackAvatar;

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 animate-in fade-in duration-500 pb-24">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={APP_ROUTES.DASHBOARD}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Hồ sơ cá nhân & Cài đặt
          </h1>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            Đã lưu thông tin cá nhân vào cơ sở dữ liệu thành công!
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Thông tin học sinh</h2>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="relative w-20 h-20 shrink-0 group">
                  <img
                    src={displayAvatar}
                    alt="Ảnh đại diện"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackAvatar;
                    }}
                    className="w-20 h-20 rounded-full border-2 border-blue-100 dark:border-blue-900 bg-gray-100 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-gray-900 transition-colors"
                    title="Tải ảnh đại diện mới"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-base">
                    {name || profile?.fullName || "Học sinh"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Mã học sinh:{" "}
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {(profile as any)?.studentCode || "Chưa cấp"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Lớp chính khóa:{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {formatClassLabel(activeClassName, profile?.grade || 9)}
                    </span>{" "}
                    (Do nhà trường quản lý)
                  </div>

                  {/* Upload Avatar Controls */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Tải ảnh lên từ máy
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Ảnh mặc định
                      </button>
                    )}
                    <span className="text-[11px] text-gray-400">JPG, PNG, WEBP (tối đa 5MB)</span>
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
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="090xxxxxxx"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
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
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* School-Managed Linked Parents Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-bold text-gray-900 dark:text-white">Thông tin Phụ huynh liên kết</h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Tài khoản Phụ huynh được Nhà trường liên kết tự động theo danh sách lớp chính khóa.
              </p>

              {linkedParents.length > 0 ? (
                <div className="space-y-2.5">
                  {linkedParents.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {link.parent?.fullName || "Phụ huynh"}
                          {link.relationship ? (
                            <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                              {link.relationship === "FATHER"
                                ? "Bố"
                                : link.relationship === "MOTHER"
                                  ? "Mẹ"
                                  : link.relationship}
                            </span>
                          ) : null}
                        </p>
                        {link.parent?.phone && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {link.parent.phone}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                        Đã liên kết
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Danh sách liên kết phụ huynh được quản lý trực tiếp bởi Giáo viên chủ nhiệm và Nhà trường.
                </div>
              )}
              {/* Generate 6-digit One-Time Link Code for Parents (BR-LINK-001) */}
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-indigo-600" /> Tạo mã liên kết Phụ huynh (6 số)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Đưa mã này cho Bố/Mẹ nhập ở mục Liên kết Con trên Cổng Phụ huynh (dùng 1 lần trong 15 phút).
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={generatingCode}
                    onClick={handleGenerateLinkCode}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {generatingCode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {linkCode ? "Lấy lại mã" : "Tạo mã 6 số"}
                  </button>
                </div>

                {linkCode && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-indigo-600 dark:text-indigo-300">
                        Mã xác nhận dùng một lần
                      </span>
                      <div className="text-2xl font-mono font-extrabold tracking-[0.25em] text-indigo-700 dark:text-indigo-200 mt-0.5">
                        {linkCode}
                      </div>
                      {linkExpiresAt && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          Hết hạn lúc: {new Date(linkExpiresAt).toLocaleTimeString("vi-VN")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLinkCode}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Sao chép mã
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm mt-4"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lưu thay đổi"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
