"use client";
 
 

import { Cpu, Filter, Settings } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslations } from "next-intl";

export default function AdminAiModelsClient({ initialData }: { initialData: any[] }) {
  const t = useTranslations("Admin.AIModels");
  const requestVolumeData = initialData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border border-emerald-100 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {t('allSystemsOperational')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gemini Card */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <BotIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Gemini 1.5 Pro</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Google Core</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-50 dark:bg-gray-900/30 px-2 py-1 rounded-full">
              N/A
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">{t('avgLatency')}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
                <span className="text-sm text-gray-500">ms</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">{t('costPer1k')}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</span>
                <span className="text-sm text-gray-500">{t('avg')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claude Card */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <BotIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Claude 3.5 Sonnet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Anthropic</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-50 dark:bg-gray-900/30 px-2 py-1 rounded-full">
              N/A
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Avg Latency</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
                <span className="text-sm text-gray-500">ms</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Cost / 1k</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</span>
                <span className="text-sm text-gray-500">avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* GPT-4o Card */}
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">GPT-4o</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">OpenAI</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-50 dark:bg-gray-900/30 px-2 py-1 rounded-full">
              N/A
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Avg Latency</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
                <span className="text-sm text-gray-500">ms</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Cost / 1k</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</span>
                <span className="text-sm text-gray-500">avg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('requestVolumeTitle')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('requestVolumeSubtitle')}</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button className="px-3 py-1 bg-white dark:bg-gray-700 shadow-sm rounded-md text-sm font-medium text-gray-900 dark:text-white">{t('live')}</button>
              <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">{t('24h')}</button>
              <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">{t('7d')}</button>
            </div>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            {requestVolumeData.length === 0 ? "Chưa có dữ liệu" : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={requestVolumeData}>
                  <defs>
                    <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClaude" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg, #fff)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="Gemini" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorGemini)" />
                  <Area type="monotone" dataKey="Claude" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorClaude)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Routing Rules */}
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('routingRulesTitle')}</h3>
            <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border border-gray-100 dark:border-card-border rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('mathQueries')}</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{t('routeToDeepSeek')}</span>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
              </div>
            </div>

            <div className="p-4 border border-gray-100 dark:border-card-border rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('creativeWriting')}</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{t('routeToClaude')}</span>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
              </div>
            </div>

            <div className="p-4 border border-gray-100 dark:border-card-border rounded-xl flex items-center justify-between opacity-75">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('generalQA')}</h4>
                <span className="text-sm text-gray-500">{t('default')}</span>
              </div>
              <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-card-border flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('logsTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('logsSubtitle')}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" /> {t('filter')}
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/20 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-card-border">
              <th className="px-6 py-4">Ngày (Date)</th>
              <th className="px-6 py-4">Người dùng</th>
              <th className="px-6 py-4">Mô hình (Model)</th>
              <th className="px-6 py-4">Số tin nhắn</th>
              <th className="px-6 py-4">Tokens Used</th>
              <th className="px-6 py-4">Ước tính phí</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-card-border">
            {initialData && initialData.length > 0 ? (
              initialData.map((usage: any) => (
                <tr key={usage.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    {new Date(usage.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>{usage.user?.fullName}</div>
                    <div className="text-xs text-gray-400">{usage.user?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                      Gemini 1.5 Pro
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {usage.messageCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {usage.tokensUsed.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    ${Number(usage.estimatedCost).toFixed(4)}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">{t('emptyLogs')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BotIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
