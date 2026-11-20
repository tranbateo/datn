import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export interface GamificationProfile {
  userId?: string;
  level: number;
  currentXp: number;
  xp?: number;
  lifetimeXp?: number;
  spendableXp?: number;
  currentLevelMinXp?: number;
  nextLevelXp: number;
  xpInCurrentLevel?: number;
  xpRequiredForNextLevel?: number;
  xpRemainingToNextLevel?: number;
  levelProgressPercent?: number;
  streakDays: number;
  longestStreak?: number;
  lastActive: string | null;
  rank?: number;
  xpRules?: {
    quizCorrectAnswerXp: number;
    aiTutorQuestionXp: number;
    graduationExamMinPercent: number;
    formula: string;
  };
}

export type MasteryStatus = 'strong' | 'developing' | 'weak' | 'unassessed';

export interface SubjectMasteryAnalytics {
  subjectId: string;
  subjectName: string;
  grade: number;
  courseId: string | null;
  attemptsCount: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  trend: 'up' | 'down' | 'stable' | 'none';
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  aiSessionsCount: number;
  aiMessagesCount: number;
  masteryStatus: MasteryStatus;
  recommendation: string;
  weakQuizzes: Array<{ quizId: string; title: string; score: number }>;
  recentMistakes: string[];
}

export interface RecentAttemptSummary {
  id: string;
  quizId: string;
  quizTitle: string;
  subjectId: string | null;
  subjectName: string;
  score: number;
  totalQuestions: number;
  isGraduation: boolean;
  completedAt: string;
}

export interface LearningAnalyticsResponse {
  grade: number;
  className: string | null;
  summary: {
    totalAttempts: number;
    overallAverageScore: number | null;
    totalAiSessions: number;
    strongCount: number;
    developingCount: number;
    weakCount: number;
    unassessedCount: number;
  };
  weakestSubject: {
    subjectId: string;
    subjectName: string;
    grade: number;
    averageScore: number | null;
    masteryStatus: MasteryStatus;
  } | null;
  subjects: SubjectMasteryAnalytics[];
  recentAttempts: RecentAttemptSummary[];
  methodology: {
    strongThreshold: number;
    developingThreshold: number;
    xpPerCorrectAnswer: number;
    xpPerAiQuestion: number;
    levelFormula: string;
  };
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  xp: number;
  lifetimeXp?: number;
  level: number;
  currentStreak: number;
  longestStreak?: number;
  user: {
    fullName: string;
    studentCode?: string | null;
    grade?: number | null;
    className?: string | null;
    avatarUrl?: string | null;
    email: string;
  };
}

export const gamificationService = {
  async getProfile(): Promise<GamificationProfile> {
    return fetchApi(API_ENDPOINTS.GAMIFICATION.PROFILE);
  },

  async getLearningAnalytics(): Promise<LearningAnalyticsResponse> {
    return fetchApi(API_ENDPOINTS.GAMIFICATION.ANALYTICS);
  },

  async getLeaderboard(
    limit: number = 10,
    grade?: number,
  ): Promise<LeaderboardEntry[]> {
    return fetchApi(API_ENDPOINTS.GAMIFICATION.LEADERBOARD(limit, grade));
  },

  addXp: (amount: number, reason: string): Promise<unknown> => {
    return fetchApi(API_ENDPOINTS.GAMIFICATION.ADD_XP, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },
};
