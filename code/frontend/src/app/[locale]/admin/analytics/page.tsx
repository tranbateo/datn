"use client";

import { Database, HardDrive, Zap, Info, MoreVertical } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useTranslations } from "next-intl";

const dbLoadData = [
  { time: '1', queries: 20 },
  { time: '2', queries: 35 },
  { time: '3', queries: 25 },
  { time: '4', queries: 40 },
  { time: '5', queries: 38 },
  { time: '6', queries: 42 },
];

const scatterData = [
  { x: 10, y: 30, z: 200, subject: 'STEM' },
  { x: 12, y: 40, z: 100, subject: 'Arts' },
  { x: 15, y: 35, z: 150, subject: 'STEM' },
  { x: 20, y: 50, z: 250, subject: 'STEM' },
  { x: 22, y: 20, z: 80, subject: 'Arts' },
];

export default function AnalyticsPage() {
  const t = useTranslations("Admin.Analytics");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button className="px-4 py-1.5 bg-white dark:bg-gray-700 shadow-sm rounded-md text-sm font-medium text-gray-900 dark:text-white">24h</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">7d</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">30d</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Storage */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between h-40">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
              <HardDrive className="w-4 h-4" /> {t('storageCapacity')}
            </div>
            <Info className="w-4 h-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" />
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">8.5</span>
              <span className="text-sm font-medium text-gray-500">/ 10 TB</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-xs text-red-500 mt-2 font-medium text-center">85% utilized - Warning</p>
          </div>
        </div>

        {/* Database Load */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              <Database className="w-4 h-4" /> {t('dbLoad')}
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full flex items-center gap-1">
              ↑ 12%
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">42</span>
              </div>
              <p className="text-sm font-medium text-gray-500">avg queries/s</p>
            </div>
            <div className="w-24 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dbLoadData}>
                  <Bar dataKey="queries" radius={[2, 2, 0, 0]}>
                    {dbLoadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === dbLoadData.length - 1 ? '#8B5CF6' : '#C4B5FD'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Zap className="w-4 h-4" /> {t('cacheHitRate')}
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full flex items-center gap-1">
              ↑ 2.4%
            </span>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">94.8%</div>
            <p className="text-sm font-medium text-gray-500">Optimal performance range.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap (Simulated with grid) */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('userActivity')}</h3>
            <button className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-separate border-spacing-1">
              <thead>
                <tr className="text-xs text-gray-500 font-medium">
                  <th className="font-normal pb-2 text-left w-12"></th>
                  <th className="font-normal pb-2">0-4h</th>
                  <th className="font-normal pb-2">4-8h</th>
                  <th className="font-normal pb-2">8-12h</th>
                  <th className="font-normal pb-2">12-16h</th>
                  <th className="font-normal pb-2">16-20h</th>
                  <th className="font-normal pb-2">20-24h</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-500 font-medium">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <tr key={day}>
                    <td className="text-left py-1.5">{day}</td>
                    {[0.2, 0.4, 0.8, 1, 0.7, 0.3].map((val, i) => (
                      <td key={i}>
                        <div 
                          className="h-8 rounded cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                          style={{ backgroundColor: `rgba(79, 70, 229, ${val})` }}
                          title={`Activity level: ${val * 100}%`}
                        ></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scatter Chart */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('subjectEngagement')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active users per module</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> STEM
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Arts
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" dataKey="x" name="Duration" unit="h" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis type="number" dataKey="y" name="Users" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <ZAxis type="number" dataKey="z" range={[60, 400]} name="Score" />
                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Scatter name="STEM" data={scatterData.filter(d => d.subject === 'STEM')} fill="#4F46E5" fillOpacity={0.6} />
                <Scatter name="Arts" data={scatterData.filter(d => d.subject === 'Arts')} fill="#FB7185" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
