"use client";
import { notify } from "@/lib/toast";

import {
  Sparkles,
  CheckCircle2,
  Lock,
  Send,
  Plus,
  Trash2,
  X,
  Eye,
  Bot,
  Loader2,
  Edit,
  FileText,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { teacherService } from "@/services/teacher.service";
import { useState, useEffect, useMemo } from "react";
import AiQuizBuilderModal from "@/components/teacher/AiQuizBuilderModal";

interface QuizData {
  id: string | number;
  title: string;
  subject: string;
  grade?: number | null;
  status?: string;
  questionsCount: number;
  attemptsCount: number;
  duration: number | null;
  createdAt: string;
}

interface CourseOption {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  gradeNum?: number | null;
  assignedClasses?: string[];
}

interface ManualQuestionForm {
  questionType: "MULTIPLE_CHOICE" | "ESSAY";
  content: string;
  options: string[];
  correctOption: string;
  explanation: string;
  solvedByAi?: boolean;
}

interface QuizDetailData {
  id: string;
  title: string;
  grade?: number | null;
  status: string;
  duration?: number | null;
  subject?: { id: string; name: string; grade?: number | null } | null;
  questions: Array<{
    id: string;
    content: string;
    options: string[];
    correctOption: string;
    explanation?: string | null;
  }>;
  attempts: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentCode: string;
    className: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }>;
}

