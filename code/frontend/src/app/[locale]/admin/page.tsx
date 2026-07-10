"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Users, GraduationCap, BookOpen, DollarSign, MoreVertical } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslations } from "next-intl";

const dailyActiveData = [
  { name: '10:00', value: 2400 },
  { name: '10:15', value: 1398 },
  { name: '10:30', value: 9800 },
  { name: '10:45', value: 3908 },
  { name: '11:00', value: 4800 },
  { name: '11:15', value: 3800 },
  { name: '11:30', value: 4300 },
];

export default function AdminDashboard() {
  const t = useTranslations("Admin.Dashboard");

  const pieData = [
    { name: t('completed'), value: 68, color: '#10B981' },
    { name: t('inProgress'), value: 24, color: '#6366F1' },
    { name: t('dropped'), value: 8, color: '#E5E7EB' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('overview')}</h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-500 dark:text-gray-400">{t('welcome')}</p>
          <div className="bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-medium">
            {t('last30Days')}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
              ↗ 12.5%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">{t('totalStudents')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">12.4k</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
              ↗ 4.2%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">{t('activeTeachers')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">450</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
              ↗ 8.1%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">{t('totalLessons')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">1.2k</h3>
        </div>

        <div className="bg-orange-50/50 dark:bg-card-bg rounded-2xl p-6 border border-orange-100 dark:border-card-border shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full flex items-center gap-1">
              ↗ 18.2%
            </span>
          </div>
          <p className="text-sm text-orange-900/70 dark:text-gray-400 font-medium mb-1 uppercase tracking-wider">{t('monthlyCost')}</p>
          <h3 className="text-3xl font-bold text-orange-950 dark:text-white">$1.4k</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dailyActive')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('engagementTrend')}</p>
            </div>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActiveData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg, #fff)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#4F46E5', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('recentActivity')}</h3>
            <span className="text-sm text-primary font-medium cursor-pointer">{t('viewAll')}</span>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
            {/* Activity Item */}
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-white dark:ring-card-bg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New Teacher Registered</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sarah Jenkins joined the platform.</p>
                <span className="text-xs text-gray-400 mt-1 block">10 mins ago</span>
              </div>
            </div>
            
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-white dark:ring-card-bg">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Course Published</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Physics 101 is now live.</p>
                <span className="text-xs text-gray-400 mt-1 block">45 mins ago</span>
              </div>
            </div>

            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-white dark:ring-card-bg">
                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">AI Model Latency Spike</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gemini-Pro response times exceeded 2s.</p>
                <span className="text-xs text-gray-400 mt-1 block">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Bottom left chart */}
         <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('tokenUsage')}</h3>
            <div className="h-[200px] w-full flex items-end gap-8 px-4">
              <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 h-[40%] rounded-t-lg relative group">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded">2.4M</div>
              </div>
              <div className="flex-1 bg-indigo-500 dark:bg-indigo-600 h-[80%] rounded-t-lg relative group">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded">5.1M</div>
              </div>
              <div className="flex-1 bg-purple-100 dark:bg-purple-900/30 h-[60%] rounded-t-lg relative group">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded">3.2M</div>
              </div>
              <div className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 h-[30%] rounded-t-lg relative group">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded">1.1M</div>
              </div>
            </div>
            <div className="flex justify-between px-4 mt-4 text-xs font-medium text-gray-500">
              <span>GPT-4</span>
              <span>Claude</span>
              <span>Gemini</span>
              <span>Llama</span>
            </div>
         </div>

         {/* Bottom right chart */}
         <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm flex items-center justify-between">
            <div className="max-w-[200px]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('completionRate')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('overallMetrics')}</p>
              
              <div className="space-y-3">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="w-[200px] h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">92%</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{t('retention')}</span>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
