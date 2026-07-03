"use client";

import { Search, Play, Trophy, CheckCircle2, ChevronRight, BookOpen, PenTool, Beaker, Globe, Calculator, History, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

export default function PracticePage() {
  const t = useTranslations("User.Practice");
  const tHist = useTranslations("User.QuizHistory");
  const router = useRouter();

  const subjects = [
    { name: t('math'), icon: Calculator, color: "bg-blue-100 text-blue-600" },
    { name: t('physics'), icon: PenTool, color: "bg-purple-100 text-purple-600" },
    { name: t('chemistry'), icon: Beaker, color: "bg-amber-100 text-amber-600" },
    { name: t('english'), icon: Globe, color: "bg-rose-100 text-rose-600" },
    { name: t('literature'), icon: BookOpen, color: "bg-indigo-100 text-indigo-600" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder={t('search')} 
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-card-bg border border-gray-100 dark:border-card-border rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm dark:text-white"
        />
      </div>

      {/* Subjects */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('subjects')}</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {subjects.map((subject, idx) => {
            const Icon = subject.icon;
            return (
              <button key={idx} className="flex flex-col items-center gap-2 min-w-[72px]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${subject.color} shadow-sm transition-transform hover:scale-105`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{subject.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Today's Practice */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('todayPractice')}</h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">{t('viewAll')}</button>
        </div>
        
        <div className="space-y-4">
          {[
            { tag: t('algebra'), title: t('logTitle'), desc: t('logDesc'), count: t('qCount1'), color: "bg-blue-50 text-blue-600" },
            { tag: t('physics'), title: t('mechTitle'), desc: t('mechDesc'), count: t('qCount2'), color: "bg-purple-50 text-purple-600" },
            { tag: t('english'), title: t('readingTitle'), desc: t('readingDesc'), count: t('qCount3'), color: "bg-rose-50 text-rose-600" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-card-bg p-5 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm flex items-center justify-between group hover:border-blue-100 dark:hover:border-blue-900/50 transition-colors">
              <div>
                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${item.color}`}>
                  {item.tag}
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{item.desc}</p>
                <p className="text-xs font-medium text-gray-400">{item.count}</p>
              </div>
              <button className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                <Play className="w-5 h-5 ml-1" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment / Mock Tests */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('assessment')}</h2>
        
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden mb-4">
          {/* Decorative shapes */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute right-10 bottom-10 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">{t('mockExam')}</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{t('mockTitle')}</h3>
            <p className="text-indigo-100 text-sm mb-6">{t('mockDesc')}</p>
            <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all w-full sm:w-auto">
              {t('startMock')}
            </button>
          </div>
          
          <GraduationCapIcon className="absolute -right-4 bottom-0 w-32 h-32 text-white/10" />
        </div>

        <button className="w-full bg-white dark:bg-card-bg p-4 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('repository')}</h4>
              <p className="text-xs text-gray-500">{t('repoDesc')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Quiz History */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          {tHist('title')}
        </h2>
        
        <div className="space-y-3">
          {[
            { title: "Đạo hàm và Ứng dụng", date: "Hôm qua", score: "8/10", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
            { title: "Bài kiểm tra Sinh học 11", date: "12/10/2023", score: "5/10", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
            { title: "Luyện thi IELTS Reading", date: "10/10/2023", score: "9/10", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
          ].map((hist, idx) => (
            <div key={idx} className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{hist.title}</h3>
                <p className="text-xs text-gray-500">{tHist('date')}: {hist.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-xl font-bold text-sm ${hist.color}`}>
                  {hist.score}
                </div>
                <button 
                  onClick={() => router.push('/dashboard/quiz/1/result')}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                  title={tHist('review')}
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('recentAchievements')}</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-400">
            <Trophy className="w-4 h-4 text-amber-500" />
            {t('ach1')}
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 px-4 py-2 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-400">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            {t('ach2')}
          </div>
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50 px-4 py-2 rounded-xl text-sm font-medium text-purple-700 dark:text-purple-400">
            <Trophy className="w-4 h-4 text-purple-500" />
            {t('ach3')}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Graduation Cap SVG component for the decorative background
function GraduationCapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z" />
    </svg>
  )
}
