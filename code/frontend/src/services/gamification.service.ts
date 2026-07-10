/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchApi } from '../lib/api-client';

export interface GamificationProfile {
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
    return fetchApi(`/gamification/leaderboard?limit=${limit}`);
  },
  
  addXp: (amount: number, reason: string): Promise<any> => {
    return fetchApi('/gamification/add-xp', {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }
};
