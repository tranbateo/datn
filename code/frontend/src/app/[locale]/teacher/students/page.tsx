"use client";

import { Search, Plus, Filter, Calendar, ChevronLeft, ChevronRight, TrendingUp, Users, AlertTriangle, MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";

const students = [
  { id: 1, name: "Emma Smith", email: "emma.s@student.edu", initials: "ES", grade: "10th Grade", lastActivity: "2 hours ago", progress: 85, status: "Active", color: "bg-indigo-500" },
  { id: 2, name: "Liam Johnson", email: "liam.j@student.edu", initials: "LJ", grade: "11th Grade", lastActivity: "Yesterday", progress: 42, status: "At Risk", color: "bg-purple-500" },
  { id: 3, name: "Olivia Davis", email: "olivia.d@student.edu", initials: "OD", grade: "9th Grade", lastActivity: "Just now", progress: 95, status: "Active", color: "bg-amber-600" },
  { id: 4, name: "Mason Wilson", email: "mason.w@student.edu", initials: "MW", grade: "12th Grade", lastActivity: "2 weeks ago", progress: 15, status: "Inactive", color: "bg-blue-300" },
  { id: 5, name: "Sophia Martinez", email: "sophia.m@student.edu", initials: "SM", grade: "10th Grade", lastActivity: "5 hours ago", progress: 78, status: "Active", color: "bg-rose-500" },
  { id: 6, name: "James Anderson", email: "james.a@student.edu", initials: "JA", grade: "11th Grade", lastActivity: "3 days ago", progress: 60, status: "Active", color: "bg-teal-500" },
];

export default function TeacherStudentsPage() {
  const t = useTranslations("Teacher.Students");

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
                placeholder={t('search')}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Filter className="w-4 h-4" /> Filter
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
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${student.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                          {student.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{student.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{student.grade}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{student.lastActivity}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden min-w-[80px]">
                          <div 
                            className={`h-full rounded-full ${student.progress > 80 ? 'bg-emerald-500' : student.progress > 40 ? 'bg-amber-500' : 'bg-gray-400'}`} 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 
                        student.status === 'At Risk' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50' : 
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                      }`}>
                        {student.status}
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
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>{t('showing')}</div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-medium shadow-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">3</button>
              <span className="px-1">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">125</button>
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
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full flex items-center gap-1">
              ↗ 12%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('activeToday')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">842</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('newThisWeek')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">45</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-red-100 dark:border-red-900/30 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-bl-full -z-10"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full flex items-center gap-1">
              ↗ 2%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('studentsAtRisk')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">18</h3>
          <a href="#" className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
            {t('viewActionPlan')}
          </a>
        </div>
      </div>
    </div>
  );
}
