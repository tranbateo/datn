"use client";

import { Search, Plus, Filter, Calendar, ChevronLeft, ChevronRight, TrendingUp, Users, MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";

import { Student } from '@/types';

export default function AdminStudentsClient({ initialData }: { initialData: Student[] }) {
  const t = useTranslations("Admin.Students");
  const students = initialData || [];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content - Table */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" /> {t('addStudent')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Filter className="w-4 h-4" /> {t('filters')}
              </button>
              <select className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[120px]">
                <option>{t('allGrades')}</option>
                <option>9th Grade</option>
                <option>10th Grade</option>
              </select>
              <select className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[120px]">
                <option>{t('anyStatus')}</option>
                <option>Active</option>
                <option>At Risk</option>
              </select>
              <button className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Calendar className="w-4 h-4" /> {t('registrationDate')}
              </button>
            </div>
            <button className="text-sm font-medium text-primary hover:text-primary-hover px-2">
              {t('clearFilters')}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {students.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu học sinh
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                    <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" /></th>
                    <th className="px-6 py-4">{t('studentName')}</th>
                    <th className="px-6 py-4">{t('grade')}</th>
                    <th className="px-6 py-4">{t('lastActivity')}</th>
                    <th className="px-6 py-4">{t('progress')}</th>
                    <th className="px-6 py-4">{t('status')}</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-card-border">
                  {students.map((student: Student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                            {student.fullName ? student.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{student.fullName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{student.grade || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(student.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden min-w-[80px]">
                            <div 
                              className={`h-full rounded-full bg-emerald-500`} 
                              style={{ width: `${student.gamificationProfile?.level || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{student.gamificationProfile?.level || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          student.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 
                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>{t('showing')}</div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-medium shadow-sm">1</button>
              <button className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Quick Stats */}
      <div className="w-full lg:w-72 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('quickStats')}</h3>
        
        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Students</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{students.length}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('newThisWeek')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
        </div>
      </div>
    </div>
  );
}
