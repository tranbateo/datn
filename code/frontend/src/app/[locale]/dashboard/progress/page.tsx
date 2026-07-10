"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Clock, CheckCircle, TrendingUp, Search, Bell, Trophy, Zap, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useTranslations } from "next-intl";

export default function ProgressPage() {
  const t = useTranslations("User.Progress");

  const lineData = [
    { name: t('week'), value: 2 },
    { name: t('week'), value: 4 },
    { name: t('week'), value: 3 },
    { name: t('week'), value: 6 },
    { name: t('week'), value: 5 },
    { name: t('week'), value: 8 },
    { name: t('week'), value: 7 },
  ];
  // the names should be short, like mon, tue, etc. but I'll leave as T2... actually, I'll translate them
  const lineDataTranslated = [
    { name: 'T2', value: 2 },
    { name: 'T3', value: 4 },
    { name: 'T4', value: 3 },
    { name: 'T5', value: 6 },
    { name: 'T6', value: 5 },
    { name: 'T7', value: 8 },
    { name: 'CN', value: 7 },
  ];

  const radarData = [
    { subject: t('logic'), A: 120, fullMark: 150 },
    { subject: t('algebra'), A: 98, fullMark: 150 },
    { subject: t('geometry'), A: 86, fullMark: 150 },
    { subject: t('theory'), A: 99, fullMark: 150 },
    { subject: t('application'), A: 85, fullMark: 150 },
    { subject: t('speed'), A: 65, fullMark: 150 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('search')} 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-card-bg border border-gray-100 dark:border-card-border rounded-full text-sm outline-none shadow-sm dark:text-white"
            />
          </div>
          <button className="p-2 bg-white dark:bg-card-bg border border-gray-100 dark:border-card-border rounded-full text-gray-500 shadow-sm relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-card-bg"></span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card-bg p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('studyTime')}</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">42</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('hours')}</span>
            </div>
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {t('upVsLastWeek')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('completedExercises')}</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">156</span>
            </div>
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {t('newExercises')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm flex items-center gap-6">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
                className="dark:stroke-gray-800"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeDasharray="75, 100"
                className="drop-shadow-sm"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">75%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white">{t('weeklyGoal')}</h3>
              <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{t('inProgress')}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{t('goalDesc')}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-card-bg p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('learningTrend')}</h2>
            <div className="flex gap-1 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg">
              <button className="px-3 py-1 bg-white dark:bg-gray-700 text-blue-600 dark:text-white text-xs font-semibold rounded-md shadow-sm">{t('week')}</button>
              <button className="px-3 py-1 text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-gray-900 dark:hover:text-white">{t('month')}</button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineDataTranslated} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#93C5FD', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#fff', stroke: '#3B82F6', strokeWidth: 2 }} 
                  activeDot={{ r: 8, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white dark:bg-card-bg p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">{t('skillAnalysis')}</h2>
          <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Kỹ năng" dataKey="A" stroke="#0D9488" strokeWidth={2} fill="#14B8A6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Achievements Banner */}
      <div className="bg-white dark:bg-card-bg p-6 rounded-3xl border border-gray-100 dark:border-card-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('recentAchievements')}</h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">{t('viewAll')}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{t('streakTitle')}</h4>
              <p className="text-xs text-gray-500">{t('streakDesc')}</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{t('masterTitle')}</h4>
              <p className="text-xs text-gray-500">{t('masterDesc')}</p>
            </div>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{t('fastTitle')}</h4>
              <p className="text-xs text-gray-500">{t('fastDesc')}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
