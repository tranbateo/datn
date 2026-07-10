import { fetchApi } from '../lib/api-client';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: string;
  grade?: number;
  avatarUrl?: string;
}

export const usersService = {
  getProfile: (): Promise<UserProfile> => {
    return fetchApi('/users/profile');
  },
  
  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> => {
    return fetchApi('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
};
