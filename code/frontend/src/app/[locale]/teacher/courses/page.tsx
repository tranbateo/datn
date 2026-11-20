"use client";
import { notify } from "@/lib/toast";

import { API_ENDPOINTS } from "@/constants/api";
import { useEffect, useState, useMemo, useRef } from "react";
import { fetchApi } from "@/lib/api-client";
import { Plus, GraduationCap, Users, CheckCircle2, Upload, BookOpen, Layers, Edit, Trash2, X, Loader2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { teacherService } from "@/services/teacher.service";
import CreateCourseModal from "@/components/teacher/CreateCourseModal";

export default function TeacherCourseManagement() {
  const t = useTranslations("Teacher.Courses");
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  // Lesson Manager Modal state
  const [managingCourse, setManagingCourse] = useState<{
    id: string;
    title: string;
    lessons: Array<{ id: string; title: string; content?: string | null; order: number }>;
  } | null>(null);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  const openLessonManager = async (courseId: string, courseTitle: string) => {
    setLoadingLessons(true);
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonContent("");
    try {
      const detail = await teacherService.getCourseDetail(courseId);
      setManagingCourse({
        id: courseId,
        title: detail?.title || courseTitle,
        lessons: Array.isArray(detail?.lessons) ? detail.lessons : [],
      });
    } catch (err: any) {
      notify(err?.message || "Không thể tải danh sách chương bài giảng.");
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCourse || !lessonTitle.trim()) return;
    setSavingLesson(true);
    try {
      if (editingLessonId) {
        await teacherService.updateLesson(managingCourse.id, editingLessonId, {
          title: lessonTitle.trim(),
          content: lessonContent.trim(),
        });
        notify("Đã cập nhật nội dung chương bài giảng!");
      } else {
        await teacherService.createLesson(managingCourse.id, {
          title: lessonTitle.trim(),
          content: lessonContent.trim(),
        });
        notify("Đã thêm chương bài giảng mới! Học sinh và Gia sư AI đã có thể xem ngay.");
      }
      setEditingLessonId(null);
      setLessonTitle("");
      setLessonContent("");
      await openLessonManager(managingCourse.id, managingCourse.title);
      await loadCourses();
    } catch (err: any) {
      notify(err?.message || "Không thể lưu chương bài giảng.");
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!managingCourse) return;
    if (!confirm("Bạn có chắc muốn xóa chương bài giảng này?")) return;
    try {
      await teacherService.deleteLesson(managingCourse.id, lessonId);
      notify("Đã xóa chương bài giảng.");
      await openLessonManager(managingCourse.id, managingCourse.title);
      await loadCourses();
    } catch (err: any) {
      notify(err?.message || "Không thể xóa chương bài giảng.");
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await teacherService.getCourses();
      if (data && data.length > 0) {
        const formatted = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          instructor: c.instructor || "Giáo viên",
          category: c.subject || "Chưa phân loại",
          grade: c.grade || "",
          assignedClasses: Array.isArray(c.assignedClasses) ? c.assignedClasses : [],
          enrollment: c.students || 0,
          enrollmentTrend: c.enrollmentTrend || "+0%",
          lessons: c.lessons || 0,
          trend: c.trend || [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
          trendColor: c.trendColor || "#2563EB",
        }));
        setCoursesData(formatted);
      } else {
        setCoursesData([]);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const subjectCategories = useMemo(() => {
    const s = new Set<string>();
    coursesData.forEach((c) => {
      if (c.category) s.add(c.category);
    });
    return Array.from(s);
  }, [coursesData]);

  const filteredCourses = useMemo(() => {
    if (selectedSubject === "ALL") return coursesData;
    return coursesData.filter((c) => c.category === selectedSubject);
  }, [coursesData, selectedSubject]);

  const totalLessons = useMemo(
    () => coursesData.reduce((acc, c) => acc + Number(c.lessons || 0), 0),
    [coursesData]
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t("title")}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {t("newCourse")}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t("totalActive")}
              </p>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">{coursesData.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t("totalEnrollments")}
              </p>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                {coursesData.reduce((acc, c) => acc + (c.enrollment || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-bg rounded-2xl p-6 border border-gray-100 dark:border-card-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Tổng bài giảng & học liệu
              </p>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white">{totalLessons}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-200 dark:border-card-border shadow-sm overflow-hidden flex flex-col min-h-[380px]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 min-w-[160px]"
            >
              <option value="ALL">Tất cả môn học</option>
              {subjectCategories.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Hiển thị {filteredCourses.length} / {coursesData.length} khóa học
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs">{t("courseTitle")}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t("category")}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t("enrollment")}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t("lessons")}</th>
                <th className="px-6 py-4 font-semibold text-xs">{t("trend")}</th>
                <th className="px-6 py-4 font-semibold text-xs text-right">Quản lý Bài giảng & PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Đang tải danh sách khóa học...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Chưa có khóa học nào. Hãy nhấn &quot;{t("newCourse")}&quot; để tạo mới.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    onUploaded={loadCourses}
                    onManageLessons={() => openLessonManager(course.id, course.title)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadCourses}
      />

      {/* Lesson Chapters CRUD Modal */}
      {(managingCourse || loadingLessons) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {loadingLessons || !managingCourse ? (
              <div className="p-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Quản lý Chương bài giảng (Hiển thị trực tiếp cho Học sinh & Gia sư AI)
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {managingCourse.title} ({managingCourse.lessons.length} chương)
                    </h3>
                  </div>
                  <button
                    onClick={() => setManagingCourse(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Existing lessons list */}
                  <div className="lg:col-span-6 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Danh sách chương hiện có
                    </h4>
                    {managingCourse.lessons.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center border border-dashed border-gray-200 rounded-xl">
                        Chưa có chương bài giảng nào.
                      </p>
                    ) : (
                      managingCourse.lessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className={`p-3.5 rounded-xl border transition-colors ${
                            editingLessonId === lesson.id
                              ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                              : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {idx + 1}. {lesson.title}
                              </div>
                              {lesson.content && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {lesson.content}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLessonId(lesson.id);
                                  setLessonTitle(lesson.title);
                                  setLessonContent(lesson.content || "");
                                }}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                                title="Chỉnh sửa chương"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                title="Xóa chương"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add / Edit lesson form */}
                  <form
                    onSubmit={handleSaveLesson}
                    className="lg:col-span-6 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 space-y-3.5 h-fit"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {editingLessonId ? "Chỉnh sửa chương bài giảng" : "Thêm chương bài giảng mới"}
                      </h4>
                      {editingLessonId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLessonId(null);
                            setLessonTitle("");
                            setLessonContent("");
                          }}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          + Tạo chương mới
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Tên chương / bài học *
                      </label>
                      <input
                        type="text"
                        required
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        placeholder="VD: Chương V: Phân số & Hỗn số"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Nội dung kiến thức bài giảng (Hỗ trợ Markdown) *
                      </label>
                      <textarea
                        rows={7}
                        required
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        placeholder="Nhập lý thuyết trọng tâm, công thức, ví dụ minh họa và bài tập tự luyện..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-y"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingLesson}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 transition-colors"
                    >
                      {savingLesson
                        ? "Đang lưu..."
                        : editingLessonId
                          ? "Lưu thay đổi chương"
                          : "Thêm chương vào Bài giảng"}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseRow({
  course,
  onUploaded,
  onManageLessons,
}: {
  course: any;
  onUploaded: () => void;
  onManageLessons: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await fetchApi(API_ENDPOINTS.DOCUMENTS.UPLOAD(course.id), {
        method: "POST",
        body: formData,
      });
      notify("Tải lên thành công! Tài liệu đã được đưa vào kho tri thức RAG của khóa học.");
      onUploaded();
    } catch (err) {
      console.error(err);
      notify("Có lỗi xảy ra khi tải tài liệu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-blue-800/50">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-base">{course.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>{course.instructor}</span>
              {course.grade && <span>• {course.grade}</span>}
              {course.assignedClasses?.length > 0 && (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  • Phụ trách: {course.assignedClasses.join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          {course.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="font-bold text-gray-900 dark:text-white text-base">
          {course.enrollment.toLocaleString()} HS
        </div>
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium text-base">
        {course.lessons} bài
      </td>
      <td className="px-6 py-4">
        <div className="w-24 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={course.trend}>
              <defs>
                <linearGradient id={`color-${course.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={course.trendColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={course.trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={course.trendColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${course.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={onManageLessons}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg transition-colors"
            title="Xem, thêm hoặc sửa nội dung từng chương bài giảng"
          >
            <Layers className="w-3.5 h-3.5" />
            Quản lý chương
          </button>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            title="Tải lên tài liệu PDF (Học sinh xem PDF gốc & AI RAG đọc luôn)"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Đang tải..." : "Tải PDF"}
          </button>
        </div>
      </td>
    </tr>
  );
}
