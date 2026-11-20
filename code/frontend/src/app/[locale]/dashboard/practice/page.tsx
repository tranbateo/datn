"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { curriculumService, Subject } from "@/services/curriculum.service";
import { usersService, UserProfile } from "@/services/users.service";
import {
  quizService,
  Quiz,
  QuizAttemptHistoryItem,
} from "@/services/quiz.service";
import { notify } from "@/lib/toast";
import {
  Loader2,
  BookOpen,
  Clock,
  Play,
  Sparkles,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  Layers,
} from "lucide-react";

function PracticeDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subjectId");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"exams" | "history">("exams");

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistoryItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Cấu hình tạo đề ngẫu nhiên 30 - 50 câu
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(35);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [generatingRandom, setGeneratingRandom] = useState(false);

  useEffect(() => {
    usersService
      .getProfile()
      .then((user) => {
        setProfile(user);
        if (user.grade) {
          return curriculumService.getSubjectsByGrade(user.grade);
        }
        return [];
      })
      .then((subs) => {
        setSubjects(subs);
        if (subs.length > 0) {
          const matched =
            initialSubjectId && subs.find((s) => s.id === initialSubjectId);
          setSelectedSubject(matched ? matched.id : subs[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [initialSubjectId]);

  useEffect(() => {
    if (selectedSubject) {
      setLoadingQuizzes(true);
      quizService
        .getQuizzesBySubject(selectedSubject)
        .then((q) => {
          setQuizzes(q);
          setLoadingQuizzes(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingQuizzes(false);
        });

      setLoadingHistory(true);
      quizService
        .getMyAttemptHistory(selectedSubject)
        .then((history) => {
          setAttemptHistory(Array.isArray(history) ? history : []);
          setLoadingHistory(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingHistory(false);
        });
    }
  }, [selectedSubject]);

  const handleGenerateRandomExam = async () => {
    if (!selectedSubject) {
      notify("Vui lòng chọn một môn học trước khi tạo đề!");
      return;
    }

    setGeneratingRandom(true);
    try {
      const randomCounts = [30, 35, 40, 45, 50];
      const finalCount =
        selectedQuestionCount === 0
          ? randomCounts[Math.floor(Math.random() * randomCounts.length)]
          : selectedQuestionCount;

      const createdQuiz = await quizService.generateRandomQuiz({
        subjectId: selectedSubject,
        numQuestions: finalCount,
        topic: customTopic.trim() || undefined,
      });

      router.push(`/dashboard/practice/${createdQuiz.id}`);
    } catch (err: any) {
      console.error(err);
      notify(err?.message || "Không thể tạo đề thi ngẫu nhiên. Vui lòng thử lại.");
    } finally {
      setGeneratingRandom(false);
    }
  };

  const getEstimatedMinutes = (qCount: number) => {
    if (qCount === 0) return "30 - 60 phút";
    if (qCount <= 30) return "30 phút";
    if (qCount >= 50) return "60 phút";
    const m = Math.round((30 + ((qCount - 30) / 20) * 30) / 5) * 5;
    return `${m} phút`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Luyện tập & Kiểm tra (Trắc nghiệm + Tự luận)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Mỗi lần làm đề là một đề ngẫu nhiên mới (30 - 50 câu • Dễ → Khó) — Lưu trữ toàn bộ đề cũ & sửa lỗi chi tiết (Lớp{" "}
            {profile?.grade})
          </p>
        </div>

        {/* Chuyển đổi giữa Kho đề và Lịch sử đề đã làm */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl self-start">
          <button
            onClick={() => setActiveTab("exams")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "exams"
                ? "bg-white dark:bg-gray-900 text-indigo-600 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Kho đề & Tạo đề mới
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-white dark:bg-gray-900 text-indigo-600 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <History className="w-4 h-4" />
            Đề đã làm ({attemptHistory.length})
          </button>
        </div>
      </div>

      {/* Tabs Môn học */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubject(sub.id)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${
              selectedSubject === sub.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-indigo-200"
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Khung Tạo Đề Ngẫu Nhiên 30 - 50 câu (Trắc nghiệm + Tự luận, Dễ -> Khó) */}
      {activeTab === "exams" && (
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                AI Sinh Đề Độc Lập Mỗi Lần Thi
              </div>
              <h2 className="text-2xl font-extrabold">
                Tạo đề thi ngẫu nhiên môn {currentSubjectObj?.name || ""} (Lớp{" "}
                {profile?.grade})
              </h2>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Đề thi gồm cả <strong>Trắc nghiệm (80%)</strong> và{" "}
                <strong>Tự luận (20%)</strong> được phân bố theo 4 mức độ từ{" "}
                <strong>Nhận biết (Dễ) → Thông hiểu → Vận dụng → Vận dụng cao (Khó)</strong>.
                Khi vào phòng thi sẽ khóa thoát trang; nếu thoát sớm hệ thống sẽ kết thúc và chấm điểm ngay!
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-3 min-w-[300px]">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1">
                  Độ dài đề & Thời gian tự động
                </label>
                <select
                  value={selectedQuestionCount}
                  onChange={(e) => setSelectedQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white text-gray-900 font-semibold text-sm focus:outline-none"
                >
                  <option value={0}>Ngẫu nhiên (30 - 50 câu • 30 - 60 phút)</option>
                  <option value={30}>30 câu (24 Trắc nghiệm + 6 Tự luận • 30 phút)</option>
                  <option value={35}>35 câu (28 Trắc nghiệm + 7 Tự luận • 40 phút)</option>
                  <option value={40}>40 câu (32 Trắc nghiệm + 8 Tự luận • 45 phút)</option>
                  <option value={45}>45 câu (36 Trắc nghiệm + 9 Tự luận • 55 phút)</option>
                  <option value={50}>50 câu (40 Trắc nghiệm + 10 Tự luận • 60 phút)</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Chuyên đề muốn tập trung (tùy chọn)..."
                  className="w-full px-3 py-2 rounded-xl bg-white/90 text-gray-900 text-sm placeholder:text-gray-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateRandomExam}
                disabled={generatingRandom}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-extrabold py-3 px-4 rounded-xl transition-all shadow-lg disabled:opacity-60"
              >
                {generatingRandom ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {generatingRandom
                  ? "Đang sinh đề 30-50 câu..."
                  : `Bắt đầu làm đề mới (${getEstimatedMinutes(selectedQuestionCount)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nội dung Tab 1: Danh sách đề của môn học */}
      {activeTab === "exams" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Danh sách đề thi môn {currentSubjectObj?.name || ""}
            </h3>
            <span className="text-xs text-gray-500">
              Hiển thị {quizzes.length} đề thi hiện có
            </span>
          </div>

          {loadingQuizzes ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Chưa có đề kiểm tra nào. Hãy bấm nút &quot;Bắt đầu làm đề mới&quot; ở trên để tạo đề!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => {
                const qCount = quiz.questions?.length || 0;
                return (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        {qCount > 0 && (
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
                            {qCount} câu
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          {quiz.duration} phút
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 line-clamp-3">
                      {quiz.description}
                    </p>
                    <Link
                      href={`/dashboard/practice/${quiz.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-3 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Vào phòng thi
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Nội dung Tab 2: Lịch sử các đề đã làm của học sinh */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Lịch sử đề đã làm & Kết quả lưu trữ ({attemptHistory.length})
            </h3>
            <button
              onClick={handleGenerateRandomExam}
              disabled={generatingRandom}
              className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" /> Làm thêm đề mới khác
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : attemptHistory.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-800 space-y-3">
              <History className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-gray-600 dark:text-gray-300 font-semibold">
                Em chưa có bài làm nào được lưu ở môn học này.
              </p>
              <p className="text-sm text-gray-400">
                Mọi đề thi em đã làm sẽ được lưu lại đầy đủ tại đây kèm kết quả và phần chữa lỗi sai chi tiết.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attemptHistory.map((item) => (
                <div
                  key={item.attemptId}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {item.subjectName} • Khối {item.grade || profile?.grade}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.completedAt
                          ? new Date(item.completedAt).toLocaleString("vi-VN")
                          : ""}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                      {item.quizTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                          item.normalizedScore >= 50
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        Điểm: {item.normalizedScore}/100
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> Đúng:{" "}
                        {item.correctCount}/{item.totalQuestions} câu
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                        <XCircle className="w-4 h-4" /> Sai: {item.wrongCount} câu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Link
                      href={`/dashboard/practice/${item.quizId}?attemptId=${item.attemptId}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Xem lại đề cũ & Sửa các câu sai
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PracticeDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PracticeDashboardContent />
    </Suspense>
  );
}
