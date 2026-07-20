"use client";

import { Search, Plus, Download, MoreVertical, Star, Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { fetchApi } from "@/lib/api-client";
import { Teacher, Course, User } from '@/types';
import UserModal from "@/components/admin/UserModal";

export default function AdminTeachersClient({ initialData }: { initialData: Teacher[] }) {
  const t = useTranslations("Admin.Teachers");
  const [teachers, setTeachers] = useState<Teacher[]>(initialData || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleOpenModal = (user?: Teacher) => {
    setSelectedUser(user ? (user as any as User) : null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: Partial<User>) => {
    if (selectedUser) {
      await fetchApi(`/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setTeachers(teachers.map(s => s.id === selectedUser.id ? { ...s, ...data } as unknown as Teacher : s));
    } else {
      const newUser = await fetchApi<Teacher>(`/admin/users`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setTeachers([newUser, ...teachers]);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) return;
    await fetchApi(`/admin/users/${id}`, { method: 'DELETE' });
    setTeachers(teachers.filter(s => s.id !== id));
  };

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
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
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
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card-bg rounded-xl border border-gray-200 dark:border-card-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          {teachers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Chưa có dữ liệu giáo viên
            </div>
          ) : (
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
                {teachers.map((teacher: Teacher, index: number) => (
                  <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                          {teacher.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{teacher.fullName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                      N/A
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.courses?.map((course: Course, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-semibold">
                            {course.title.substring(0, 8)}...
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                        0.0
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex w-max ${
                        teacher.isActive 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(teacher)} className="p-1 text-blue-500 hover:text-blue-700">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteUser(teacher.id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-5 h-5" />
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
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser} 
        user={selectedUser} 
        role="TEACHER" 
      />
    </div>
  );
}
