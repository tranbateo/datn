import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type AuthState = {
  token: string | null;
  user: any | null;
  role: 'student' | 'parent' | null;
  setSession: (token: string | null, user: any | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  role: null,
  setSession: async (token, user) => {
    const role = user?.role?.toLowerCase() || 'student';
    if (token) {
      await SecureStore.setItemAsync('auth-token', token);
      await SecureStore.setItemAsync('user-data', JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync('auth-token');
      await SecureStore.deleteItemAsync('user-data');
    }
    set({ token, user, role });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('auth-token');
    await SecureStore.deleteItemAsync('user-data');
    set({ token: null, user: null, role: null });
  }
}));
