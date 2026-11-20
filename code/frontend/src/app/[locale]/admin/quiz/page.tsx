"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Loader2,
  FileCheck2,
  CheckCircle2,
  Lock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { notify } from "@/lib/toast";

interface AdminQuizItem {
  id: string;
  title: string;
  subject: string;
  grade?: number | null;
  status: string;
  questionsCount: number;
  attemptsCount: number;
  duration?: number | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Bản nháp",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  PUBLISHED: {
    label: "Đã xuất bản",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  ASSIGNED: {
    label: "Đang giao",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  CLOSED: {
    label: "Đã đóng",
    className:
      "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
};

export default function AdminQuizModerationPage() {
  const [quizzes, setQuizzes] = useState<AdminQuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    let active = true;
    fetchApi<AdminQuizItem[]>("/admin/quizzes")
      .then((res) => {
        if (active) setQuizzes(Array.isArray(res) ? res : []);
      })
      .catch((err) => console.error("Failed to fetch quizzes:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return quizzes.filter((item) => {
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q);
      const matchesSubject =
        subjectFilter === "ALL" || item.subject === subjectFilter;
      const matchesGrade =
        gradeFilter === "ALL" || String(item.grade) === gradeFilter;
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
    });
  }, [quizzes, searchTerm, subjectFilter, gradeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedQuizzes = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredQuizzes.slice(start, start + pageSize);
  }, [filteredQuizzes, safePage]);

  const handleModerateStatus = async (
    quiz: AdminQuizItem,
    nextStatus: "PUBLISHED" | "CLOSED",
  ) => {
    setUpdatingId(quiz.id);
    try {
      await fetchApi(`/admin/quizzes/${quiz.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setQuizzes((prev) =>
        prev.map((item) =>
          item.id === quiz.id ? { ...item, status: nextStatus } : item,
        ),
      );
      notify(
        nextStatus === "CLOSED"
          ? `Đã đóng đề thi "${quiz.title}".`
          : `Đã duyệt mở lại đề thi "${quiz.title}".`,
      );
    } catch (err: any) {
      notify(err?.message || "Không thể cập nhật trạng thái đề thi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteQuiz = async (quiz: AdminQuizItem) => {
    if (
      !confirm(
        `Xóa vĩnh viễn đề thi "${quiz.title}"? Thao tác này không thể hoàn tác.`,
      )
    ) {
      return;
    }
    setUpdatingId(quiz.id);
    try {
      await fetchApi(`/admin/quizzes/${quiz.id}`, { method: "DELETE" });
      setQuizzes((prev) => prev.filter((item) => item.id !== quiz.id));
      notify("Đã xóa đề thi khỏi hệ thống.");
    } catch (err: any) {
      notify(err?.message || "Không thể xóa đề thi.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="w-7 h-7 text-blue-600" />
            Kiểm duyệt Ngân hàng Đề thi
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Giám sát toàn bộ đề trắc nghiệm & tự luận trong trường, kiểm duyệt
            trạng thái phát hành hoặc đóng/gỡ đề không phù hợp.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-gray-100 dark:border-card-border shadow-sm flex flex-col lg:flex-row gap-3 justify-between items-center">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm tên đề thi, môn học..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <option value="ALL">Tất cả môn ({uniqueSubjects.length})</option>
            {uniqueSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setCurrentPage(1);
            }}
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="ASSIGNED">Đang giao</option>
            <option value="CLOSED">Đã đóng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                <th className="px-6 py-4">Tên đề thi</th>
                <th className="px-6 py-4">Môn / Khối</th>
                <th className="px-6 py-4">Số câu / Thời lượng</th>
                <th className="px-6 py-4">Lượt làm</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Kiểm duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-card-border text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải ngân hàng đề thi...
                  </td>
                </tr>
              ) : paginatedQuizzes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Không tìm thấy đề thi nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedQuizzes.map((q) => {
                  const st = STATUS_BADGE[q.status] || {
                    label: q.status,
                    className: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 max-w-sm">
                        <span className="font-semibold text-gray-900 dark:text-white block truncate">
                          {q.title}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {q.subject}
                          </span>
                          {q.grade && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Khối {q.grade}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-bold">{q.questionsCount} câu</span>
                        {q.duration ? (
                          <span className="inline-flex items-center gap-1 ml-2 text-gray-400">
                            <Clock className="w-3 h-3" /> {q.duration} phút
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                        {q.attemptsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status !== "CLOSED" ? (
                            <button
                              type="button"
                              disabled={updatingId === q.id}
                              onClick={() => handleModerateStatus(q, "CLOSED")}
                              title="Đóng / Gỡ tạm thời đề thi"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={updatingId === q.id}
                              onClick={() =>
                                handleModerateStatus(q, "PUBLISHED")
                              }
                              title="Mở xuất bản lại"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={updatingId === q.id}
                            onClick={() => handleDeleteQuiz(q)}
                            title="Xóa đề thi"
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Real Pagination */}
        <div className="border-t border-gray-100 dark:border-card-border p-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Hiển thị {paginatedQuizzes.length} / {filteredQuizzes.length} đề thi
            (Trang {safePage}/{totalPages})
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-primary text-white font-medium text-xs">
              {safePage}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
