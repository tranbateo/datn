"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Course } from "@/types";
import { fetchApi } from "@/lib/api-client";
import { notify } from "@/lib/toast";

export default function AdminCoursesClient({
  initialData,
}: {
  initialData: Course[];
}) {
  const t = useTranslations("Admin.Courses");
  const [courses, setCourses] = useState<Course[]>(initialData || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [grade, setGrade] = useState(6);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi<any[]>("/admin/subjects").catch(() => []),
      fetchApi<any[]>("/admin/users/teachers").catch(() => []),
    ]).then(([subs, tchs]) => {
      setSubjects(Array.isArray(subs) ? subs : []);
      setTeachers(Array.isArray(tchs) ? tchs : []);
    });
  }, []);

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.subject?.name) set.add(c.subject.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesGrade =
        gradeFilter === "ALL" || String(c.grade) === gradeFilter;
      const matchesSubject =
        subjectFilter === "ALL" || c.subject?.name === subjectFilter;
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.teacher?.fullName?.toLowerCase().includes(q) ||
        c.subject?.name?.toLowerCase().includes(q);
      return matchesGrade && matchesSubject && matchesSearch;
    });
  }, [courses, searchTerm, gradeFilter, subjectFilter]);

  const totalEnrollments = useMemo(
    () => courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0),
    [courses],
  );
  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + (c._count?.lessons || 0), 0),
    [courses],
  );
  const totalDocuments = useMemo(
    () => courses.reduce((sum, c) => sum + (c._count?.documents || 0), 0),
    [courses],
  );

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !teacherId) {
      notify("Vui lòng nhập đầy đủ Tên khóa học, Môn học và Giáo viên.");
      return;
    }
    setCreating(true);
    try {
      const created = await fetchApi<Course>("/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          subjectId,
          teacherId,
          grade: Number(grade),
        }),
      });
      setCourses((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setSubjectId("");
      setTeacherId("");
      setIsCreateOpen(false);
      notify("Đã tạo khóa học mới thành công!");
    } catch (err: any) {
      notify(err?.message || "Không thể tạo khóa học.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa khóa học "${course.title}"? Các bài giảng thuộc khóa học này sẽ bị xóa.`,
      )
    ) {
      return;
    }
    try {
      await fetchApi(`/admin/courses/${course.id}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      notify("Đã xóa khóa học.");
    } catch (err: any) {
      notify(err?.message || "Không thể xóa khóa học.");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {t("newCourse")}
        </button>
      </div>

      {/* KPI Cards (100% Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {t("totalActive")}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {courses.length}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {t("totalEnrollments")}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalEnrollments}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Tổng số bài giảng
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalLessons}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-5 border border-gray-100 dark:border-card-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Tài liệu RAG đính kèm
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalDocuments}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm flex flex-col lg:flex-row gap-3 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên khóa học, môn hoặc giáo viên..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
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
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <option value="ALL">Tất cả môn ({uniqueSubjects.length})</option>
            {uniqueSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Chưa có dữ liệu khóa học phù hợp
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    {t("courseTitle")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    Môn & Khối
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    {t("enrollment")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    {t("lessons")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    Tài liệu RAG
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase text-right">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCourses.map((course: Course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-blue-800/50 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-md">
                          <div className="font-bold text-gray-900 dark:text-white truncate">
                            {course.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            GV: {course.teacher?.fullName || "Chưa gán"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {course.subject?.name || "Khác"}
                        </span>
                        {course.grade && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            Khối {course.grade}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {course._count?.enrollments || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-semibold">
                      {course._count?.lessons || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-semibold">
                      {course._count?.documents || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course)}
                        title="Xóa khóa học"
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tạo khóa học / học phần mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên khóa học *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Toán 6 — Ôn thi học kỳ II"
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Khối lớp *
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Môn học *
                  </label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">-- Chọn môn --</option>
                    {subjects
                      .filter((s) => Number(s.grade) === Number(grade))
                      .concat(
                        subjects.filter(
                          (s) => Number(s.grade) !== Number(grade),
                        ),
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Khối {s.grade})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Giáo viên phụ trách *
                </label>
                <select
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.fullName} ({tc.studentCode || tc.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu học phần..."
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo khóa học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
