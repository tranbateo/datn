"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { curriculumService, Subject } from "@/services/curriculum.service";
import { usersService, UserProfile } from "@/services/users.service";
import { quizService, Quiz } from "@/services/quiz.service";
import { Loader2, BookOpen, Clock, Play } from "lucide-react";

export default function PracticeDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    usersService.getProfile()
      .then(user => {
        setProfile(user);
        if (user.grade) {
          return curriculumService.getSubjectsByGrade(user.grade);
        }
        return [];
      })
      .then(subs => {
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubject(subs[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingQuizzes(true);
      quizService.getQuizzesBySubject(selectedSubject)
        .then(q => {
          setQuizzes(q);
          setLoadingQuizzes(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingQuizzes(false);
        });
    }
  }, [selectedSubject]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Luyện tập trắc nghiệm</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Chọn môn học để bắt đầu ôn luyện (Lớp {profile?.grade})</p>
      </div>

      {/* Tabs Môn học */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map(sub => (
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

      {/* Danh sách Quiz */}
      <div className="space-y-4">
        {loadingQuizzes ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            Không có bài kiểm tra nào cho môn học này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {quiz.duration} phút
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">{quiz.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 line-clamp-2">
                  {quiz.description}
                </p>
                <Link 
                  href={`/dashboard/practice/${quiz.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-3 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Bắt đầu làm bài
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
