import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS, getApiBaseUrl, setApiBaseUrl } from '@/constants/api';

const KEYS = {
  ACCESS_TOKEN: 'aitutor_access_token',
  REFRESH_TOKEN: 'aitutor_refresh_token',
  USER_DATA: 'aitutor_user_data',
  MUST_CHANGE_PWD: 'aitutor_must_change_pwd',
  API_URL_OVERRIDE: 'aitutor_api_url',
} as const;

// In-memory fallback ONLY for web preview (never AsyncStorage per BR-AUTH-002)
const memoryFallback = new Map<string, string>();

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryFallback.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface MobileUser {
  id: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  studentCode?: string | null;
  role: string;
  grade?: number | null;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
  school?: { id?: string; name?: string | null; code?: string | null } | null;
  classEnrollments?: {
    class?: {
      id?: string;
      name?: string | null;
      grade?: number | null;
      homeroomTeacher?: { fullName?: string | null; email?: string | null } | null;
    } | null;
  }[];
  studentLinks?: {
    id: string;
    relationship?: string | null;
    parent?: {
      id: string;
      fullName?: string | null;
      phone?: string | null;
      email?: string | null;
    } | null;
  }[];
}

export type MobileRole = 'student' | 'parent' | null;

function normalizeRole(role?: string | null): MobileRole {
  const lower = (role || '').toLowerCase();
  if (lower === 'student') return 'student';
  if (lower === 'parent') return 'parent';
  return null;
}

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = JSON.parse(globalThis.atob(padded)) as { exp?: number };
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now() + 15_000;
  } catch {
    return false;
  }
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: MobileUser | null;
  role: MobileRole;
  mustChangePassword: boolean;
  isInitialized: boolean;
  hydrate: () => Promise<void>;
  setSession: (
    accessToken: string | null,
    user: MobileUser | null,
    refreshToken?: string | null,
    mustChangePassword?: boolean,
  ) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken?: string | null) => Promise<void>;
  updateUser: (patch: Partial<MobileUser>) => Promise<void>;
  saveCustomApiUrl: (url: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  role: null,
  mustChangePassword: false,
  isInitialized: false,

  hydrate: async () => {
    try {
      const savedApiUrl = await secureGet(KEYS.API_URL_OVERRIDE);
      if (savedApiUrl) {
        setApiBaseUrl(savedApiUrl);
      }

      const [storedToken, storedRefresh, storedUserRaw, storedMustChange] =
        await Promise.all([
          secureGet(KEYS.ACCESS_TOKEN),
          secureGet(KEYS.REFRESH_TOKEN),
          secureGet(KEYS.USER_DATA),
          secureGet(KEYS.MUST_CHANGE_PWD),
        ]);

      if (!storedToken || !storedUserRaw) {
        set({
          token: null,
          refreshToken: null,
          user: null,
          role: null,
          mustChangePassword: false,
          isInitialized: true,
        });
        return;
      }

      const parsedUser = JSON.parse(storedUserRaw) as MobileUser;
      const role = normalizeRole(parsedUser.role);
      if (!role) {
        await get().logout();
        set({ isInitialized: true });
        return;
      }

      let activeToken = storedToken;
      let activeRefresh = storedRefresh;

      // Refresh expired access token automatically using stored refresh token
      if (isJwtExpired(storedToken)) {
        if (storedRefresh) {
          try {
            const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AUTH.REFRESH}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: storedRefresh }),
            });
            if (res.ok) {
              const refreshed = (await res.json()) as {
                accessToken?: string;
                refreshToken?: string;
              };
              if (refreshed.accessToken) {
                activeToken = refreshed.accessToken;
                activeRefresh = refreshed.refreshToken ?? storedRefresh;
                await secureSet(KEYS.ACCESS_TOKEN, activeToken);
                if (activeRefresh) {
                  await secureSet(KEYS.REFRESH_TOKEN, activeRefresh);
                }
              } else {
                await get().logout();
                set({ isInitialized: true });
                return;
              }
            } else {
              await get().logout();
              set({ isInitialized: true });
              return;
            }
          } catch {
            // Keep existing token offline; next API call will refresh or redirect
          }
        } else {
          await get().logout();
          set({ isInitialized: true });
          return;
        }
      }

      set({
        token: activeToken,
        refreshToken: activeRefresh,
        user: parsedUser,
        role,
        mustChangePassword:
          storedMustChange === 'true' || Boolean(parsedUser.mustChangePassword),
        isInitialized: true,
      });
    } catch {
      set({
        token: null,
        refreshToken: null,
        user: null,
        role: null,
        mustChangePassword: false,
        isInitialized: true,
      });
    }
  },

  setSession: async (accessToken, user, refreshToken = null, mustChangePassword = false) => {
    if (!accessToken || !user) {
      await get().logout();
      return;
    }

    const role = normalizeRole(user.role);
    await Promise.all([
      secureSet(KEYS.ACCESS_TOKEN, accessToken),
      secureSet(KEYS.USER_DATA, JSON.stringify(user)),
      secureSet(KEYS.MUST_CHANGE_PWD, mustChangePassword ? 'true' : 'false'),
      refreshToken
        ? secureSet(KEYS.REFRESH_TOKEN, refreshToken)
        : secureDelete(KEYS.REFRESH_TOKEN),
    ]);

    set({
      token: accessToken,
      refreshToken,
      user,
      role,
      mustChangePassword,
      isInitialized: true,
    });
  },

  updateTokens: async (accessToken, refreshToken) => {
    await secureSet(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await secureSet(KEYS.REFRESH_TOKEN, refreshToken);
    }
    set((state) => ({
      token: accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
    }));
  },

  updateUser: async (patch) => {
    const current = get().user;
    if (!current) return;
    const nextUser = { ...current, ...patch };
    await secureSet(KEYS.USER_DATA, JSON.stringify(nextUser));
    set({ user: nextUser });
  },

  saveCustomApiUrl: async (url) => {
    const cleaned = url.trim().replace(/\/+$/, '');
    if (cleaned) {
      setApiBaseUrl(cleaned);
      await secureSet(KEYS.API_URL_OVERRIDE, cleaned);
    }
  },

  logout: async () => {
    const currentToken = get().token;
    if (currentToken) {
      try {
        await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // Ignore network errors during logout cleanup
      }
    }

    await Promise.all([
      secureDelete(KEYS.ACCESS_TOKEN),
      secureDelete(KEYS.REFRESH_TOKEN),
      secureDelete(KEYS.USER_DATA),
      secureDelete(KEYS.MUST_CHANGE_PWD),
    ]);

    set({
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      mustChangePassword: false,
    });
  },
}));
