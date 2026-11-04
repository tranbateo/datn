"use client";

import { Search, Plus, Filter, Download, ChevronLeft, ChevronRight, TrendingUp, Users, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { fetchApi } from "@/lib/api-client";
import { Student, User } from '@/types';
import UserModal from "@/components/admin/UserModal";
import SchoolImportModal from "@/components/admin/SchoolImportModal";

export default function AdminStudentsClient({ initialData }: { initialData: Student[] }) {
  const t = useTranslations("Admin.Students");
  const [students, setStudents] = useState<Student[]>(initialData || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !searchTerm ||
        s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade =
        selectedGrade === "all" ||
        String(s.grade) === selectedGrade ||
        s.classEnrollments?.[0]?.class?.name?.toLowerCase().includes(selectedGrade.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && s.isActive) ||
        (selectedStatus === "inactive" && !s.isActive);

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [students, searchTerm, selectedGrade, selectedStatus]);

  const handleOpenModal = (user?: Student) => {
    setSelectedUser(user ? (user as unknown as User) : null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: Partial<User>) => {
    if (selectedUser) {
      await fetchApi(`/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setStudents(students.map(s => s.id === selectedUser.id ? { ...s, ...data } as unknown as Student : s));
    } else {
      const newUser = await fetchApi<Student>(`/admin/users`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setStudents([newUser, ...students]);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học viên này?')) return;
    await fetchApi(`/admin/users/${id}`, { method: 'DELETE' });
    setStudents(students.filter(s => s.id !== id));
  };

  const handleExportCredentials = () => {
    window.open('/api/proxy/schools/export/credentials', '_blank');
  };

  const newThisWeekCount = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return students.filter(s => s.createdAt && new Date(s.createdAt).getTime() >= oneWeekAgo).length;
  }, [students]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content - Table */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, mã HS, email..."
                className="pl-9 pr-4 py-2 w-full sm:w-56 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button 
              onClick={handleExportCredentials}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
              title="Xuất danh sách tài khoản mặc định"
            >
              <Download className="w-4 h-4" /> Xuất TK
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> {t('addStudent')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                <Filter className="w-4 h-4" /> {t('filters')}
              </span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[120px]"
              >
                <option value="all">{t('allGrades')}</option>
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[120px]"
              >
                <option value="all">{t('anyStatus')}</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedGrade("all");
                setSelectedStatus("all");
              }}
              className="text-sm font-medium text-primary hover:text-primary-hover px-2"
            >
              {t('clearFilters')}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu học sinh phù hợp
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                    <th className="px-6 py-4">{t('studentName')}</th>
                    <th className="px-6 py-4">Mã HS / Lớp</th>
                    <th className="px-6 py-4">{t('grade')}</th>
                    <th className="px-6 py-4">{t('lastActivity')}</th>
                    <th className="px-6 py-4">{t('progress')}</th>
                    <th className="px-6 py-4">{t('status')}</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-card-border">
                  {filteredStudents.map((student: Student) => {
                    const activeClassName = student.classEnrollments?.[0]?.class?.name;
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {student.fullName ? student.fullName.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">{student.fullName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {student.studentCode ? (
                              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded w-fit">
                                {student.studentCode}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                            {activeClassName && (
                              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                {activeClassName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {student.grade ? `Khối ${student.grade}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(student.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md">
                              Lv.{student.gamificationProfile?.level || 1} ({student.gamificationProfile?.xp || 0} XP)
                            </span>
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
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(student)} className="p-1 text-blue-500 hover:text-blue-700">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteUser(student.id)} className="p-1 text-red-500 hover:text-red-700">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>Hiển thị {filteredStudents.length} / {students.length} học sinh</div>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Tổng số học sinh</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{students.length}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('newThisWeek')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{newThisWeekCount}</h3>
        </div>
      </div>
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser} 
        user={selectedUser} 
        role="STUDENT" 
      />
      <SchoolImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  );
}
