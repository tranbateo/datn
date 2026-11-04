"use client";

import { useState, useEffect } from "react";
import { School, Plus, Users, GraduationCap, Download, Upload, Search, KeyRound, X } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import SchoolImportModal from "@/components/admin/SchoolImportModal";

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [className, setClassName] = useState("");
  const [grade, setGrade] = useState(6);
  const [homeroomTeacherId, setHomeroomTeacherId] = useState("");
  const [academicYearName, setAcademicYearName] = useState("2025-2026");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        fetchApi<any[]>("/admin/classes").catch(() => []),
        fetchApi<any>("/admin/users/teachers").catch(() => ({ teachers: [] })),
      ]);
      setClasses(Array.isArray(classesRes) ? classesRes : []);
      setTeachers(teachersRes?.teachers || []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    setCreating(true);
    try {
      await fetchApi("/admin/classes", {
        method: "POST",
        body: JSON.stringify({
          name: className.trim(),
          grade: Number(grade),
          homeroomTeacherId: homeroomTeacherId || undefined,
          academicYearName: academicYearName.trim() || "2025-2026",
        }),
      });
      setClassName("");
      setHomeroomTeacherId("");
      setIsCreateOpen(false);
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Không thể tạo lớp học");
    } finally {
      setCreating(false);
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.inviteCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.homeroomTeacher?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === "ALL" || String(cls.grade) === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const totalStudentsEnrolled = classes.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);
  const classesWithHomeroom = classes.filter((c) => c.homeroomTeacher).length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" /> Quản lý Lớp học & Phân công Giáo viên
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Quản lý danh sách lớp chính khóa, giáo viên chủ nhiệm (GVCN), giáo viên bộ môn (GVBM) và xuất phiếu tài khoản theo lớp.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" /> Import Excel toàn trường
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tạo lớp học mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card-bg p-6 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng số lớp học</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{classes.length}</h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md">
              Năm học 2025-2026
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg p-6 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng lượt học sinh xếp lớp</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{totalStudentsEnrolled}</h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md">
              Chính khóa
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg p-6 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lớp đã phân công GVCN</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {classesWithHomeroom} / {classes.length}
            </h3>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-md">
              Giáo viên chủ nhiệm
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên lớp (6A1), mã lớp hoặc tên GVCN..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-400 uppercase">Khối lớp:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <option value="ALL">Tất cả khối</option>
            {[6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={String(g)}>
                Khối {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Lớp học</th>
                <th className="py-3.5 px-6">Khối / Năm học</th>
                <th className="py-3.5 px-6">Giáo viên chủ nhiệm (GVCN)</th>
                <th className="py-3.5 px-6">Giáo viên bộ môn (GVBM)</th>
                <th className="py-3.5 px-6">Sĩ số</th>
                <th className="py-3.5 px-6">Mã tham gia</th>
                <th className="py-3.5 px-6 text-right">Phiếu tài khoản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Đang tải danh sách lớp học...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Chưa có lớp học nào phù hợp. Hãy nhấn &quot;Tạo lớp học mới&quot; hoặc &quot;Import Excel toàn trường&quot;.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 dark:text-white text-base">{cls.name}</div>
                      <div className="text-xs text-gray-400">ID: {cls.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Khối {cls.grade || "-"}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{cls.academicYear?.name || "2025-2026"}</div>
                    </td>
                    <td className="py-4 px-6">
                      {cls.homeroomTeacher ? (
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-emerald-600" />
                            {cls.homeroomTeacher.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cls.homeroomTeacher.studentCode ? `${cls.homeroomTeacher.studentCode} • ` : ""}
                            {cls.homeroomTeacher.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md font-medium">
                          Chưa phân công GVCN
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {cls.subjectTeachers && cls.subjectTeachers.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cls.subjectTeachers.map((st: any) => (
                            <span
                              key={st.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300"
                            >
                              <span className="font-semibold">{st.subject?.name || "Môn"}:</span> {st.teacher?.fullName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Theo phân công chung</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                        <Users className="w-4 h-4 text-blue-500" />
                        {cls._count?.enrollments || 0} HS
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        <KeyRound className="w-3 h-3 text-gray-400" />
                        {cls.inviteCode}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={`/api/proxy/schools/export/credentials?classId=${cls.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Xuất phiếu TK lớp
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Class Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tạo lớp học mới</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên lớp (VD: 6A1, 9A2) *
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Nhập tên lớp..."
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Khối lớp *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={academicYearName}
                    onChange={(e) => setAcademicYearName(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Giáo viên chủ nhiệm (GVCN)
                </label>
                <select
                  value={homeroomTeacherId}
                  onChange={(e) => setHomeroomTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">-- Chọn giáo viên chủ nhiệm --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo lớp học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SchoolImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