export default function TeacherQuestionBankPage() {
  const t = useTranslations("Teacher.Quiz");
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Manual Quiz state (AI-powered grading & auto-solving)
  const [manualTitle, setManualTitle] = useState("");
  const [manualCourseId, setManualCourseId] = useState("");
  const [manualDuration, setManualDuration] = useState(15);
  const [autoSolveWithAi, setAutoSolveWithAi] = useState(true);
  const [solvingPreview, setSolvingPreview] = useState(false);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestionForm[]>([
    {
      questionType: "MULTIPLE_CHOICE",
      content: "",
      options: ["", "", "", ""],
      correctOption: "",
      explanation: "",
    },
  ]);
  const [savingManual, setSavingManual] = useState(false);

  // Quiz Detail & Submissions Modal state
  const [detailModal, setDetailModal] = useState<QuizDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<"questions" | "attempts">("questions");
  const [editingAttempt, setEditingAttempt] = useState<{
    id: string;
    studentName: string;
    score: number;
  } | null>(null);
  const [overrideScore, setOverrideScore] = useState(80);
  const [overrideReason, setOverrideReason] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  const loadQuizzesAndCourses = async () => {
    setLoading(true);
    try {
      const [quizData, courseData] = await Promise.all([
        teacherService.getQuizzes(),
        teacherService.getCourses().catch(() => []),
      ]);
      if (Array.isArray(quizData)) setQuizzes(quizData);
      if (Array.isArray(courseData)) {
        setCourses(courseData);
        if (courseData.length > 0) {
          setManualCourseId((prev) => prev || String(courseData[0].id));
        }
      }
    } catch (error) {
      console.error("Failed to load quizzes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadQuizzesAndCourses();
  }, []);

  const handleStatusChange = async (quizId: string | number, status: string) => {
    try {
      await teacherService.updateQuizStatus(quizId, status);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status } : q)),
      );
      if (detailModal && detailModal.id === String(quizId)) {
        setDetailModal({ ...detailModal, status });
      }
      if (status === "ASSIGNED") {
        notify("Đã giao đề thi và tự động gửi thông báo tới học sinh các lớp phụ trách!");
      } else if (status === "PUBLISHED") {
        notify("Đã duyệt và xuất bản đề thi!");
      }
    } catch (err: any) {
      console.error(err);
      notify(err?.message || "Cập nhật trạng thái đề thi thất bại.");
    }
  };

  const handleOpenQuizDetail = async (quizId: string | number) => {
    setLoadingDetail(true);
    setDetailTab("questions");
    try {
      const detail = await teacherService.getQuizDetails(quizId);
      setDetailModal(detail);
    } catch (err: any) {
      notify(err?.message || "Không thể tải chi tiết đề thi.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddManualQuestion = (type: "MULTIPLE_CHOICE" | "ESSAY") => {
    setManualQuestions((prev) => [
      ...prev,
      {
        questionType: type,
        content: "",
        options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : [],
        correctOption: "",
        explanation: "",
      },
    ]);
  };

  const handleRemoveManualQuestion = (idx: number) => {
    if (manualQuestions.length <= 1) return;
    setManualQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAiSolvePreview = async () => {
    const validQuestions = manualQuestions.filter((q) => q.content.trim());
    if (validQuestions.length === 0) {
      notify("Vui lòng nhập ít nhất 1 câu hỏi trước khi để AI giải.");
      return;
    }
    setSolvingPreview(true);
    try {
      const solved = await teacherService.solveManualQuestions({
        courseId: manualCourseId || undefined,
        questions: manualQuestions.map((q) => ({
          content: q.content.trim(),
          options:
            q.questionType === "MULTIPLE_CHOICE"
              ? q.options.map((o) => o.trim()).filter(Boolean)
              : [],
          correctOption: q.correctOption || undefined,
          explanation: q.explanation || undefined,
        })),
      });

      if (Array.isArray(solved)) {
        setManualQuestions((prev) =>
          prev.map((q, idx) => {
            const s = solved[idx];
            if (!s) return q;
            return {
              ...q,
              correctOption: s.correctOption || q.correctOption,
              explanation: s.explanation || q.explanation,
              solvedByAi: Boolean(s.solvedByAi),
            };
          }),
        );
        notify("AI đã tự giải đáp án và viết lời giải chi tiết! Bạn có thể kiểm tra lại trước khi lưu.");
      }
    } catch (err: any) {
      notify(err?.message || "AI chưa thể giải lúc này, bạn có thể thử lại.");
    } finally {
      setSolvingPreview(false);
    }
  };

  const handleCreateManualQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualCourseId) {
      notify("Vui lòng nhập Tên bài kiểm tra và chọn Khóa học / Khối lớp!");
      return;
    }

    for (let i = 0; i < manualQuestions.length; i++) {
      const q = manualQuestions[i];
      if (!q.content.trim()) {
        notify(`Vui lòng nhập nội dung cho Câu ${i + 1}.`);
        return;
      }
      if (q.questionType === "MULTIPLE_CHOICE") {
        const filledOpts = q.options.map((o) => o.trim()).filter(Boolean);
        if (filledOpts.length < 2) {
          notify(`Câu ${i + 1} (Trắc nghiệm) cần ít nhất 2 phương án trả lời.`);
          return;
        }
      }
    }

    setSavingManual(true);
    try {
      await teacherService.createQuizWithAiQuestions({
        title: manualTitle.trim(),
        courseId: manualCourseId,
        duration: Number(manualDuration) || 15,
        autoSolveWithAi,
        questions: manualQuestions.map((q) => ({
          content: q.content.trim(),
          options:
            q.questionType === "MULTIPLE_CHOICE"
              ? q.options.map((o) => o.trim()).filter(Boolean)
              : [],
          correctOption: q.correctOption.trim(),
          explanation: q.explanation.trim(),
        })),
      });
      notify(
        autoSolveWithAi
          ? "Đã tạo đề thành công! AI đã tự giải đáp án chuẩn & sẵn sàng chấm sửa lỗi cho học sinh (đề đang ở trạng thái Nháp chờ bạn duyệt)."
          : "Đã lưu đề kiểm tra ở trạng thái Nháp (DRAFT)!",
      );
      setIsManualModalOpen(false);
      setManualTitle("");
      setManualQuestions([
        {
          questionType: "MULTIPLE_CHOICE",
          content: "",
          options: ["", "", "", ""],
          correctOption: "",
          explanation: "",
        },
      ]);
      await loadQuizzesAndCourses();
    } catch (err: any) {
      notify(err?.message || "Không thể tạo đề kiểm tra thủ công.");
    } finally {
      setSavingManual(false);
    }
  };

  const handleSaveOverrideScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttempt || !overrideReason.trim() || !detailModal) return;
    setSavingOverride(true);
    try {
      await teacherService.overrideAttemptScore(
        editingAttempt.id,
        Number(overrideScore),
        overrideReason.trim(),
      );
      notify("Đã điều chỉnh điểm và ghi Audit Log.");
      setEditingAttempt(null);
      setOverrideReason("");
      await handleOpenQuizDetail(detailModal.id);
    } catch (err: any) {
      notify(err?.message || "Không thể cập nhật điểm.");
    } finally {
      setSavingOverride(false);
    }
  };

  const subjectOptions = useMemo(() => {
    const s = new Set<string>();
    quizzes.forEach((q) => {
      if (q.subject) s.add(q.subject);
    });
    return Array.from(s);
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSubj = selectedSubject === "all" || q.subject === selectedSubject;
      const matchesStatus = selectedStatus === "all" || (q.status || "PUBLISHED") === selectedStatus;
      return matchesSubj && matchesStatus;
    });
  }, [quizzes, selectedSubject, selectedStatus]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            {t("title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-600" /> Tạo đề thủ công (AI tự chấm)
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-xl text-sm font-medium transition-colors shadow-md shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4" /> AI Quiz Builder
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card-bg rounded-2xl border border-gray-100 dark:border-card-border overflow-hidden shadow-sm">
        {/* Filters */}
        <div className="border-b border-gray-100 dark:border-card-border p-4 flex items-center justify-between overflow-x-auto scrollbar-hide gap-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
            >
              <option value="all">Tất cả môn học</option>
              {subjectOptions.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="PUBLISHED">Đã duyệt (PUBLISHED)</option>
              <option value="ASSIGNED">Đã giao (ASSIGNED)</option>
              <option value="CLOSED">Đã đóng (CLOSED)</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Hiển thị {filteredQuizzes.length} đề thi
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-card-border text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                <th className="px-6 py-4">Tên đề thi</th>
                <th className="px-6 py-4">Môn / Khối</th>
                <th className="px-6 py-4">Trạng thái (BR-QUIZ-001)</th>
                <th className="px-6 py-4">Số câu</th>
                <th className="px-6 py-4">Lượt nộp</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-card-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Đang tải danh sách đề thi...
                  </td>
                </tr>
              ) : filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Chưa có đề thi nào. Hãy nhấn &quot;Tạo đề thủ công&quot; hoặc &quot;AI Quiz Builder&quot; để tạo đề thi!
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map((q) => {
                  const status = q.status || "PUBLISHED";
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {q.title}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Tạo ngày {new Date(q.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                            {q.subject}
                          </span>
                          {q.grade && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              Khối {q.grade}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            status === "DRAFT"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              : status === "PUBLISHED" || status === "ASSIGNED"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {status === "DRAFT" && "Nháp (Chờ duyệt)"}
                          {status === "PUBLISHED" && "Đã duyệt (PUBLISHED)"}
                          {status === "ASSIGNED" && "Đã giao (ASSIGNED)"}
                          {status === "CLOSED" && "Đã đóng (CLOSED)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {q.questionsCount} câu
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {q.attemptsCount} bài
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {q.duration ? `${q.duration} phút` : "Không giới hạn"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleOpenQuizDetail(q.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 transition-colors"
                            title="Xem câu hỏi, đáp án AI & danh sách học sinh nộp bài"
                          >
                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                          </button>
                          {status === "DRAFT" && (
                            <button
                              onClick={() => handleStatusChange(q.id, "PUBLISHED")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              title="Duyệt và Xuất bản đề thi cho học sinh"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                            </button>
                          )}
                          {(status === "PUBLISHED" || status === "DRAFT") && (
                            <button
                              onClick={() => handleStatusChange(q.id, "ASSIGNED")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                              title="Giao bài kiểm tra và tự động gửi thông báo cho học sinh"
                            >
                              <Send className="w-3.5 h-3.5" /> Giao bài
                            </button>
                          )}
                          {(status === "PUBLISHED" || status === "ASSIGNED") && (
                            <button
                              onClick={() => handleStatusChange(q.id, "CLOSED")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" /> Đóng
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Quiz Modal (Teacher enters questions only; AI solves, grades & corrects errors!) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  Tạo đề thủ công (AI tự giải đáp án & chấm sửa lỗi)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Giáo viên chỉ cần nhập đề bài — AI sẽ tự giải đáp án chuẩn, chấm điểm (cả trắc nghiệm & tự luận) và chỉ lỗi sai cho học sinh.
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateManualQuiz}
              className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Chọn Môn học / Khối lớp *
                  </label>
                  <select
                    required
                    value={manualCourseId}
                    onChange={(e) => setManualCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">-- Chọn môn & khối lớp --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                        {c.assignedClasses && c.assignedClasses.length > 0
                          ? ` (${c.assignedClasses.join(", ")})`
                          : c.grade
                            ? ` (${c.grade})`
                            : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tên bài kiểm tra *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="VD: Kiểm tra 15 phút Chương II"
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phút *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    required
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* AI Auto-Solve & Auto-Grade Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-blue-900 dark:text-blue-200">
                  <input
                    type="checkbox"
                    checked={autoSolveWithAi}
                    onChange={(e) => setAutoSolveWithAi(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <span>
                    <strong>AI tự động nhận diện đáp án đúng, chấm điểm & sửa lỗi:</strong>{" "}
                    Giáo viên chỉ cần nhập đề bài (không cần điền đáp án/lời giải). Khi lưu, AI sẽ tự giải đáp án chuẩn để bạn kiểm duyệt trước khi giao cho học sinh.
                  </span>
                </label>
                <button
                  type="button"
                  disabled={solvingPreview}
                  onClick={handleAiSolvePreview}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 disabled:opacity-50 transition-colors"
                >
                  {solvingPreview ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {solvingPreview ? "AI đang giải..." : "AI giải thử ngay"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Danh sách câu hỏi ({manualQuestions.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddManualQuestion("MULTIPLE_CHOICE")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm câu Trắc nghiệm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddManualQuestion("ESSAY")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm câu Tự luận
                    </button>
                  </div>
                </div>

                {manualQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase">
                          Câu {qIdx + 1}
                        </span>
                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const nextType = e.target.value as "MULTIPLE_CHOICE" | "ESSAY";
                            const next = [...manualQuestions];
                            next[qIdx] = {
                              ...next[qIdx],
                              questionType: nextType,
                              options:
                                nextType === "MULTIPLE_CHOICE"
                                  ? next[qIdx].options.length >= 2
                                    ? next[qIdx].options
                                    : ["", "", "", ""]
                                  : [],
                            };
                            setManualQuestions(next);
                          }}
                          className="text-xs font-semibold px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                          <option value="ESSAY">Tự luận (AI tự chấm)</option>
                        </select>
                        {q.solvedByAi && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            AI đã giải
                          </span>
                        )}
                      </div>
                      {manualQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveManualQuestion(qIdx)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      required
                      value={q.content}
                      onChange={(e) => {
                        const next = [...manualQuestions];
                        next[qIdx].content = e.target.value;
                        setManualQuestions(next);
                      }}
                      placeholder={
                        q.questionType === "ESSAY"
                          ? "Nhập đề bài tự luận (VD: Tìm x biết 2x + 5 = 17 và giải thích từng bước)..."
                          : "Nhập nội dung câu hỏi trắc nghiệm..."
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm resize-none"
                    />

                    {q.questionType === "MULTIPLE_CHOICE" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            {!autoSolveWithAi && (
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={Boolean(opt.trim() && q.correctOption === opt.trim())}
                                onChange={() => {
                                  const next = [...manualQuestions];
                                  next[qIdx].correctOption = opt.trim();
                                  setManualQuestions(next);
                                }}
                                title="Chọn làm đáp án đúng"
                              />
                            )}
                            <span className="text-xs font-bold text-gray-400 w-4">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              required={optIdx < 2}
                              value={opt}
                              onChange={(e) => {
                                const next = [...manualQuestions];
                                next[qIdx].options[optIdx] = e.target.value;
                                setManualQuestions(next);
                              }}
                              placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}`}
                              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Preview AI-solved answer or optional manual answer */}
                    {(q.correctOption || !autoSolveWithAi) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <input
                          type="text"
                          value={q.correctOption}
                          onChange={(e) => {
                            const next = [...manualQuestions];
                            next[qIdx].correctOption = e.target.value;
                            setManualQuestions(next);
                          }}
                          placeholder="Đáp án đúng (Để trống nếu muốn AI tự giải)"
                          className="w-full px-3 py-1.5 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-200 font-semibold"
                        />
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => {
                            const next = [...manualQuestions];
                            next[qIdx].explanation = e.target.value;
                            setManualQuestions(next);
                          }}
                          placeholder="Hướng dẫn giải (AI sẽ tự điền nếu để trống)"
                          className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {savingManual && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingManual
                    ? autoSolveWithAi
                      ? "AI đang giải đáp án & lưu đề..."
                      : "Đang lưu đề..."
                    : autoSolveWithAi
                      ? "Lưu đề & Để AI tự giải đáp án"
                      : "Lưu đề kiểm tra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Detail & Student Submissions Modal */}
      {(detailModal || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {loadingDetail || !detailModal ? (
              <div className="p-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {detailModal.subject?.name && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {detailModal.subject.name}
                        </span>
                      )}
                      {detailModal.grade && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Khối {detailModal.grade}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        Trạng thái: <strong>{detailModal.status}</strong>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {detailModal.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setDetailModal(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 pt-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailTab("questions")}
                    className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors flex items-center gap-1.5 ${
                      detailTab === "questions"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Câu hỏi & Đáp án AI ({detailModal.questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab("attempts")}
                    className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors flex items-center gap-1.5 ${
                      detailTab === "attempts"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Học sinh đã nộp bài ({detailModal.attempts.length})
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {detailTab === "questions" ? (
                    detailModal.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2"
                      >
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          Câu {idx + 1}: {q.content}
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect =
                                opt === q.correctOption ||
                                String(oIdx) === String(q.correctOption);
                              return (
                                <div
                                  key={oIdx}
                                  className={`px-3 py-1.5 rounded-lg border ${
                                    isCorrect
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  {String.fromCharCode(65 + oIdx)}. {opt}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          Đáp án chuẩn: {q.correctOption}
                        </div>
                        {q.explanation && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                            <strong>Hướng dẫn giải:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))
                  ) : detailModal.attempts.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      Chưa có học sinh nào trong các lớp bạn phụ trách nộp bài này.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {detailModal.attempts.map((att) => (
                        <div
                          key={att.id}
                          className="py-3 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <span>{att.studentName}</span>
                              {att.studentCode && (
                                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600">
                                  {att.studentCode}
                                </span>
                              )}
                              {att.className && (
                                <span className="text-xs font-semibold text-blue-600">
                                  {att.className}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Nộp lúc {new Date(att.completedAt).toLocaleString("vi-VN")} •{" "}
                              {att.totalQuestions} câu
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-xl text-sm font-extrabold ${
                                att.score >= 80
                                  ? "bg-emerald-50 text-emerald-700"
                                  : att.score >= 60
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {att.score}%
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAttempt({
                                  id: att.id,
                                  studentName: att.studentName,
                                  score: att.score,
                                });
                                setOverrideScore(att.score);
                                setOverrideReason("");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
                            >
                              <Edit className="w-3.5 h-3.5" /> Sửa điểm
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {editingAttempt && (
                  <form
                    onSubmit={handleSaveOverrideScore}
                    className="p-4 border-t border-blue-200 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col sm:flex-row items-end gap-3"
                  >
                    <div className="w-full sm:w-28">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Điểm mới (0-100)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={overrideScore}
                        onChange={(e) => setOverrideScore(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Lý do điều chỉnh cho {editingAttempt.studentName} *
                      </label>
                      <input
                        type="text"
                        required
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="VD: Chấm phúc khảo câu tự luận..."
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingAttempt(null)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={savingOverride}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {savingOverride ? "Đang lưu..." : "Lưu điểm"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <AiQuizBuilderModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={loadQuizzesAndCourses}
      />
    </div>
  );
}
