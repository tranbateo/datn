"use client";

import { APP_ROUTES } from '@/constants/routes';
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { quizService, Quiz } from "@/services/quiz.service";
import { Loader2, ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function TakeQuizPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; xp: number } | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    quizService.getQuizById(quizId)
      .then(q => {
        setQuiz(q);
        setTimeLeft(q.duration * 60);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !result) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, result]);

  const handleOptionSelect = (questionId: string, option: string) => {
    if (result) return; // Prevent changing answer after submit
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    // Check if all questions are answered
    if (Object.keys(answers).length < (quiz.questions?.length || 0)) {
      if (!confirm("Bạn chưa hoàn thành tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài?")) {
        return;
      }
    }

    setSubmitting(true);
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption
    }));

    try {
      const res = await quizService.submitQuiz(quiz.id, formattedAnswers);
      setResult({
        score: res.score,
        total: res.totalQuestions,
        xp: res.xpEarned
      });
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi nộp bài");
    } finally {
      setSubmitting(false);
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
        <Link href={APP_ROUTES.PRACTICE} className="text-indigo-600 mt-4 inline-block hover:underline">Quay lại</Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 sticky top-4 z-10">
        <div>
          <Link href={APP_ROUTES.PRACTICE} className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Trở lại danh sách
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-bold ${
          timeLeft < 60 && !result ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
        }`}>
          <Clock className="w-5 h-5" />
          {result ? '00:00' : formatTime(timeLeft)}
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-6 mb-8 text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Hoàn thành bài thi!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Bạn trả lời đúng <span className="font-bold text-green-600">{result.score}/{result.total}</span> câu hỏi.
          </p>
          <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-4 py-2 rounded-xl font-bold">
            <span className="text-xl">🔥</span> +{result.xp} XP
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions?.map((q, index) => {
          let options = [];
          try {
            options = JSON.parse(q.options);
          } catch {
            options = [q.options]; // fallback
          }

          return (
            <div key={q.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <span className="text-indigo-600 mr-2">Câu {index + 1}:</span>
                {q.content}
              </h3>
              
              <div className="space-y-3">
                {options.map((opt: string, idx: number) => {
                  const isSelected = answers[q.id] === opt;
                  let optionClass = "border-gray-200 dark:border-gray-700 hover:border-indigo-300";
                  let icon = null;

                  if (result) {
                    const isCorrect = q.correctOption === opt;
                    if (isCorrect) {
                      optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                      icon = <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />;
                    } else if (isSelected && !isCorrect) {
                      optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                      icon = <XCircle className="w-5 h-5 text-red-500 ml-auto" />;
                    } else {
                      optionClass = "opacity-50 border-gray-200";
                    }
                  } else if (isSelected) {
                    optionClass = "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20";
                  }

                  return (
                    <div 
                      key={idx}
                      onClick={() => handleOptionSelect(q.id, opt)}
                      className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${optionClass}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${
                        isSelected ? 'border-indigo-500' : 'border-gray-300'
                      }`}>
                        {isSelected && !result && <div className="w-3 h-3 bg-indigo-500 rounded-full" />}
                        {isSelected && result && <div className={`w-3 h-3 rounded-full ${q.correctOption === opt ? 'bg-green-500' : 'bg-red-500'}`} />}
                      </div>
                      <span className={`text-gray-700 dark:text-gray-200 ${isSelected ? 'font-medium' : ''}`}>
                        {opt}
                      </span>
                      {icon}
                    </div>
                  );
                })}
              </div>

              {result && q.explanation && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Giải thích:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!result && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || timeLeft === 0}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {submitting ? 'Đang nộp bài...' : 'Nộp bài thi'}
          </button>
        </div>
      )}
    </div>
  );
}
