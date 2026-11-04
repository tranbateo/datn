"use client";

/* eslint-disable react/no-unescaped-entities */

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, Bell, Play, FileText, Activity } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export default function LessonDetailPage() {
  const t = useTranslations("User.Lesson");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"content" | "exercises">("content");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] md:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-card-bg md:rounded-3xl shadow-sm border-x md:border border-gray-100 dark:border-card-border overflow-hidden flex flex-col h-screen md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between z-10 bg-white/80 dark:bg-card-bg/80 backdrop-blur-md sticky top-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> AI Tutor
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="w-full aspect-video bg-gray-900 relative group">
          <Image
            src="https://images.unsplash.com/photo-1632559648398-0cfa0b32252a?auto=format&fit=crop&q=80&w=800&h=450"
            alt="Video Thumbnail"
            fill
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" />
            </button>
          </div>
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
            12:45
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 pb-24">
            {/* Title Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Toán học
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                <span>Bài giảng chuẩn</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{t("title")}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t("desc")}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 mb-6">
              <button
                onClick={() => setActiveTab("content")}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === "content"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {t("tabContent")}
              </button>
              <button
                onClick={() => setActiveTab("exercises")}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "exercises"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {t("tabExercises")}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "content" && (
              <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
                <section>
                  <h2 className="font-bold text-base text-gray-900 dark:text-white mb-2">{t("heading1")}</h2>
                  <p className="leading-relaxed mb-4">{t("para1")}</p>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> {t("defTitle")}
                    </h3>
                    <p className="leading-relaxed text-blue-700 dark:text-blue-400 mb-4">{t("defPara")}</p>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "exercises" && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-16 h-16 text-gray-200 dark:text-gray-800 mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Bài tập thực hành</h3>
                <p className="text-sm text-gray-500 max-w-[240px] mb-6">
                  Chuyển đến danh sách đề kiểm tra và bài tập luyện tập của lớp học.
                </p>
                <button
                  onClick={() => router.push("/dashboard/practice")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors"
                >
                  {t("doExercisesNow")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Button (Bottom) */}
        <div className="p-4 bg-white dark:bg-card-bg border-t border-gray-100 dark:border-card-border mt-auto">
          <button
            onClick={() => router.push("/dashboard/practice")}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" /> {t("doExercisesNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
