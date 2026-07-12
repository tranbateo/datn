import { API_ENDPOINTS } from '@/constants/api';
 
import { fetchApi } from '../lib/api-client';

export interface GamificationProfile {
  userId?: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  lastActive: string | null;
}

export const gamificationService = {
  async getProfile(): Promise<GamificationProfile> {
    return fetchApi("/gamification/profile");
  },

  async getLeaderboard(limit: number = 10): Promise<{
    id: string;
    userId: string;
    xp: number;
    level: number;
    currentStreak: number;
    user: { fullName: string; avatarUrl: string; email: string };
  }[]> {
    return fetchApi(API_ENDPOINTS.GAMIFICATION.LEADERBOARD(limit));
  },
  
  addXp: (amount: number, reason: string): Promise<Record<string, unknown>> => {
    return fetchApi(API_ENDPOINTS.GAMIFICATION.ADD_XP, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }
};
