"use client";
 
 

import { Search, CheckCircle2, XCircle, Eye, Clock, Check } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function AdminFeedbackClient({ initialData }: { initialData: any[] }) {
  const t = useTranslations("Admin.Feedback");
  const [activeStatus, setActiveStatus] = useState("all");
  const [mockFeedback] = useState<any[]>(initialData.length > 0 ? initialData : []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <button 
              onClick={() => setActiveStatus('all')}
              className={`px-4 py-1.5 rounded-full transition-colors ${activeStatus === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {t('allStatuses')}
            </button>
            <button 
              onClick={() => setActiveStatus('pending')}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${activeStatus === 'pending' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <Clock className="w-3.5 h-3.5"/> {t('pending')}
            </button>
            <button 
              onClick={() => setActiveStatus('resolved')}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${activeStatus === 'resolved' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5"/> {t('resolved')}
            </button>
            <button 
              onClick={() => setActiveStatus('ignored')}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${activeStatus === 'ignored' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <XCircle className="w-3.5 h-3.5"/> {t('ignored')}
            </button>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {mockFeedback.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Chưa có dữ liệu phản hồi
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs w-48">{t('user')}</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs w-32">{t('category')}</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('reportContent')}</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs w-32 text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs w-40">{t('date')}</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs w-32 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {mockFeedback.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {item.user?.fullName?.charAt(0) || item.user?.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white block">{item.user?.fullName || item.user?.email}</span>
                          <span className="text-xs text-gray-500">{item.user?.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        item.category === 'AI_ERROR' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        item.category === 'CONTENT_ERROR' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.category === 'AI_ERROR' && 'Lỗi AI'}
                        {item.category === 'CONTENT_ERROR' && 'Lỗi nội dung'}
                        {item.category === 'SYSTEM_BUG' && 'Lỗi hệ thống'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{item.content}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.status === 'PENDING' && <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5"/> {t('pending')}</div>}
                      {item.status === 'RESOLVED' && <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5"/> {t('resolved')}</div>}
                      {item.status === 'IGNORED' && <div className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full"><XCircle className="w-3.5 h-3.5"/> {t('ignored')}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.status === 'PENDING' && (
                          <>
                            <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors tooltip" title="Mark as Resolved">
                              <Check className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors tooltip" title="Ignore">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors tooltip" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
