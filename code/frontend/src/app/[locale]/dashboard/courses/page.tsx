"use client";
import { notify } from "@/lib/toast";

import { useState, useEffect, useMemo } from "react";
import { BookOpen, Search, Loader2, Bot, GraduationCap } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api";
import { Link } from "@/i18n/routing";

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchApi(API_ENDPOINTS.COURSES.LIST);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await fetchApi(API_ENDPOINTS.COURSES.ENROLL(courseId), { method: "POST" });
      notify("Đăng ký khóa học thành công!");
    } catch (err: any) {
      notify(err.message || "Đăng ký khóa học thất bại.");
    } finally {
      setEnrolling(null);
    }
  };

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.subject?.name?.toLowerCase().includes(q) ||
        c.teacher?.fullName?.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách khóa học & Học liệu</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Khám phá các khóa học chính khóa do giáo viên bộ môn biên soạn và hỏi đáp trực tiếp với AI Tutor.
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm khóa học, môn học, giáo viên..."
            className="pl-10 pr-4 py-2 w-full sm:w-72 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              {course.subject?.name && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {course.subject.name}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{course.title}</h3>
            {course.teacher?.fullName && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                <GraduationCap className="w-3.5 h-3.5 text-blue-500" /> GV: {course.teacher.fullName}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {course.description || "Tài liệu và bài giảng chính khóa được tích hợp kho tri thức AI RAG."}
            </p>
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <button
                onClick={() => handleEnroll(course.id)}
                disabled={enrolling === course.id}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex justify-center items-center disabled:opacity-50"
              >
                {enrolling === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ghi danh học"}
              </button>
              <Link
                href="/dashboard/ai-tutor"
                className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                title="Hỏi AI Tutor về khóa học này"
              >
                <Bot className="w-4 h-4 text-blue-600" /> Hỏi AI
              </Link>
            </div>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Hiện tại không có khóa học nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}
