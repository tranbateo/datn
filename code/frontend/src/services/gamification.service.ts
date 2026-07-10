import { fetchApi } from '../lib/api-client';

export interface GamificationProfile {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  lastActive: string | null;
}

export const gamificationService = {
  getProfile: (): Promise<GamificationProfile> => {
    return fetchApi('/gamification/profile');
  },
  
  addXp: (amount: number, reason: string): Promise<any> => {
    return fetchApi('/gamification/add-xp', {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }
};
