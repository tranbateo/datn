import { notify } from "@/lib/toast";
import React, { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Save } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api";
import { teacherService } from "@/services/teacher.service";

interface AiQuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (questions: any[]) => void;
}

export default function AiQuizBuilderModal({
  isOpen,
  onClose,
  onSuccess,
}: AiQuizBuilderModalProps) {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<
    Array<{ id: string; title: string; grade?: string | number }>
  >([]);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(35);
  const [duration, setDuration] = useState(40);
  const [includeEssay, setIncludeEssay] = useState(true);
  const [isGraduation, setIsGraduation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  useEffect(() => {
    if (isOpen) {
      teacherService
        .getCourses()
        .then((data) => {
          if (Array.isArray(data)) {
            setCourses(data);
            if (data.length > 0 && !courseId) {
              setCourseId(String(data[0].id));
            }
          }
        })
        .catch((err) => console.error("Failed to load teacher courses", err));
    }
  }, [isOpen, courseId]);

  const handleQuestionCountChange = (count: number) => {
    setNumQuestions(count);
    // Tự động tính thời gian từ 30 - 60 phút dựa trên số lượng câu hỏi (30 - 50 câu)
    if (count <= 30) {
      setDuration(30);
    } else if (count >= 50) {
      setDuration(60);
    } else {
      const autoMins = Math.round((30 + ((count - 30) / 20) * 30) / 5) * 5;
      setDuration(autoMins);
    }
  };

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!title || !courseId) {
      notify("Vui lòng nhập Tên đề thi và chọn Khóa học / Lớp học!");
      return;
    }
    setLoading(true);
    setPreviewData(null);
    try {
      const data = await fetchApi(API_ENDPOINTS.QUIZ.GENERATE, {
        method: "POST",
        body: JSON.stringify({
          courseId,
          topic,
          numQuestions: Number(numQuestions),
          includeEssay,
        }),
      });
      setPreviewData(data as any);
    } catch (err: any) {
      console.error(err);
      notify(err?.message || "Tạo quiz thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setPreviewData(null);
    setTitle("");
    setTopic("");
    onClose();
  };

  const handleSave = async () => {
    if (previewData) {
      setSaving(true);
      try {
        await fetchApi(API_ENDPOINTS.TEACHER.QUIZZES_AI_BUILD, {
          method: "POST",
          body: JSON.stringify({
            title,
            courseId,
            topic,
            numQuestions: Number(numQuestions),
            duration: Number(duration),
            isGraduation,
            questions: previewData,
          }),
        });
        onSuccess(previewData);
        resetAndClose();
      } catch (err) {
        console.error(err);
        notify("Lưu quiz thất bại. Vui lòng thử lại.");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-card-bg rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-card-border flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Quiz Builder (Trắc nghiệm & Tự luận • Dễ → Khó)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sinh đề 30 - 50 câu phân hóa 4 mức độ từ tài liệu RAG của lớp (lưu ở trạng thái DRAFT)
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!previewData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên đề thi *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Đề kiểm tra tổng hợp 45 phút"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Khóa học / Lớp học *
                  </label>
                  {courses.length > 0 ? (
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn khóa học / lớp --</option>
                      {courses.map((c) => {
                        const gradeStr = c.grade ? String(c.grade).trim() : "";
                        const gradeLabel = gradeStr
                          ? /^khối/i.test(gradeStr) || /mọi/i.test(gradeStr)
                            ? `(${gradeStr})`
                            : `(Khối ${gradeStr})`
                          : "";
                        return (
                          <option key={c.id} value={c.id}>
                            {c.title} {gradeLabel}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      placeholder="Nhập ID khóa học"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chủ đề (Topic) - Tùy chọn
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Tổng hợp học kì, Phương trình, Điện học..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian làm bài (30 - 60 Phút)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={90}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Số lượng câu hỏi (Khuyến nghị: 30 - 50 câu)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={numQuestions}
                    onChange={(e) =>
                      handleQuestionCountChange(Number(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <label className="flex items-center cursor-pointer gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={includeEssay}
                      onChange={(e) => setIncludeEssay(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Kết hợp cả Trắc nghiệm (80%) & Tự luận (20%)
                  </label>
                  <label className="flex items-center cursor-pointer gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={isGraduation}
                      onChange={(e) => setIsGraduation(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Đề thi Vượt cấp (Graduation)
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Xem trước & Duyệt {previewData.length} câu hỏi ({duration} phút):
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Sẽ lưu ở trạng thái NHÁP (DRAFT) để giáo viên duyệt trước khi giao
                </span>
              </div>
              {previewData.map((q, i) => {
                const isEssay =
                  !Array.isArray(q.options) || q.options.length === 0;
                return (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      <span className="text-blue-600 font-bold">
                        Câu {i + 1} ({isEssay ? "Tự luận" : "Trắc nghiệm"}):
                      </span>{" "}
                      {q.content}
                    </p>
                    {!isEssay ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string, j: number) => (
                          <div
                            key={j}
                            className={`px-3 py-2 rounded-lg text-sm border ${
                              q.correctOption === opt
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold"
                                : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-lg text-sm border border-pink-300 bg-pink-50 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300">
                        <span className="font-bold">Đáp án / Lời giải chuẩn:</span>{" "}
                        {q.correctOption}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Giải thích:
                      </span>{" "}
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-card-border flex justify-between items-center gap-3 bg-gray-50 dark:bg-card-bg">
          <div>
            {previewData && (
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
              >
                ← Quay lại tạo đề khác
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetAndClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            {!previewData ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? "Đang tạo đề..." : `Tạo ${numQuestions} câu hỏi bằng AI`}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-md shadow-green-500/20 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Đang lưu..." : "Lưu bản nháp (DRAFT)"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
