import { fetchApi } from "@/lib/api-client";

export interface Question {
  id: string;
  quizId: string;
  content: string;
  options: string;
  correctOption?: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  grade: number;
  title: string;
  description: string;
  duration: number;
  createdAt: string;
  questions?: Question[];
}

export interface QuizAttemptResponse {
  attemptId: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
}

export const quizService = {
  async getQuizzesBySubject(subjectId: string): Promise<Quiz[]> {
    return fetchApi(`/quiz/subject/${subjectId}`);
  },

  async getQuizById(quizId: string): Promise<Quiz> {
    return fetchApi(`/quiz/${quizId}`);
  },

  async submitQuiz(quizId: string, answers: { questionId: string; selectedOption: string }[]): Promise<QuizAttemptResponse> {
    return fetchApi(`/quiz/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }
};
