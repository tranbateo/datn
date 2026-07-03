"use client";

import { Search, Mail, Trash2, Plus, Download, MoreVertical, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const teachers = [
  {
    id: "TCH-8092",
    name: "Dr. Sarah Jenkins",
    department: "Computer Science",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    courses: ["CS101", "AI400"],
    rating: 4.8,
    status: "Active",
  },
  {
    id: "TCH-5510",
    name: "Marcus Rivera",
    department: "Mathematics",
    avatar: "https://i.pravatar.cc/150?u=marcus",
    courses: ["CALC2"],
    rating: 4.2,
    status: "On Leave",
  },
  {
    id: "TCH-1102",
    name: "Prof. Alistair Vance",
    department: "Literature",
    avatar: "https://i.pravatar.cc/150?u=alistair",
    courses: ["LIT301", "ENG101", "+1"],
    rating: 4.9,
    status: "Active",
  },
];

export default function TeacherDirectory() {
  const t = useTranslations("Admin.Teachers");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" /> {t('export')}
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('addTeacher')}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-card-bg rounded-xl border border-gray-200 dark:border-card-border p-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-sm">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-400"
            />
          </div>
          
          <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 min-w-[160px] hidden sm:block">
            <option>{t('allDepartments')}</option>
            <option>Computer Science</option>
            <option>Mathematics</option>
            <option>Literature</option>
          </select>

          <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 min-w-[140px] hidden md:block">
            <option>{t('anyStatus')}</option>
            <option>Active</option>
            <option>On Leave</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bulkActions')}</span>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
            <Mail className="w-4 h-4" />
          </button>
          <button className="p-2 text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card-bg rounded-xl border border-gray-200 dark:border-card-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold w-12">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20" />
                </th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('educator')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('department')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('activeCourses')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('avgRating')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('status')}</th>
                <th className="px-6 py-4 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {teachers.map((teacher, index) => (
                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        <Image src={teacher.avatar} alt={teacher.name} width={40} height={40} className="object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{teacher.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {teacher.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                    {teacher.department}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.courses.map((course, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-semibold">
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                      {teacher.rating}
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex w-max ${
                      teacher.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div>{t('showing')}</div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800">&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-blue-600 text-white font-medium">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-900 dark:text-white">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-900 dark:text-white">3</button>
            <span className="px-2">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-900 dark:text-white">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
