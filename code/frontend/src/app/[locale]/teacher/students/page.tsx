"use client";

import { Search, Filter, Download, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { teacherService } from "@/services/teacher.service";

interface StudentData {
  id: string;
  name: string;
  studentCode?: string | null;
  email: string;
  grade: string;
  classId?: string | null;
  className?: string | null;
  isHomeroomTeacher?: boolean;
  subjects?: string[];
  level?: number;
  streak?: number;
  initials: string;
  color?: string;
  lastActivity: string | null;
  progress: number;
  status: string;
  enrolledAt?: string;
}

export default function TeacherStudentsPage() {
  const t = useTranslations("Teacher.Students");
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Derive quick stats
  const activeToday = students.filter(s => s.lastActivity && new Date(s.lastActivity).toDateString() === new Date().toDateString()).length;
  const newThisWeek = students.filter(s => s.enrolledAt && (new Date().getTime() - new Date(s.enrolledAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length;
  const studentsAtRisk = students.filter(s => s.status === 'At Risk').length;

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await teacherService.getStudents();
        if (data) {
          setStudents(data as unknown as StudentData[]);
        }
      } catch (error) {
        console.error("Failed to load students", error);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
      else if (s.grade) set.add(s.grade);
    });
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !searchTerm ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass =
        selectedClass === "all" ||
        s.className === selectedClass ||
        s.grade === selectedClass;

      const matchesStatus =
        selectedStatus === "all" ||
        s.status === selectedStatus;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchTerm, selectedClass, selectedStatus]);

  const handleExportHomeroomCredentials = () => {
    const homeroomStudent = students.find((s) => s.isHomeroomTeacher && s.classId);
    const query = homeroomStudent?.classId ? `?classId=${homeroomStudent.classId}` : '';
    window.open(`/api/proxy/schools/export/credentials${query}`, '_blank');
  };

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, mã HS, email..."
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {students.some((s) => s.isHomeroomTeacher) && (
              <button
                onClick={handleExportHomeroomCredentials}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
                title="Xuất danh sách tài khoản lớp chủ nhiệm"
              >
                <Download className="w-4 h-4" /> Xuất TK Lớp CN
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                <Filter className="w-4 h-4" /> {t('filter')}
              </span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
              >
                <option value="all">Tất cả lớp</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[120px]"
              >
                <option value="all">{t('anyStatus')}</option>
                <option value="Active">{t('active')}</option>
                <option value="At Risk">{t('atRisk')}</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedClass("all");
                setSelectedStatus("all");
              }}
              className="text-sm font-medium text-primary hover:text-primary-hover px-2"
            >
              {t('clearFilters')}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                  <th className="px-6 py-4">{t('studentName')}</th>
                  <th className="px-6 py-4">Lớp / Vai trò GV</th>
                  <th className="px-6 py-4">Level & Streak</th>
                  <th className="px-6 py-4">{t('lastActivity')}</th>
                  <th className="px-6 py-4">Điểm TB ({t('progress')})</th>
                  <th className="px-6 py-4">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-card-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Đang tải danh sách học sinh...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Chưa có học sinh nào phù hợp.
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${student.color || 'bg-indigo-500'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                          {student.initials || 'HS'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            {student.name}
                            {student.studentCode && (
                              <span className="text-[11px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                {student.studentCode}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
                          {student.className || student.grade}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {student.isHomeroomTeacher ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              GVCN (Toàn bộ môn)
                            </span>
                          ) : (
                            student.subjects?.map((subj, idx) => (
                              <span key={idx} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                GVBM: {subj}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Lv {student.level || 1}</span>
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          Chuỗi: {student.streak || 0} ngày
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </td>
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
                        {student.status === 'Active' ? t('active') : student.status === 'At Risk' ? t('atRisk') : t('inactive')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>Hiển thị {filteredStudents.length} / {students.length} học sinh</div>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('activeToday')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{activeToday}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('newThisWeek')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{newThisWeek}</h3>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl border border-red-100 dark:border-red-900/30 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-bl-full -z-10"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t('studentsAtRisk')}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{studentsAtRisk}</h3>
        </div>
      </div>
    </div>
  );
}
