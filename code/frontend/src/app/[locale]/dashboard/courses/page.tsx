"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { fetchApi } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api";

export default function StudentCoursesPage() {
  const t = useTranslations("User.Dashboard");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchApi(API_ENDPOINTS.COURSES.LIST);
      setCourses(data as any[]);
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await fetchApi(API_ENDPOINTS.COURSES.ENROLL(courseId), { method: 'POST' });
      alert("Đăng ký khóa học thành công!");
    } catch (err: any) {
      alert(err.message || "Đăng ký khóa học thất bại.");
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách khóa học</h1>
          <p className="text-gray-500 dark:text-gray-400">Khám phá và đăng ký các khóa học mới.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-10 pr-4 py-2 w-full sm:w-64 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{course.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {course.description || "Không có mô tả"}
            </p>
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handleEnroll(course.id)}
                disabled={enrolling === course.id}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center disabled:opacity-50"
              >
                {enrolling === course.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đăng ký học"}
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Hiện tại không có khóa học nào.
          </div>
        )}
      </div>
    </div>
  );
}
