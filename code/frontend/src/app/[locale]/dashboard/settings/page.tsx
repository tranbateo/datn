"use client";

import { APP_ROUTES } from '@/constants/routes';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

import { Menu, Bell, Camera, ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { usersService, UserProfile } from "@/services/users.service";

export default function SettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(1);

  useEffect(() => {
    usersService.getProfile().then(data => {
      setProfile(data);
      if (data.name) setName(data.name);
      if (data.grade) setGrade(data.grade);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersService.updateProfile({ name, grade: Number(grade) });
      alert("Cập nhật thông tin thành công!");
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 animate-in fade-in duration-500">
      
      {/* Mobile Top Header */}
      <div className="bg-white dark:bg-gray-900 px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 md:hidden">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.DASHBOARD} className="p-1 -ml-1 text-indigo-600 dark:text-indigo-400">
            <Menu className="w-6 h-6" />
          </Link>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">Cài đặt</span>
        </div>
        <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 mb-6">
           <Link href={APP_ROUTES.DASHBOARD} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
             <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
           </Link>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt chi tiết</h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Hồ sơ cá nhân</h2>
              
              <div className="mb-6 relative w-20 h-20">
                <img src={profile?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Minh"} alt="Avatar" className="w-full h-full rounded-full border-2 border-indigo-100 dark:border-indigo-900 bg-gray-100" />
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-gray-900 shadow-sm hover:bg-indigo-700 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">Họ và tên</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">Lớp / Cấp độ</label>
                  <select 
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all dark:text-white bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[position:right_12px_center] bg-no-repeat pr-10"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>Lớp {i+1}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-bold text-gray-900 dark:text-white">Thông báo</h2>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Thông báo đẩy (Push)</span>
                  <button 
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${pushEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email tổng hợp</span>
                  <button 
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${emailEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm mt-4"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lưu thay đổi"}
            </button>
          </>
        )}
      </div>

    </div>
  );
}

