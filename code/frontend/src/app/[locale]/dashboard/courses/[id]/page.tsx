"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  GraduationCap,
  Bot,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Layers,
  School,
  Sparkles,
  AlertCircle,
  BookMarked,
  Eye,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { fetchApi } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api";
import { formatClassLabel } from "@/services/users.service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocumentChunk {
  page: number;
  content: string;
}

interface RelatedExcerpt {
  fileName: string;
  page: number;
  content: string;
}

interface LessonItem {
  id: string;
  title: string;
  content?: string | null;
  order: number;
  relatedExcerpts?: RelatedExcerpt[];
}

interface DocumentItem {
  id: string;
  fileName: string;
  type: string;
  size?: string | null;
  status: string;
  uploadedAt?: string;
  hasFile?: boolean;
  chunks?: DocumentChunk[];
}

interface SubjectDetail {
  id: string;
  title: string;
  description?: string | null;
  grade?: number | null;
  studentClassName?: string | null;
  studentGrade?: number | null;
  subject?: { id: string; name: string; grade: number } | null;
  teacher?: { id: string; fullName?: string | null; email?: string | null } | null;
  lessons: LessonItem[];
  documents: DocumentItem[];
}

function formatReadableContent(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/->/g, "→")
    .replace(/<=>/g, "⇔")
    .replace(/=>/g, "⇒")
    .replace(/>=/g, "≥")
    .replace(/<=/g, "≤")
    .replace(/\^2\b/g, "²")
    .replace(/\^3\b/g, "³");
}

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id;

  const [course, setCourse] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "lessons" | "documents">("all");
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [readingDoc, setReadingDoc] = useState<DocumentItem | null>(null);
  const [readerMode, setReaderMode] = useState<"pdf" | "text">("pdf");

  const openDocumentReader = (doc: DocumentItem) => {
    setReadingDoc(doc);
    setReaderMode(doc.hasFile ? "pdf" : "text");
  };

  useEffect(() => {
    if (!courseId) return;
    const loadDetail = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await fetchApi<SubjectDetail>(API_ENDPOINTS.COURSES.DETAIL(courseId));
        setCourse(data);
        setSelectedLessonIndex(0);
      } catch (err: any) {
        setErrorMsg(
          err?.message ||
            "Không thể tải nội dung bài giảng và tài liệu. Có thể môn học này thuộc khối lớp khác.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-72">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="p-6 max-w-3xl mx-auto mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/50 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Không thể mở môn học này
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{errorMsg}</p>
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Bài giảng & Tài liệu
          </Link>
        </div>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const documents = course.documents || [];
  const currentLesson = lessons[selectedLessonIndex] || null;

  const buildAiTutorHref = (docName?: string) => {
    if (!course.subject?.id) return "/dashboard/ai-tutor";
    const qs = new URLSearchParams({
      subjectId: course.subject.id,
      subjectName: course.subject.name,
      grade: String(course.grade || course.subject.grade || ""),
    });
    if (docName) qs.set("docName", docName);
    return `/dashboard/ai-tutor?${qs.toString()}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-10">
      {/* Back Breadcrumb */}
      <div>
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách Bài giảng & Tài liệu
        </Link>
      </div>

      {/* Hero Subject Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-600/15">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {course.subject?.name && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                  Môn {course.subject.name}
                </span>
              )}
              {course.grade && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                  <School className="w-3.5 h-3.5" />
                  {course.studentClassName
                    ? `${formatClassLabel(course.studentClassName)} • Khối ${course.grade}`
                    : `Khối ${course.grade}`}
                </span>
              )}
              {course.teacher?.fullName && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/30 text-blue-100">
                  <GraduationCap className="w-3.5 h-3.5" />
                  GV bộ môn: {course.teacher.fullName}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={buildAiTutorHref()}
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" /> Hỏi Gia sư AI môn {course.subject?.name || "này"}
            </Link>
          </div>
        </div>
      </div>

      {/* View Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "all"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Tất cả (Bài giảng & Tài liệu)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lessons")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "lessons"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700"
          }`}
        >
          <Layers className="w-4 h-4" />
          Bài giảng theo chương ({lessons.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "documents"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          Tài liệu SGK & Chuyên đề ({documents.length})
        </button>
      </div>

      {/* SECTION 1: DOCUMENTS (TÀI LIỆU + NỘI DUNG CHI TIẾT) */}
      {(activeTab === "all" || activeTab === "documents") && (
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl border border-slate-200/80 dark:border-gray-700/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Tài liệu học tập & Sách giáo khoa ({documents.length})
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Bấm &quot;Đọc chi tiết&quot; trên bất kỳ tài liệu nào để xem đầy đủ nội dung từng trang, hoặc bấm &quot;Hỏi AI&quot; để thảo luận trực tiếp với Gia sư AI.
              </p>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Chưa có tài liệu đính kèm nào cho môn học này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const isSgk = doc.fileName.toUpperCase().startsWith("SGK_");
                const chunkCount = doc.chunks?.length || 0;
                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSgk
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              doc.hasFile
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                : isSgk
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            }`}
                          >
                            {doc.hasFile
                              ? "Tài liệu PDF gốc (GV tải lên)"
                              : isSgk
                                ? "Sách giáo khoa"
                                : "Chuyên đề & Tài liệu GV"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Đã tích hợp AI RAG
                          </span>
                        </div>
                        <h3
                          className="text-sm font-bold text-slate-900 dark:text-white break-all"
                          title={doc.fileName}
                        >
                          {doc.fileName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Định dạng: PDF {doc.size ? `• ${doc.size}` : ""}{" "}
                          {chunkCount > 0 ? `• ${chunkCount} đoạn nội dung AI đọc được` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-gray-700/60">
                      <button
                        type="button"
                        onClick={() => openDocumentReader(doc)}
                        className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {doc.hasFile ? "Xem bản PDF gốc" : "Đọc chi tiết tài liệu"}
                      </button>
                      <Link
                        href={buildAiTutorHref(doc.fileName)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-blue-400 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 shrink-0 transition-colors"
                        title="Hỏi Gia sư AI dựa trên tài liệu này"
                      >
                        <Bot className="w-3.5 h-3.5" /> Hỏi AI
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LESSONS (BÀI GIẢNG CHI TIẾT + TRÍCH ĐOẠN SGK) */}
      {(activeTab === "all" || activeTab === "lessons") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chapter List Sidebar */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-800/90 rounded-2xl border border-slate-200/80 dark:border-gray-700/80 p-4 space-y-2 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">
              Mục lục bài giảng ({lessons.length} phần)
            </h2>
            {lessons.length === 0 ? (
              <p className="text-sm text-slate-500 p-3">Chưa có nội dung bài giảng cho môn này.</p>
            ) : (
              lessons.map((lesson, idx) => {
                const isSelected = idx === selectedLessonIndex;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLessonIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                        : "hover:bg-slate-50 dark:hover:bg-gray-700/50 text-slate-700 dark:text-slate-300 border border-transparent"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold leading-snug">{lesson.title}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Lesson Reading Canvas */}
          <div className="lg:col-span-8 bg-white dark:bg-gray-800/90 rounded-2xl border border-slate-200/80 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs space-y-6">
            {currentLesson ? (
              <>
                <div className="border-b border-slate-100 dark:border-gray-700 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Bài giảng {selectedLessonIndex + 1} /{" "}
                      {lessons.length}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                      {currentLesson.title}
                    </h2>
                  </div>
                  <Link
                    href={buildAiTutorHref()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Hỏi AI bài này
                  </Link>
                </div>

                {/* Core Lesson Content */}
                <div className="space-y-3 text-[15.5px] leading-7 text-slate-800 dark:text-slate-200">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 leading-7 whitespace-pre-line">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 space-y-2 mb-3">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 space-y-2 mb-3">{children}</ol>
                      ),
                    }}
                  >
                    {formatReadableContent(currentLesson.content) ||
                      "Nội dung chi tiết đang được giáo viên cập nhật."}
                  </ReactMarkdown>
                </div>

                {/* Full Related Textbook / Document Excerpts */}
                {currentLesson.relatedExcerpts && currentLesson.relatedExcerpts.length > 0 && (
                  <div className="pt-5 border-t border-slate-100 dark:border-gray-700 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Kiến thức chi tiết từ Sách giáo khoa & Chuyên đề
                    </h3>
                    <div className="space-y-3">
                      {currentLesson.relatedExcerpts.map((ex, eIdx) => (
                        <div
                          key={eIdx}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200/70 dark:border-gray-700/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                              {ex.fileName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 font-semibold border border-slate-200 dark:border-gray-700">
                              Trang {ex.page}
                            </span>
                          </div>
                          <p className="text-sm leading-7 text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {formatReadableContent(ex.content)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prev / Next Lesson Controls */}
                <div className="pt-6 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={selectedLessonIndex === 0}
                    onClick={() => setSelectedLessonIndex((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Bài trước
                  </button>
                  <button
                    type="button"
                    disabled={selectedLessonIndex >= lessons.length - 1}
                    onClick={() =>
                      setSelectedLessonIndex((prev) => Math.min(lessons.length - 1, prev + 1))
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Bài tiếp theo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500">
                Chọn một chương bên trái để xem nội dung bài giảng.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Full-Content & PDF Viewer Modal */}
      {readingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div
            className={`bg-white dark:bg-gray-900 rounded-2xl w-full ${
              readingDoc.hasFile && readerMode === "pdf" ? "max-w-5xl h-[92vh]" : "max-w-3xl max-h-[88vh]"
            } flex flex-col shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden transition-all`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-gray-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      readingDoc.hasFile
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}
                  >
                    {readingDoc.hasFile ? "Tài liệu PDF gốc" : "Nội dung chi tiết tài liệu"}
                  </span>
                  {readingDoc.size && (
                    <span className="text-xs text-slate-400">PDF • {readingDoc.size}</span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-all">
                  {readingDoc.fileName}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {readingDoc.hasFile && (
                  <>
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-gray-800 p-1 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setReaderMode("pdf")}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          readerMode === "pdf"
                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-xs"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Bản PDF gốc
                      </button>
                      <button
                        type="button"
                        onClick={() => setReaderMode("text")}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          readerMode === "text"
                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-xs"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Nội dung chữ ({readingDoc.chunks?.length || 0})
                      </button>
                    </div>
                    <a
                      href={`/api/proxy/documents/${readingDoc.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                      title="Mở PDF trong tab mới"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={`/api/proxy/documents/${readingDoc.id}/file?download=1`}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                      title="Tải file PDF về máy"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setReadingDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {readingDoc.hasFile && readerMode === "pdf" ? (
              <div className="flex-1 bg-slate-100 dark:bg-gray-950 overflow-hidden">
                <iframe
                  src={`/api/proxy/documents/${readingDoc.id}/file`}
                  title={readingDoc.fileName}
                  className="w-full h-full min-h-[65vh] border-0"
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {readingDoc.chunks && readingDoc.chunks.length > 0 ? (
                  readingDoc.chunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-800/70 border border-slate-200/80 dark:border-gray-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          Mục {idx + 1} • Trang {chunk.page}
                        </span>
                      </div>
                      <div className="text-[15px] leading-7 text-slate-800 dark:text-slate-200 whitespace-pre-line">
                        {formatReadableContent(chunk.content)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-slate-500 text-sm">
                    {readingDoc.hasFile
                      ? "Tài liệu PDF này dạng ảnh scan nên chưa trích xuất được văn bản. Em hãy chuyển sang tab 'Bản PDF gốc' để xem nguyên trang sách nhé."
                      : "Tài liệu này chưa có đoạn trích văn bản chi tiết. Em có thể bấm nút bên dưới để hỏi Gia sư AI trực tiếp."}
                  </div>
                )}
              </div>
            )}

            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setReadingDoc(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
              <Link
                href={buildAiTutorHref(readingDoc.fileName)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-2 transition-colors shadow-xs"
              >
                <Sparkles className="w-4 h-4" /> Hỏi Gia sư AI về tài liệu này
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
