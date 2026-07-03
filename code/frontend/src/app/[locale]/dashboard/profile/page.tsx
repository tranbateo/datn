"use client";

import { Trophy, Medal, Star, Flame, Target, Lock, Crown, CheckSquare } from "lucide-react";
import Image from "next/image";

export default function LeaderboardProfile() {
  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">Bảng Xếp Hạng &</h1>
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Thành Tích</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Vượt qua giới hạn, chinh phục đỉnh cao!</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-blue-50 dark:bg-gray-800 p-1 rounded-full w-48 mx-auto">
        <button className="flex-1 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-sm">Toàn Cầu</button>
        <button className="flex-1 py-1.5 text-gray-500 dark:text-gray-400 rounded-full text-xs font-bold hover:text-indigo-600">Bạn bè</button>
      </div>

      {/* Top 3 Podium */}
      <div className="flex justify-center items-end h-48 gap-3 mt-8">
        {/* Top 2 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnh" className="w-12 h-12 rounded-full border-2 border-gray-200" />
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm border border-white">2</div>
          </div>
          <div className="text-[10px] font-bold text-gray-900 dark:text-white">Lan Anh</div>
          <div className="text-[8px] text-gray-500 flex items-center gap-0.5"><Star className="w-2 h-2 text-amber-500" fill="currentColor" /> 12.4k XP</div>
          <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-2"></div>
        </div>

        {/* Top 1 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <Crown className="w-6 h-6 text-amber-500 absolute -top-5 left-1/2 -translate-x-1/2 z-10" fill="currentColor" />
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Quan" className="w-14 h-14 rounded-full border-2 border-amber-400 ring-2 ring-amber-100" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-white">1</div>
          </div>
          <div className="text-[10px] font-bold text-gray-900 dark:text-white">Minh Quân</div>
          <div className="text-[8px] text-gray-500 flex items-center gap-0.5"><Star className="w-2 h-2 text-amber-500" fill="currentColor" /> 15.2k XP</div>
          <div className="w-20 h-28 bg-amber-400 dark:bg-amber-500 rounded-t-lg mt-2"></div>
        </div>

        {/* Top 3 */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=BaoNam" className="w-12 h-12 rounded-full border-2 border-amber-700/50" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-700/50 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-white">3</div>
          </div>
          <div className="text-[10px] font-bold text-gray-900 dark:text-white">Bảo Nam</div>
          <div className="text-[8px] text-gray-500 flex items-center gap-0.5"><Star className="w-2 h-2 text-amber-500" fill="currentColor" /> 11.8k XP</div>
          <div className="w-16 h-16 bg-amber-700/50 dark:bg-amber-900/60 rounded-t-lg mt-2"></div>
        </div>
      </div>

      {/* List Xếp Hạng */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-gray-900 dark:text-white">Xếp Hạng Học Viên</h2>
          <span className="text-[10px] text-gray-400">Tháng Này</span>
        </div>

        <div className="space-y-3">
          {/* Rank 4 */}
          <div className="flex items-center gap-3">
            <div className="w-4 text-center text-xs font-bold text-gray-500">4</div>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ha" className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white">Thu Hà</div>
              <div className="text-[10px] text-gray-500">Hạng Kim Cương • 14 ngày chuỗi</div>
            </div>
            <div className="text-xs font-bold text-indigo-600">10.5k XP</div>
          </div>

          {/* Rank 5 (You) */}
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-2 -mx-2 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <div className="w-4 text-center text-xs font-bold text-blue-600">5</div>
            <div className="relative">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Minh" className="w-8 h-8 rounded-full border-2 border-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-400">Minh Nguyen (Bạn)</div>
              <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Hạng Bạch Kim • 12 ngày chuỗi</div>
            </div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400">9.8k XP</div>
          </div>

          {/* Rank 6 */}
          <div className="flex items-center gap-3">
            <div className="w-4 text-center text-xs font-bold text-gray-500">6</div>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Phat" className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white">Đức Phát</div>
              <div className="text-[10px] text-gray-500">Hạng Vàng • 3 ngày chuỗi</div>
            </div>
            <div className="text-xs font-bold text-indigo-600">9.2k XP</div>
          </div>
        </div>

        <button className="w-full mt-4 py-2 bg-gray-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Xem tất cả
        </button>
      </div>

      {/* Badges / Thành tích */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Thành Tích Của Bạn</h2>
            <p className="text-[10px] text-gray-500 mt-1">Tiến độ cấp độ tiếp theo</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">12/20 Huy Hiệu</span>
            <div className="text-[10px] font-bold text-gray-500 mt-1">200 XP</div>
          </div>
        </div>
        
        {/* Progress bar for level */}
        <div className="w-full h-1.5 bg-blue-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-indigo-600 rounded-full" style={{ width: '80%' }}></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Badge 1 */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-xs mb-1">Chuyên gia<br/>Giải toán</h4>
            <p className="text-[9px] text-gray-500">Giải 50 bài Toán</p>
          </div>

          {/* Badge 2 */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-purple-100 dark:border-purple-900/30 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-purple-600 mb-3">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-xs mb-1">7 ngày<br/>chuyên cần</h4>
            <p className="text-[9px] text-gray-500">Học liên tục 7 ngày</p>
          </div>

          {/* Locked Badge 1 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center opacity-70">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-400 mb-3 relative">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs mb-1">Cú đêm</h4>
            <p className="text-[9px] text-gray-500">Học sau 10h tối</p>
          </div>

          {/* Locked Badge 2 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center opacity-70">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 mb-3 relative">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs mb-1">Bậc thầy Ngữ pháp</h4>
            <p className="text-[9px] text-gray-500">100% bài tập Tiếng Anh</p>
          </div>
        </div>

        <button className="w-full mt-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Xem tất cả huy hiệu
        </button>
      </div>

      {/* Mission Banner */}
      <div className="bg-indigo-600 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg">
        {/* Background star */}
        <Star className="absolute -right-6 -bottom-6 w-32 h-32 text-indigo-500 opacity-50" fill="currentColor" />
        
        <div className="relative z-10">
          <h3 className="font-bold text-sm mb-3">Nhiệm vụ hôm nay</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight mb-0.5">Hoàn thành 1 bài kiểm tra</h4>
              <div className="text-[10px] font-bold text-indigo-200">+50 XP</div>
            </div>
          </div>
          <button className="w-full bg-white text-indigo-600 font-bold text-sm py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
            Làm ngay
          </button>
        </div>
      </div>

    </div>
  );
}
