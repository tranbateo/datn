"use client";

import { Search, Plus, Download, Edit, Trash2, BookOpen, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { fetchApi } from "@/lib/api-client";
import { Teacher, Course, User } from "@/types";
import UserModal from "@/components/admin/UserModal";

export default function AdminTeachersClient({ initialData }: { initialData: Teacher[] }) {
  const t = useTranslations("Admin.Teachers");
  const [teachers, setTeachers] = useState<Teacher[]>(initialData || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((teacher) => {
      teacher.subjectClasses?.forEach((sc) => {
        if (sc.subject?.name) set.add(sc.subject.name);
      });
    });
    return Array.from(set);
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        teacher.fullName?.toLowerCase().includes(q) ||
        teacher.email?.toLowerCase().includes(q) ||
        teacher.studentCode?.toLowerCase().includes(q) ||
        teacher.homeroomClasses?.some((c) => c.name?.toLowerCase().includes(q)) ||
        teacher.subjectClasses?.some(
          (sc) =>
            sc.class?.name?.toLowerCase().includes(q) ||
            sc.subject?.name?.toLowerCase().includes(q),
        );

      const matchesSubject =
        selectedSubject === "all" ||
        teacher.subjectClasses?.some((sc) => sc.subject?.name === selectedSubject);

      const matchesGrade =
        selectedGrade === "all" ||
        teacher.homeroomClasses?.some((c) => String(c.grade) === selectedGrade) ||
        teacher.subjectClasses?.some(
          (sc) =>
            String(sc.class?.grade || sc.subject?.grade) === selectedGrade,
        );

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && teacher.isActive) ||
        (selectedStatus === "inactive" && !teacher.isActive);

      return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
    });
  }, [teachers, searchTerm, selectedSubject, selectedGrade, selectedStatus]);

  const handleOpenModal = (user?: Teacher) => {
    setSelectedUser(user ? (user as unknown as User) : null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: Partial<User>) => {
    if (selectedUser) {
      const updatedUser = await fetchApi<Teacher>(`/admin/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setTeachers(
        teachers.map((s) =>
          s.id === selectedUser.id ? ({ ...s, ...data, ...updatedUser } as unknown as Teacher) : s,
        ),
      );
    } else {
      const newUser = await fetchApi<Teacher>(`/admin/users`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setTeachers([newUser, ...teachers]);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giáo viên này?")) return;
    await fetchApi(`/admin/users/${id}`, { method: "DELETE" });
    setTeachers(teachers.filter((s) => s.id !== id));
  };

  const handleExport = () => {
    window.open("/api/proxy/schools/export/credentials", "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("title")} ({filteredTeachers.length}/{teachers.length})
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Phân loại đội ngũ giáo viên theo Tổ bộ môn, Khối lớp (6, 7, 8, 9), Lớp chủ nhiệm (GVCN) và Lớp giảng dạy bộ môn (GVBM).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-card-bg border border-gray-200 dark:border-card-border px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" /> {t("export")}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> {t("addTeacher")}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-card-bg rounded-xl border border-gray-200 dark:border-card-border p-4 flex flex-col lg:flex-row items-center gap-3 justify-between shadow-sm">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên GV, mã GV (GV01), môn học hoặc lớp (6A, 7B)..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả môn học (11 môn)</option>
            {availableSubjects.map((subj) => (
              <option key={subj} value={subj}>
                Môn: {subj}
              </option>
            ))}
          </select>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả khối lớp</option>
            {[6, 7, 8, 9].map((g) => (
              <option key={g} value={String(g)}>
                Dạy Khối {g}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">{t("anyStatus")}</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card-bg rounded-xl border border-gray-200 dark:border-card-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          {filteredTeachers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Chưa có dữ liệu giáo viên phù hợp với bộ lọc
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                    {t("educator")}
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                    Môn chuyên trách & Khối dạy
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                    Phân công Lớp (GVCN & GVBM theo Khối)
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                    {t("activeCourses")}
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTeachers.map((teacher: Teacher, index: number) => {
                  const uniqueSubjects = Array.from(
                    new Set(
                      (teacher.subjectClasses || [])
                        .map((sc) => sc.subject?.name)
                        .filter(Boolean),
                    ),
                  ) as string[];

                  const gradesMap = new Map<number, string[]>();
                  (teacher.subjectClasses || []).forEach((sc) => {
                    const g = sc.class?.grade || sc.subject?.grade || 0;
                    const cName = sc.class?.name;
                    if (!g || !cName) return;
                    const list = gradesMap.get(g) || [];
                    if (!list.includes(cName)) list.push(cName);
                    gradesMap.set(g, list);
                  });

                  const sortedGrades = Array.from(gradesMap.keys()).sort((a, b) => a - b);

                  return (
                    <tr
                      key={teacher.id || index}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group align-top"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                            {teacher.fullName?.charAt(0) || "G"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              {teacher.fullName}
                              {teacher.studentCode && (
                                <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {teacher.studentCode}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {uniqueSubjects.length > 0 ? (
                            uniqueSubjects.map((subj) => (
                              <span
                                key={subj}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 w-max"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                {subj}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Chưa gán môn</span>
                          )}
                          {sortedGrades.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              Khối dạy: {sortedGrades.map((g) => `Khối ${g}`).join(", ")} (
                              {teacher.subjectClasses?.length || 0} lớp)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 min-w-[280px]">
                        <div className="flex flex-col gap-1.5">
                          {teacher.homeroomClasses && teacher.homeroomClasses.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {teacher.homeroomClasses.map((cls) => (
                                <span
                                  key={cls.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 rounded-md text-xs font-bold"
                                >
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  Chủ nhiệm (GVCN): {cls.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {sortedGrades.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {sortedGrades.map((g) => (
                                <div key={g} className="flex items-center flex-wrap gap-1 text-xs">
                                  <span className="font-bold text-gray-600 dark:text-gray-300 min-w-[52px]">
                                    Khối {g}:
                                  </span>
                                  {gradesMap.get(g)?.map((cName) => (
                                    <span
                                      key={cName}
                                      className="px-2 py-0.5 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 rounded font-semibold"
                                    >
                                      {cName}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            !teacher.homeroomClasses?.length && (
                              <span className="text-gray-400 text-xs">Chưa phân công lớp</span>
                            )
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {teacher.courses?.map((course: Course, i: number) => (
                            <span
                              key={course.id || i}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-semibold"
                            >
                              {course.title}
                            </span>
                          ))}
                          {!teacher.courses?.length && (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex w-max ${
                            teacher.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {teacher.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(teacher)}
                            className="p-1 text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(teacher.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
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
