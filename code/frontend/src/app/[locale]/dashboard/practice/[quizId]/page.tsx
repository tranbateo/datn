"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { notify } from "@/lib/toast";

import { APP_ROUTES } from "@/constants/routes";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  quizService,
  Quiz,
  QuestionResult,
} from "@/services/quiz.service";
import {
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Wrench,
  FileEdit,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";

export default function TakeQuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const quizId = params.quizId as string;
  const reviewAttemptId = searchParams.get("attemptId");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [exitTerminationNotice, setExitTerminationNotice] = useState<
    string | null
  >(null);
  const [filterMode, setFilterMode] = useState<"all" | "wrong" | "correct">(
    "all",
  );
  const [generatingNewQuiz, setGeneratingNewQuiz] = useState(false);

  const [result, setResult] = useState<{
    attemptId?: string;
    score: number;
    normalizedScore: number;
    total: number;
    xp: number;
    questionResults: Record<string, QuestionResult>;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);

  // Refs dùng cho cơ chế tự động kết thúc bài thi ngay lập tức khi học sinh thoát ra hoặc hết giờ
  const answersRef = useRef<Record<string, string>>({});
  const quizRef = useRef<Quiz | null>(null);
  const hasSubmittedRef = useRef<boolean>(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  // Nạp dữ liệu đề thi hoặc lịch sử bài làm cũ (nếu có ?attemptId=...)
  useEffect(() => {
    setLoading(true);
    if (reviewAttemptId) {
      hasSubmittedRef.current = true;
      quizService
        .getAttemptDetail(reviewAttemptId)
        .then((detail) => {
          setQuiz(detail.quiz);
          const restoredAnswers: Record<string, string> = {};
          const resultMap: Record<string, QuestionResult> = {};

          (detail.questionResults || []).forEach((qr) => {
            if (qr.selectedOption) {
              restoredAnswers[qr.questionId] = qr.selectedOption;
            }
            resultMap[qr.questionId] = qr;
          });

          setAnswers(restoredAnswers);
          setResult({
            attemptId: detail.attemptId,
            score: detail.score,
            normalizedScore: detail.normalizedScore,
            total: detail.totalQuestions,
            xp: detail.score * 10,
            questionResults: resultMap,
          });
          setTimeLeft(0);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      hasSubmittedRef.current = false;
      setResult(null);
      setAnswers({});
      setExitTerminationNotice(null);
      quizService
        .getQuizById(quizId)
        .then((q) => {
          setQuiz(q);
          setTimeLeft((q.duration || 30) * 60);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [quizId, reviewAttemptId]);

  const executeFinalizeExam = useCallback(
    async (reason?: "MANUAL" | "AUTO_SUBMIT_ON_EXIT" | "TIME_EXPIRED") => {
      if (hasSubmittedRef.current || !quizRef.current) return;
      hasSubmittedRef.current = true;
      setSubmitting(true);

      if (reason === "AUTO_SUBMIT_ON_EXIT") {
        setExitTerminationNotice(
          "Bài thi đã tự động kết thúc và chấm điểm ngay lập tức do phát hiện thao tác thoát phòng thi / rời khỏi màn hình làm bài!",
        );
      } else if (reason === "TIME_EXPIRED") {
        setExitTerminationNotice(
          "Đã hết thời gian làm bài! Hệ thống tự động thu bài và trả kết quả ngay lập tức.",
        );
      }

      const currentQuiz = quizRef.current;
      const currentAnswers = answersRef.current;

      const formattedAnswers = (currentQuiz.questions || []).map((q) => {
        const val = (currentAnswers[q.id] || "").trim();
        const isEssay =
          q.questionType === "ESSAY" ||
          (Array.isArray(q.options) && q.options.length === 0) ||
          String(q.content || "").includes("[Tự luận");
        return {
          questionId: q.id,
          selectedOption: isEssay ? undefined : val,
          textAnswer: isEssay ? val : undefined,
        };
      });

      try {
        const res = await quizService.submitQuiz(
          currentQuiz.id,
          formattedAnswers,
          reason,
        );
        const resultMap: Record<string, QuestionResult> = {};
        if (Array.isArray(res.questionResults)) {
          res.questionResults.forEach((qr) => {
            resultMap[qr.questionId] = qr;
          });
        }
        const normScore =
          res.normalizedScore ??
          (res.totalQuestions > 0
            ? Math.round((res.score / res.totalQuestions) * 100)
            : 0);

        setResult({
          attemptId: res.attemptId,
          score: res.score,
          normalizedScore: normScore,
          total: res.totalQuestions,
          xp: res.xpEarned,
          questionResults: resultMap,
        });
      } catch (err) {
        console.error(err);
        hasSubmittedRef.current = false;
        notify("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  // Đồng hồ đếm ngược: khi về 0 tự động thu bài và cho kết quả ngay
  useEffect(() => {
    if (loading || result || reviewAttemptId) return;
    if (timeLeft <= 0) {
      void executeFinalizeExam("TIME_EXPIRED");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result, loading, reviewAttemptId, executeFinalizeExam]);

  // Chế độ phòng thi nghiêm ngặt: Chặn thoát trang (nút Back trình duyệt, chuyển tab, đóng trang)
  // Nếu học sinh thoát ra sẽ kết thúc luôn bài thi và chấm điểm trả kết quả ngay lập tức!
  useEffect(() => {
    if (loading || result || reviewAttemptId || !quiz) return;

    // Đẩy state khóa nút Back của trình duyệt
    window.history.pushState({ examLocked: true }, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState({ examLocked: true }, "", window.location.href);
      void executeFinalizeExam("AUTO_SUBMIT_ON_EXIT");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !hasSubmittedRef.current) {
        void executeFinalizeExam("AUTO_SUBMIT_ON_EXIT");
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasSubmittedRef.current) {
        void executeFinalizeExam("AUTO_SUBMIT_ON_EXIT");
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loading, result, reviewAttemptId, quiz, executeFinalizeExam]);

  const handleAnswerChange = (questionId: string, value: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleManualSubmit = () => {
    void executeFinalizeExam("MANUAL");
  };

  const handleExitDuringExam = () => {
    // Theo đúng yêu cầu: Khi đang làm bài không thể thoát tự do; nếu bấm thoát sẽ kết thúc luôn bài thi và cho kết quả ngay
    void executeFinalizeExam("AUTO_SUBMIT_ON_EXIT");
  };

  const handleStartNewRandomDiffExam = async () => {
    if (!quiz) return;
    setGeneratingNewQuiz(true);
    try {
      const newQuiz = await quizService.generateRandomQuiz({
        subjectId: quiz.subjectId,
        numQuestions: quiz.questions?.length && quiz.questions.length >= 30 ? quiz.questions.length : 35,
      });
      router.push(`/dashboard/practice/${newQuiz.id}`);
    } catch (err) {
      console.error(err);
      notify("Không thể tạo đề mới. Vui lòng thử lại.");
    } finally {
      setGeneratingNewQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy bài kiểm tra</h1>
        <Link
          href={APP_ROUTES.PRACTICE}
          className="text-indigo-600 mt-4 inline-block hover:underline"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.values(answers).filter(
    (v) => v && v.trim().length > 0,
  ).length;
  const totalQuestionCount = quiz.questions?.length || 0;
  const wrongCount = result ? Math.max(0, result.total - result.score) : 0;

  const getDifficultyBadge = (content: string, difficulty?: string) => {
    if (
      difficulty === "ADVANCED" ||
      content.includes("Mức 4") ||
      content.includes("Vận dụng cao")
    ) {
      return {
        label: "Mức 4: Vận dụng cao (Khó)",
        cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      };
    }
    if (
      difficulty === "HARD" ||
      content.includes("Mức 3") ||
      content.includes("Vận dụng")
    ) {
      return {
        label: "Mức 3: Vận dụng (Khá)",
        cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      };
    }
    if (
      difficulty === "MEDIUM" ||
      content.includes("Mức 2") ||
      content.includes("Thông hiểu")
    ) {
      return {
        label: "Mức 2: Thông hiểu (Trung bình)",
        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      };
    }
    return {
      label: "Mức 1: Nhận biết (Dễ)",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
  };

  const stripBracketTags = (text: string) => {
    return text.replace(/^(\[[^\]]+\]\s*)+/, "").trim();
  };

  const filteredQuestions = (quiz.questions || []).filter((q) => {
    if (!result || filterMode === "all") return true;
    const qr = result.questionResults?.[q.id];
    if (filterMode === "wrong") return !qr?.isCorrect;
    if (filterMode === "correct") return Boolean(qr?.isCorrect);
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-in fade-in duration-500 pb-24 md:pb-8">
      {/* Banner Cảnh báo Chế độ Phòng thi Nghiêm ngặt khi đang làm bài */}
      {!result && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">
              Chế độ phòng thi nghiêm ngặt đang bật:
            </span>{" "}
            Học sinh không thể thoát ra ngoài hoặc chuyển tab khi đang làm bài.
            Nếu bấm thoát hoặc rời khỏi trang, hệ thống sẽ{" "}
            <span className="font-bold underline">
              kết thúc luôn bài thi ngay lập tức
            </span>{" "}
            và chấm điểm toàn bộ câu trả lời hiện tại!
          </div>
        </div>
      )}

      {/* Thông báo nếu bài thi bị kết thúc tự động do thoát sớm / hết giờ */}
      {exitTerminationNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300 font-semibold text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{exitTerminationNotice}</span>
        </div>
      )}

      {/* Sticky Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 sticky top-4 z-10">
        <div>
          {result ? (
            <Link
              href={APP_ROUTES.PRACTICE}
              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:underline mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay về Kho đề & Lịch sử đã làm
            </Link>
          ) : (
            <button
              onClick={handleExitDuringExam}
              disabled={submitting}
              className="inline-flex items-center text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Thoát phòng thi (Kết thúc & Chấm điểm luôn)
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {quiz.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Đã trả lời:{" "}
            <span className="font-bold text-indigo-600">
              {answeredCount}/{totalQuestionCount}
            </span>{" "}
            câu hỏi
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!result && (
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? "Đang chấm..." : "Nộp bài ngay"}
            </button>
          )}
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-lg sm:text-xl font-bold ${
              timeLeft < 60 && !result
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
            }`}
          >
            <Clock className="w-5 h-5" />
            {result ? "ĐÃ KẾT THÚC" : formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Thẻ Tổng kết Kết quả & Bộ lọc Câu Sai cần sửa */}
      {result && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 mb-8 shadow-sm space-y-6 animate-in zoom-in duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl ${
                  result.normalizedScore >= 50
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                {result.normalizedScore}đ
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Kết quả bài làm của em
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Đúng{" "}
                  <span className="font-bold text-emerald-600">
                    {result.score}/{result.total}
                  </span>{" "}
                  câu • Sai{" "}
                  <span className="font-bold text-red-600">{wrongCount}</span>{" "}
                  câu • Thưởng{" "}
                  <span className="font-bold text-amber-600">
                    +{result.xp} XP
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Đề thi và kết quả này đã được lưu vào mục &quot;Đề đã làm&quot; của em. Các câu làm đúng được giữ gọn; các câu làm sai có phân tích lỗi sai và hướng dẫn sửa chi tiết bên dưới.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartNewRandomDiffExam}
                disabled={generatingNewQuiz}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                {generatingNewQuiz ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Làm một đề mới khác (30-50 câu)
              </button>
            </div>
          </div>

          {/* Bộ lọc câu hỏi sau khi nộp */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              Tất cả câu hỏi ({result.total})
            </button>
            <button
              onClick={() => setFilterMode("wrong")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === "wrong"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
              }`}
            >
              Chỉ xem câu SAI cần sửa ({wrongCount})
            </button>
            <button
              onClick={() => setFilterMode("correct")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === "correct"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              Câu đã làm ĐÚNG ({result.score})
            </button>
          </div>
        </div>
      )}

      {/* Danh sách Câu hỏi (Trắc nghiệm & Tự luận) */}
      <div className="space-y-6">
        {filteredQuestions.map((q) => {
          const originalIndex = (quiz.questions || []).findIndex(
            (item) => item.id === q.id,
          );
          let options: string[] = [];
          try {
            options =
              typeof q.options === "string" ? JSON.parse(q.options) : q.options;
            if (!Array.isArray(options)) options = [];
          } catch {
            options = [];
          }

          const isEssay =
            q.questionType === "ESSAY" ||
            options.length === 0 ||
            String(q.content || "").includes("[Tự luận");

          const qr = result?.questionResults?.[q.id];
          const isCorrect = Boolean(qr?.isCorrect);
          const correctOption = qr?.correctOption ?? q.correctOption;
          const badge = getDifficultyBadge(q.content, q.difficulty);
          const cleanQuestionText = stripBracketTags(q.content);

          return (
            <div
              key={q.id}
              className={`bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border-2 transition-all ${
                result
                  ? isCorrect
                    ? "border-emerald-200 dark:border-emerald-800/60"
                    : "border-red-300 dark:border-red-800/80"
                  : "border-gray-100 dark:border-gray-800"
              }`}
            >
              {/* Nhãn Số thứ tự, Loại câu hỏi (Trắc nghiệm / Tự luận) & Mức độ (Dễ -> Khó) */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">
                    Câu {originalIndex + 1} / {totalQuestionCount}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isEssay
                        ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isEssay ? "✍️ Tự luận" : "☑️ Trắc nghiệm"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {result && (
                  <div>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-extrabold">
                        <CheckCircle className="w-4 h-4" /> Chính xác — Đã làm đúng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-extrabold">
                        <XCircle className="w-4 h-4" /> Làm sai — Xem phần sửa lỗi bên dưới
                      </span>
                    )}
                  </div>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
                {cleanQuestionText}
              </h3>

              {/* Nếu là câu Trắc nghiệm */}
              {!isEssay ? (
                <div className="space-y-3">
                  {options.map((opt: string, idx: number) => {
                    const isSelected = answers[q.id] === opt;
                    let optionClass =
                      "border-gray-200 dark:border-gray-700 hover:border-indigo-300";
                    let icon = null;

                    if (result) {
                      const isRightOption = correctOption === opt;
                      if (isRightOption) {
                        optionClass =
                          "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
                        icon = (
                          <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
                        );
                      } else if (isSelected && !isRightOption) {
                        optionClass =
                          "border-red-500 bg-red-50 dark:bg-red-900/20";
                        icon = (
                          <XCircle className="w-5 h-5 text-red-500 ml-auto flex-shrink-0" />
                        );
                      } else {
                        optionClass = "opacity-60 border-gray-200 dark:border-gray-800";
                      }
                    } else if (isSelected) {
                      optionClass =
                        "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20";
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => handleAnswerChange(q.id, opt)}
                        className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${optionClass}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${
                            isSelected ? "border-indigo-500" : "border-gray-300"
                          }`}
                        >
                          {isSelected && !result && (
                            <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                          )}
                          {isSelected && result && (
                            <div
                              className={`w-3 h-3 rounded-full ${
                                correctOption === opt
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-sm sm:text-base text-gray-700 dark:text-gray-200 ${
                            isSelected ? "font-semibold" : ""
                          }`}
                        >
                          {opt}
                        </span>
                        {icon}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Nếu là câu Tự luận (Essay) */
                <div className="space-y-3">
                  <div className="relative">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                      <FileEdit className="w-3.5 h-3.5 text-pink-600" />
                      Bài làm tự luận / Đáp số của em:
                    </div>
                    <textarea
                      rows={3}
                      disabled={Boolean(result)}
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Nhập lời giải từng bước hoặc kết quả cuối cùng của em vào đây..."
                      className={`w-full p-4 rounded-2xl border-2 text-sm sm:text-base focus:outline-none transition-all ${
                        result
                          ? isCorrect
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-gray-900 dark:text-white"
                            : "border-red-400 bg-red-50/50 dark:bg-red-900/10 text-gray-900 dark:text-white"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 focus:border-indigo-500 text-gray-900 dark:text-white"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* QUY TẮC SƯ PHẠM: Câu nào ĐÚNG thì thôi; Câu nào SAI thì chỉ ra lỗi sai và sửa cho học sinh */}
              {result && !isCorrect && (
                <div className="mt-5 rounded-2xl border border-red-200 dark:border-red-800/70 overflow-hidden">
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/50 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-extrabold text-red-800 dark:text-red-300 mb-1">
                        Chỉ ra lỗi sai của em:
                      </p>
                      <p className="text-red-700 dark:text-red-300 leading-relaxed">
                        {qr?.errorAnalysis ||
                          `Câu trả lời của em ("${answers[q.id] || "Bỏ trống"}") chưa chính xác.`}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-extrabold text-emerald-800 dark:text-emerald-300">
                        Sửa bài & Hướng dẫn giải đúng cho em:
                      </p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">
                        Đáp án chuẩn: {correctOption}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {qr?.correction || qr?.explanation || q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nút Nộp bài dưới cùng */}
      {!result && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleManualSubmit}
            disabled={submitting || timeLeft === 0}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {submitting
              ? "Đang chấm bài..."
              : `Nộp bài & Chấm điểm (${answeredCount}/${totalQuestionCount} câu)`}
          </button>
        </div>
      )}
    </div>
  );
}
