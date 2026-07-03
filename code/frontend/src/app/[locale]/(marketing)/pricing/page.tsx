"use client";
import { useState } from "react";
import { Check } from "lucide-react";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="w-full bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Bảng giá linh hoạt cho mọi nhu cầu</h1>
        <p className="text-lg text-gray-600 mb-12">
          Chọn gói phù hợp nhất với hành trình học tập của bạn. Bắt đầu miễn phí, nâng cấp khi cần thiết.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center p-1 bg-gray-100 rounded-full mb-16 relative">
          <div 
            className={`absolute inset-y-1 left-1 w-1/2 bg-primary rounded-full transition-transform duration-300 ${isAnnual ? 'translate-x-[calc(100%-8px)]' : 'translate-x-0'}`}
          />
          <button 
            onClick={() => setIsAnnual(false)}
            className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-gray-600'}`}
          >
            Tháng
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-gray-600'}`}
          >
            Năm <span className={isAnnual ? 'text-blue-100' : 'text-gray-400'}>(Tiết kiệm 20%)</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          {/* Basic */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cơ bản</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">Miễn phí</span>
              <span className="text-gray-500">/tháng</span>
            </div>
            <p className="text-gray-600 text-sm mb-8 h-10">Dành cho học sinh muốn trải nghiệm công cụ cơ bản.</p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Core AI chat (limited)</li>
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Manual schedule</li>
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Basic progress</li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-blue-50 text-primary font-medium hover:bg-blue-100 transition-colors">
              Bắt đầu ngay
            </button>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl border-2 border-primary p-8 relative flex flex-col shadow-xl scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              PHỔ BIẾN NHẤT
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">{isAnnual ? '159.000đ' : '199.000đ'}</span>
              <span className="text-gray-500">/tháng</span>
            </div>
            <p className="text-gray-600 text-sm mb-8 h-10">Mở khóa toàn bộ sức mạnh AI để tăng tốc độ học tập.</p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Unlimited AI</li>
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> OCR Scan</li>
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Advanced Analytics</li>
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Gamification</li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-md shadow-primary/30">
              Nâng cấp Pro
            </button>
          </div>

          {/* School */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Trường học</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">Liên hệ</span>
              <span className="text-gray-500">/tùy chọn</span>
            </div>
            <p className="text-gray-600 text-sm mb-8 h-10">Giải pháp toàn diện cho giáo viên và nhà trường.</p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Custom dashboard</li>
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Teacher controls</li>
              <li className="flex items-center gap-3 text-sm text-gray-700"><Check className="w-5 h-5 text-primary" /> Bulk licenses</li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 border border-gray-200 transition-colors">
              Liên hệ Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
