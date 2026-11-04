"use client";
/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect } from "react";
import { Settings, Bot, Shield, Trophy, Save, Key, CheckCircle2, Globe, Building, Mail, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { fetchApi } from "@/lib/api-client";

interface LicenseData {
  id: string;
  name: string;
  code: string;
  licenseKey: string | null;
  licenseStatus: string;
  licenseExpiresAt: string | null;
  aiTokenQuota: number;
  aiTokensUsed: number;
  aiProvider: string;
  hasCustomApiKey?: boolean;
  quotaPercentage?: number;
  quotaAlertLevel?: string;
}

export default function AdminSettingsClient({ initialData }: { initialData?: any }) {
  const [activeTab, setActiveTab] = useState("ai");
  const t = useTranslations("Admin.Settings");

  const [license, setLicense] = useState<LicenseData | null>(null);
  const [aiProvider, setAiProvider] = useState("SYSTEM_QUOTA");
  const [customApiKey, setCustomApiKey] = useState("");
  const [savingByok, setSavingByok] = useState(false);

  useEffect(() => {
    async function loadLicense() {
      try {
        const data = await fetchApi<LicenseData>("/schools/license/me");
        if (data) {
          setLicense(data);
          setAiProvider(data.aiProvider || "SYSTEM_QUOTA");
        }
      } catch (err) {
        console.error("Failed to load school license:", err);
      }
    }
    loadLicense();
  }, []);

  const handleSaveByok = async () => {
    setSavingByok(true);
    try {
      const updated = await fetchApi<LicenseData>("/schools/license/byok", {
        method: "PUT",
        body: JSON.stringify({
          aiProvider,
          customApiKey: aiProvider === "BYOK" ? customApiKey : "",
        }),
      });
      if (updated) {
        setLicense(updated);
        setCustomApiKey("");
        alert("Cập nhật cấu hình AI & BYOK của nhà trường thành công!");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể cập nhật cấu hình BYOK.");
    } finally {
      setSavingByok(false);
    }
  };

  const tabs = [
    { id: "ai", label: "Bản quyền & AI Quota (BYOK)", icon: Bot },
    { id: "general", label: t('general'), icon: Settings },
    { id: "rbac", label: t('rbac'), icon: Shield },
    { id: "gamification", label: t('gamification'), icon: Trophy },
  ];

  const quotaPct = license
    ? Math.min(100, Math.round((license.aiTokensUsed / Math.max(1, license.aiTokenQuota)) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={handleSaveByok}
          disabled={savingByok}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          {savingByok ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('saveChanges')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm p-6 sm:p-8">
            
            {/* --- AI & License Tab --- */}
            {activeTab === "ai" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {license && (
                  <div className="p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-900/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Bản quyền trường học (B2B License)
                        </span>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                          {license.name} ({license.code})
                        </h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                        license.licenseStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {license.licenseStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Mã License: </span>
                        <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                          {license.licenseKey || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Hạn sử dụng: </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {license.licenseExpiresAt ? new Date(license.licenseExpiresAt).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </span>
                      </div>
                    </div>

                    {/* Quota Progress Bar */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Hạn mức AI Token đã dùng (BR-AI-QUOTA)
                        </span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {license.aiTokensUsed.toLocaleString()} / {license.aiTokenQuota.toLocaleString()} ({quotaPct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            quotaPct >= 90 ? 'bg-red-500' : quotaPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${quotaPct}%` }}
                        />
                      </div>
                      {quotaPct >= 80 && (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            {quotaPct >= 100
                              ? "Hạn mức AI của nhà trường đã hết! Tính năng Chat AI và Sinh Quiz đang tạm khóa (Quiz, Tài liệu & Báo cáo vẫn hoạt động bình thường)."
                              : `Cảnh báo: Nhà trường đã sử dụng ${quotaPct}% hạn mức AI Token trong kỳ.`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-500" /> Chế độ cung cấp AI (System Quota vs BYOK)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Nhà trường có thể sử dụng hạn mức Token đi kèm gói bản quyền hoặc tự cấu hình Gemini API Key riêng (BYOK) để không bị giới hạn bởi quota hệ thống.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div
                      onClick={() => setAiProvider("SYSTEM_QUOTA")}
                      className={`border-2 rounded-xl p-4 cursor-pointer relative transition-all ${
                        aiProvider === "SYSTEM_QUOTA"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {aiProvider === "SYSTEM_QUOTA" && (
                        <div className="absolute top-3 right-3 text-blue-600">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="font-bold text-gray-900 dark:text-white mb-1">System Quota (Mặc định)</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Sử dụng Token trong gói hợp đồng B2B của trường
                      </div>
                    </div>

                    <div
                      onClick={() => setAiProvider("BYOK")}
                      className={`border-2 rounded-xl p-4 cursor-pointer relative transition-all ${
                        aiProvider === "BYOK"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {aiProvider === "BYOK" && (
                        <div className="absolute top-3 right-3 text-blue-600">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="font-bold text-gray-900 dark:text-white mb-1">BYOK (Bring Your Own Key)</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Sử dụng Gemini API Key riêng của nhà trường
                      </div>
                    </div>
                  </div>

                  {aiProvider === "BYOK" && (
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Google Gemini API Key của nhà trường
                      </label>
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder={license?.hasCustomApiKey ? "•••••••••••••••• (Đã cấu hình - Nhập mới để thay đổi)" : "AIzaSy..."}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-400">
                        API Key được lưu trữ bảo mật ở phía server và không bao giờ hiển thị lại trên giao diện.
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-500" /> Mô hình ngôn ngữ đang kích hoạt
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Model mặc định được cấu hình qua Adapter: <span className="font-mono font-bold text-blue-600">{initialData?.aiModel || 'gemini-2.5-flash'}</span>
                  </p>
                </div>
              </div>
            )}

            {/* --- General Tab --- */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin đơn vị trường học</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tên trường học</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" defaultValue={license?.name || "THCS Nguyễn Trãi"} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email hỗ trợ kỹ thuật</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" defaultValue="support@eduai.edu.vn" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngôn ngữ mặc định</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none">
                        <option value="vi">Tiếng Việt (vi)</option>
                        <option value="en">English (en)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- Gamification Tab --- */}
            {activeTab === "gamification" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gamification & Bảng xếp hạng nội bộ trường</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cấu hình cơ chế tích lũy XP và Streak trong phạm vi nhà trường.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Bật Bảng xếp hạng theo Trường</div>
                      <div className="text-sm text-gray-500">Học sinh xem thứ hạng XP trong phạm vi trường học của mình.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Hệ thống Streak học tập</div>
                      <div className="text-sm text-gray-500">Thưởng XP khi học sinh duy trì chuỗi ngày làm bài liên tiếp.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* --- RBAC Tab --- */}
            {activeTab === "rbac" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ma trận phân quyền (RBAC)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phân quyền chuẩn theo mô hình B2B School Provisioning.</p>
                </div>
                
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Quyền hạn</th>
                        <th className="px-4 py-3 font-semibold text-center">School Admin</th>
                        <th className="px-4 py-3 font-semibold text-center">GVCN / GVBM</th>
                        <th className="px-4 py-3 font-semibold text-center">Student</th>
                        <th className="px-4 py-3 font-semibold text-center">Parent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-3 font-medium">Import Excel & Xuất tài khoản trường</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center">GVCN (Lớp mình)</td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-center">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">Tải tài liệu RAG & Duyệt Quiz AI</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-center">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">Hỏi đáp AI RAG có trích dẫn & Làm Quiz</td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">Xem báo cáo học tập của con & Nhắn tin GV</td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
