import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '@/lib/api-client';

export interface Question {
  id: string;
  quizId: string;
  content: string;
  options: string[] | string;
  questionType?: 'MULTIPLE_CHOICE' | 'ESSAY';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
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
  status?: string;
  createdAt: string;
  questions?: Question[];
}

export interface QuestionResult {
  questionNumber?: number;
  questionId: string;
  questionContent?: string;
  questionType?: 'MULTIPLE_CHOICE' | 'ESSAY';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
  options?: string[];
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  errorAnalysis?: string | null;
  correction?: string | null;
  explanation?: string | null;
}

export interface QuizAttemptResponse {
  attemptId: string;
  quizId?: string;
  quizTitle?: string;
  score: number;
  normalizedScore?: number;
  totalQuestions: number;
  xpEarned: number;
  completedAt?: string;
  questionResults?: QuestionResult[];
}

export interface QuizAttemptHistoryItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string;
  subjectId: string | null;
  subjectName: string;
  grade: number | null;
  duration: number;
  normalizedScore: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string;
}

export interface QuizAttemptDetailResponse {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string;
  subjectName: string;
  duration: number;
  score: number;
  normalizedScore: number;
  totalQuestions: number;
  completedAt: string;
  quiz: Quiz;
  questionResults: QuestionResult[];
}

export const quizService = {
  async getQuizzesBySubject(subjectId: string): Promise<Quiz[]> {
    return fetchApi(API_ENDPOINTS.QUIZ.BY_SUBJECT(subjectId));
  },

  async getQuizById(quizId: string): Promise<Quiz> {
    return fetchApi(API_ENDPOINTS.QUIZ.DETAIL(quizId));
  },

  async generateRandomQuiz(params: {
    subjectId?: string;
    courseId?: string;
    numQuestions?: number;
    topic?: string;
  }): Promise<Quiz> {
    return fetchApi(API_ENDPOINTS.QUIZ.GENERATE_RANDOM, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getMyAttemptHistory(
    subjectId?: string,
  ): Promise<QuizAttemptHistoryItem[]> {
    return fetchApi(API_ENDPOINTS.QUIZ.MY_ATTEMPTS(subjectId));
  },

  async getAttemptDetail(
    attemptId: string,
  ): Promise<QuizAttemptDetailResponse> {
    return fetchApi(API_ENDPOINTS.QUIZ.ATTEMPT_DETAIL(attemptId));
  },

  async submitQuiz(
    quizId: string,
    answers: {
      questionId: string;
      selectedOption?: string;
      textAnswer?: string;
    }[],
    exitReason?: string,
  ): Promise<QuizAttemptResponse> {
    return fetchApi(API_ENDPOINTS.QUIZ.SUBMIT(quizId), {
      method: 'POST',
      body: JSON.stringify({ answers, exitReason }),
    });
  },
};
