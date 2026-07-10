import { API_ENDPOINTS } from '@/constants/api';
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
    return fetchApi(API_ENDPOINTS.USERS.PROFILE);
  },
  
  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> => {
    return fetchApi(API_ENDPOINTS.USERS.PROFILE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
};
