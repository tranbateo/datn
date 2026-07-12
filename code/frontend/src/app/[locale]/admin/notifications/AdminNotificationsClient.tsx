"use client";
 

import { Send, CheckCircle2, Clock, Users, Search, AlertCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminNotificationsClient({ initialData }: { initialData: Record<string, unknown>[] }) {
  const t = useTranslations("Admin.Notifications");
  const notifications = initialData || [];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-400 shadow-sm"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Notification Form */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" /> {t('createNotification')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('messageTitle')}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('messageContent')}</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Nhập nội dung..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Loại</label>
                  <select className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('target')}</label>
                  <select className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500">
                    <option value="all">Tất cả</option>
                    <option value="grade10">Khối 10</option>
                    <option value="grade11">Khối 11</option>
                    <option value="grade12">Khối 12</option>
                  </select>
                </div>
              </div>

              <button className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                <Send className="w-4 h-4" /> Gửi thông báo
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sent Notifications Table */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('subtitle')}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm flex flex-col min-h-[500px]">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <button className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">{t('allTypes')}</button>
                <button className="px-4 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"><Info className="w-3.5 h-3.5"/> {t('info')}</button>
                <button className="px-4 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {t('warning')}</button>
                <button className="px-4 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> {t('success')}</button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Chưa có thông báo nào
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Loại</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('messageTitle')} & {t('messageContent')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('target')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('readCount')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('sentAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {notifications.map((notif: Record<string, unknown>) => (
                      <tr key={notif.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><Info className="w-4 h-4 text-blue-500" /></div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{notif.message}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit">
                            <Users className="w-3.5 h-3.5" /> <span className="text-xs font-medium">Tất cả</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                          0
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {new Date(notif.createdAt).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
