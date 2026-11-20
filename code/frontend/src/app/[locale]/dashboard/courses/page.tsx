"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  Loader2,
  Bot,
  GraduationCap,
  FileText,
  Layers,
  ArrowRight,
  School,
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api";
import { Link } from "@/i18n/routing";
import { formatClassLabel } from "@/services/users.service";

interface LessonPreview {
  id: string;
  title: string;
  order: number;
}

interface DocumentPreview {
  id: string;
  fileName: string;
  size?: string | null;
  status: string;
}

interface SubjectLectureItem {
  id: string;
  title: string;
  description?: string | null;
  grade?: number | null;
  studentClassName?: string | null;
  studentGrade?: number | null;
  subject?: { id: string; name: string; grade: number } | null;
  teacher?: { id: string; fullName?: string | null; email?: string | null } | null;
  lessons?: LessonPreview[];
  documents?: DocumentPreview[];
  _count?: { lessons?: number; documents?: number };
}

export default function StudentLecturesPage() {
  const [subjectsList, setSubjectsList] = useState<SubjectLectureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadLectures = async () => {
      setLoading(true);
      try {
        const data = await fetchApi<SubjectLectureItem[]>(API_ENDPOINTS.COURSES.LIST);
        setSubjectsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load lectures", err);
      } finally {
        setLoading(false);
      }
    };
    loadLectures();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return subjectsList;
    const q = searchQuery.toLowerCase();
    return subjectsList.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.subject?.name?.toLowerCase().includes(q) ||
        c.teacher?.fullName?.toLowerCase().includes(q) ||
        c.lessons?.some((l) => l.title?.toLowerCase().includes(q)) ||
        c.documents?.some((d) => d.fileName?.toLowerCase().includes(q)),
    );
  }, [subjectsList, searchQuery]);

  const studentClassName = subjectsList[0]?.studentClassName;
  const studentGrade = subjectsList[0]?.studentGrade ?? subjectsList[0]?.grade;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bài giảng & Tài liệu môn học
            </h1>
            {(studentClassName || studentGrade) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                <School className="w-3.5 h-3.5" />
                {studentClassName
                  ? `${formatClassLabel(studentClassName)}${studentGrade ? ` • Khối ${studentGrade}` : ""}`
                  : `Khối ${studentGrade}`}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Toàn bộ bài giảng theo chương và tài liệu SGK / chuyên đề chính khóa thuộc đúng khối lớp của em.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm môn học, chương bài giảng, tài liệu..."
            className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
          />
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((course) => {
          const lessonsCount = course.lessons?.length ?? course._count?.lessons ?? 0;
          const docsCount = course.documents?.length ?? course._count?.documents ?? 0;

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-gray-700/80 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col group"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/60 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {course.subject?.name && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {course.subject.name}
                    </span>
                  )}
                  {course.grade && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      Khối {course.grade}
                    </span>
                  )}
                </div>
              </div>

              <Link href={`/dashboard/courses/${course.id}`} className="block">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5">
                  {course.title}
                </h3>
              </Link>

              {course.teacher?.fullName && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  GV bộ môn: <span className="font-semibold text-slate-700 dark:text-slate-200">{course.teacher.fullName}</span>
                </p>
              )}

              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                {course.description || "Hệ thống bài giảng theo chương và tài liệu SGK tích hợp Gia sư AI."}
              </p>

              {/* Quick Stats Badges: Lessons & Documents */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {lessonsCount} chương bài giảng
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {docsCount} tài liệu
                </span>
              </div>

              {/* Actions */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-gray-700 flex items-center gap-2">
                <Link
                  href={`/dashboard/courses/${course.id}`}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex justify-center items-center gap-1.5 shadow-xs"
                >
                  Xem bài giảng & tài liệu
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={
                    course.subject?.id
                      ? `/dashboard/ai-tutor?subjectId=${encodeURIComponent(course.subject.id)}&subjectName=${encodeURIComponent(course.subject.name)}&grade=${encodeURIComponent(String(course.grade || course.subject.grade || ""))}`
                      : "/dashboard/ai-tutor"
                  }
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                  title={`Hỏi Gia sư AI chuyên môn ${course.subject?.name || "môn học"}`}
                >
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Hỏi AI
                </Link>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-14 text-center bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold">
              Chưa có bài giảng hoặc tài liệu phù hợp cho khối lớp hiện tại.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
