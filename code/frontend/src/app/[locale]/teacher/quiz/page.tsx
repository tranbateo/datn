"use client";
import { notify } from "@/lib/toast";

import { Sparkles, CheckCircle2, Lock, Send, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { teacherService } from "@/services/teacher.service";
import { useState, useEffect, useMemo } from "react";
import AiQuizBuilderModal from "@/components/teacher/AiQuizBuilderModal";

interface QuizData {
  id: string | number;
  title: string;
  subject: string;
  status?: string;
  questionsCount: number;
  attemptsCount: number;
  duration: number | null;
  createdAt: string;
}

export default function TeacherQuestionBankPage() {
  const t = useTranslations("Teacher.Quiz");
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Manual Quiz state
  const [manualTitle, setManualTitle] = useState("");
  const [manualDuration, setManualDuration] = useState(15);
  const [manualQuestions, setManualQuestions] = useState([
    {
      content: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
    },
  ]);
  const [savingManual, setSavingManual] = useState(false);

  const handleAiSuccess = async () => {
    loadQuizzes();
  };

  async function loadQuizzes() {
    setLoading(true);
    try {
      const data = await teacherService.getQuizzes();
      if (data) {
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Failed to load quizzes", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleStatusChange = async (quizId: string | number, status: string) => {
    try {
      await teacherService.updateQuizStatus(quizId, status);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status } : q)),
      );
    } catch (err) {
      console.error(err);
      notify("Cập nhật trạng thái đề thi thất bại.");
    }
  };

  const handleAddManualQuestion = () => {
    setManualQuestions((prev) => [
      ...prev,
      { content: "", options: ["", "", "", ""], correctOption: 0, explanation: "" },
    ]);
  };

  const handleRemoveManualQuestion = (idx: number) => {
    if (manualQuestions.length <= 1) return;
    setManualQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateManualQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    setSavingManual(true);
    try {
      await teacherService.createQuizWithAiQuestions({
        title: manualTitle.trim(),
        duration: Number(manualDuration) || 15,
        questions: manualQuestions.map((q) => ({
          content: q.content.trim(),
          options: q.options.map((o) => o.trim()),
          correctOption: Number(q.correctOption),
          explanation: q.explanation.trim() || "Giải thích đáp án bởi Giáo viên.",
        })),
      });
      setIsManualModalOpen(false);
      setManualTitle("");
      setManualQuestions([{ content: "", options: ["", "", "", ""], correctOption: 0, explanation: "" }]);
      await loadQuizzes();
    } catch (err: any) {
      notify(err?.message || "Không thể tạo đề kiểm tra thủ công.");
    } finally {
      setSavingManual(false);
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card-bg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-600" /> Tạo đề thủ công
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
                <option key={subj} value={subj}>{subj}</option>
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
                <th className="px-6 py-4">Môn học</th>
                <th className="px-6 py-4">Trạng thái (BR-QUIZ-001)</th>
                <th className="px-6 py-4">Số câu hỏi</th>
                <th className="px-6 py-4">Lượt làm</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-card-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Đang tải danh sách đề thi...
                  </td>
                </tr>
              ) : filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Chưa có đề thi nào. Hãy nhấn &quot;Tạo đề thủ công&quot; hoặc &quot;AI Quiz Builder&quot; để tạo đề thi!
                  </td>
                </tr>
              ) : filteredQuizzes.map((q) => {
                const status = q.status || "PUBLISHED";
                return (
                  <tr key={q.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{q.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                        {q.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        status === 'DRAFT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        status === 'PUBLISHED' || status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {status === 'DRAFT' && 'Nháp (Chờ duyệt)'}
                        {status === 'PUBLISHED' && 'Đã duyệt (PUBLISHED)'}
                        {status === 'ASSIGNED' && 'Đang mở (ASSIGNED)'}
                        {status === 'CLOSED' && 'Đã đóng (CLOSED)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{q.questionsCount} câu</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.attemptsCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.duration ? `${q.duration} phút` : 'Không giới hạn'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(q.id, 'PUBLISHED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            title="Duyệt và Xuất bản đề thi cho học sinh"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt & Xuất bản
                          </button>
                        )}
                        {status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleStatusChange(q.id, 'ASSIGNED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> Giao bài
                          </button>
                        )}
                        {(status === 'PUBLISHED' || status === 'ASSIGNED') && (
                          <button
                            onClick={() => handleStatusChange(q.id, 'CLOSED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5" /> Đóng đề
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Quiz Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tạo đề kiểm tra thủ công</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateManualQuiz} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên bài kiểm tra *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="VD: Kiểm tra 15 phút Đại số Lớp 9"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian (phút) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    required
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Danh sách câu hỏi ({manualQuestions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddManualQuestion}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
                  </button>
                </div>

                {manualQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 uppercase">Câu hỏi {qIdx + 1}</span>
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

                    <input
                      type="text"
                      required
                      value={q.content}
                      onChange={(e) => {
                        const next = [...manualQuestions];
                        next[qIdx].content = e.target.value;
                        setManualQuestions(next);
                      }}
                      placeholder="Nhập nội dung câu hỏi..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctOption === optIdx}
                            onChange={() => {
                              const next = [...manualQuestions];
                              next[qIdx].correctOption = optIdx;
                              setManualQuestions(next);
                            }}
                            title="Chọn làm đáp án đúng"
                          />
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => {
                              const next = [...manualQuestions];
                              next[qIdx].options[optIdx] = e.target.value;
                              setManualQuestions(next);
                            }}
                            placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const next = [...manualQuestions];
                        next[qIdx].explanation = e.target.value;
                        setManualQuestions(next);
                      }}
                      placeholder="Giải thích đáp án đúng (Tùy chọn)..."
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300"
                    />
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
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {savingManual ? "Đang lưu đề..." : "Lưu đề kiểm tra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AiQuizBuilderModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onSuccess={handleAiSuccess} 
      />
    </div>
  );
}
