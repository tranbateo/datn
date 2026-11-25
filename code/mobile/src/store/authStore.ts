import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {
  API_ENDPOINTS,
  getApiBaseUrl,
  isLocalLoopbackApiUrl,
  resetApiBaseUrl,
  setApiBaseUrl,
} from '@/constants/api';
import { clearAllCache } from '@/lib/ttl-cache';

const KEYS = {
  ACCESS_TOKEN: 'aitutor_access_token',
  REFRESH_TOKEN: 'aitutor_refresh_token',
  USER_DATA: 'aitutor_user_data',
  MUST_CHANGE_PWD: 'aitutor_must_change_pwd',
  API_URL_OVERRIDE: 'aitutor_api_url',
  REMEMBER_ME: 'aitutor_remember_me',
  LAST_IDENTIFIER: 'aitutor_last_identifier',
  LAST_ROLE: 'aitutor_last_role',
} as const;

// Expo SecureStore has a 2048-byte limit per value on iOS/Android.
// Never persist large base64 avatar data URLs or nested lists inside SecureStore.
const SECURE_STORE_SAFE_LIMIT = 1800;

function sanitizeUserForStorage(user: MobileUser): string {
  const safeAvatar =
    user.avatarUrl &&
    !user.avatarUrl.startsWith('data:') &&
    user.avatarUrl.length <= 256
      ? user.avatarUrl
      : null;

  const primaryEnrollment = user.classEnrollments?.[0]?.class
    ? [
        {
          class: {
            id: user.classEnrollments[0].class.id,
            name: user.classEnrollments[0].class.name ?? null,
            grade: user.classEnrollments[0].class.grade ?? null,
          },
        },
      ]
    : undefined;

  const compact: MobileUser = {
    id: user.id,
    email: user.email ?? null,
    fullName: user.fullName ?? null,
    phone: user.phone ?? null,
    studentCode: user.studentCode ?? null,
    role: user.role,
    grade: user.grade ?? null,
    avatarUrl: safeAvatar,
    mustChangePassword: Boolean(user.mustChangePassword),
    school: user.school
      ? { id: user.school.id, name: user.school.name ?? null }
      : null,
    ...(primaryEnrollment ? { classEnrollments: primaryEnrollment } : {}),
  };

  const encoded = JSON.stringify(compact);
  if (encoded.length <= SECURE_STORE_SAFE_LIMIT) {
    return encoded;
  }

  // Ultra-compact fallback guaranteed well under 2KB
  const minimal: MobileUser = {
    id: user.id,
    fullName: user.fullName ?? null,
    studentCode: user.studentCode ?? null,
    role: user.role,
    grade: user.grade ?? null,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
  return JSON.stringify(minimal);
}

// In-memory fallback ONLY for web preview (never AsyncStorage per BR-AUTH-002)
const memoryFallback = new Map<string, string>();

// Serialize SecureStore operations to prevent Android KeyStore race conditions
// (especially on Xiaomi/HyperOS when multiple coroutines access KeyStore concurrently)
let secureStoreQueue: Promise<unknown> = Promise.resolve();

function enqueueSecureOp<T>(op: () => Promise<T>): Promise<T> {
  const next = secureStoreQueue.then(op, op);
  secureStoreQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryFallback.get(key) ?? null;
  }
  return enqueueSecureOp(async () => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  });
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback.set(key, value);
    return;
  }
  await enqueueSecureOp(async () => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Single retry for transient Android KeyStore initialization errors
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {
        // Prevent native SecureStore size/keychain exceptions from crashing active UI flows
      }
    }
  });
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback.delete(key);
    return;
  }
  await enqueueSecureOp(async () => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore native Keystore cleanup errors
    }
  });
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

export type MobileRole = 'student' | 'teacher' | 'parent' | null;

function normalizeRole(role?: string | null): MobileRole {
  const lower = (role || '').toLowerCase();
  if (lower === 'student') return 'student';
  if (lower === 'teacher') return 'teacher';
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

export type LoginRoleOption = 'student' | 'teacher' | 'parent';

export interface SetSessionOptions {
  rememberMe?: boolean;
  identifier?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: MobileUser | null;
  role: MobileRole;
  mustChangePassword: boolean;
  rememberMe: boolean;
  lastIdentifier: string;
  lastRole: LoginRoleOption;
  isInitialized: boolean;
  hydrate: () => Promise<void>;
  setSession: (
    accessToken: string | null,
    user: MobileUser | null,
    refreshToken?: string | null,
    mustChangePassword?: boolean,
    options?: SetSessionOptions,
  ) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken?: string | null) => Promise<void>;
  updateUser: (patch: Partial<MobileUser>) => Promise<void>;
  saveCustomApiUrl: (url: string) => Promise<void>;
  resetCustomApiUrl: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  role: null,
  mustChangePassword: false,
  rememberMe: true,
  lastIdentifier: '',
  lastRole: 'student',
  isInitialized: false,

  hydrate: async () => {
    try {
      const savedApiUrl = await secureGet(KEYS.API_URL_OVERRIDE);
      if (savedApiUrl) {
        if (!__DEV__ && isLocalLoopbackApiUrl(savedApiUrl)) {
          // Clear accidental emulator/localhost override in release/OTA builds
          await secureDelete(KEYS.API_URL_OVERRIDE);
          resetApiBaseUrl();
        } else {
          setApiBaseUrl(savedApiUrl);
        }
      }

      const storedRemember = await secureGet(KEYS.REMEMBER_ME);
      const rememberMe = storedRemember !== 'false';
      const storedIdentifier = rememberMe
        ? (await secureGet(KEYS.LAST_IDENTIFIER)) ?? ''
        : '';
      const storedLastRoleRaw = rememberMe ? await secureGet(KEYS.LAST_ROLE) : null;
      const lastRole: LoginRoleOption =
        normalizeRole(storedLastRoleRaw) ?? 'student';

      if (!rememberMe) {
        await secureDelete(KEYS.ACCESS_TOKEN);
        await secureDelete(KEYS.REFRESH_TOKEN);
        await secureDelete(KEYS.USER_DATA);
        await secureDelete(KEYS.MUST_CHANGE_PWD);
        set({
          token: null,
          refreshToken: null,
          user: null,
          role: null,
          mustChangePassword: false,
          rememberMe: false,
          lastIdentifier: '',
          lastRole: 'student',
          isInitialized: true,
        });
        return;
      }

      const storedToken = await secureGet(KEYS.ACCESS_TOKEN);
      const storedRefresh = await secureGet(KEYS.REFRESH_TOKEN);
      const storedUserRaw = await secureGet(KEYS.USER_DATA);
      const storedMustChange = await secureGet(KEYS.MUST_CHANGE_PWD);

      if (!storedToken || !storedUserRaw) {
        set({
          token: null,
          refreshToken: null,
          user: null,
          role: null,
          mustChangePassword: false,
          rememberMe,
          lastIdentifier: storedIdentifier,
          lastRole,
          isInitialized: true,
        });
        return;
      }

      const parsedUser = JSON.parse(storedUserRaw) as MobileUser;
      const role = normalizeRole(parsedUser.role);
      if (!role) {
        await get().logout();
        set({
          rememberMe,
          lastIdentifier: storedIdentifier,
          lastRole,
          isInitialized: true,
        });
        return;
      }

      let activeToken = storedToken;
      let activeRefresh = storedRefresh;

      // Refresh expired access token automatically using stored refresh token
      if (isJwtExpired(storedToken)) {
        if (storedRefresh) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15_000);
            let res: Response;
            try {
              res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AUTH.REFRESH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefresh }),
                signal: controller.signal,
              });
            } finally {
              clearTimeout(timeout);
            }

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
                set({
                  rememberMe,
                  lastIdentifier: storedIdentifier,
                  lastRole: role,
                  isInitialized: true,
                });
                return;
              }
            } else if (res.status === 401 || res.status === 403) {
              // Only wipe session on explicit auth rejection, NOT on transient 5xx/Render cold-start
              await get().logout();
              set({
                rememberMe,
                lastIdentifier: storedIdentifier,
                lastRole: role,
                isInitialized: true,
              });
              return;
            }
          } catch {
            // Keep existing session offline or while server wakes up; next API call will refresh
          }
        } else {
          await get().logout();
          set({
            rememberMe,
            lastIdentifier: storedIdentifier,
            lastRole: role,
            isInitialized: true,
          });
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
        rememberMe,
        lastIdentifier:
          storedIdentifier ||
          parsedUser.studentCode ||
          parsedUser.phone ||
          parsedUser.email ||
          '',
        lastRole: role,
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

  setSession: async (
    accessToken,
    user,
    refreshToken = null,
    mustChangePassword = false,
    options,
  ) => {
    if (!accessToken || !user) {
      await get().logout();
      return;
    }

    const role = normalizeRole(user.role);
    const shouldRemember = options?.rememberMe ?? get().rememberMe;
    const resolvedIdentifier = (
      options?.identifier ||
      user.studentCode ||
      user.phone ||
      user.email ||
      get().lastIdentifier ||
      ''
    ).trim();
    const nextLastRole: LoginRoleOption = role ?? get().lastRole;

    clearAllCache();
    await secureSet(KEYS.REMEMBER_ME, shouldRemember ? 'true' : 'false');

    if (shouldRemember) {
      // Sequential SecureStore writes to avoid Android KeyStore concurrency issues
      await secureSet(KEYS.ACCESS_TOKEN, accessToken);
      await secureSet(KEYS.USER_DATA, sanitizeUserForStorage(user));
      await secureSet(KEYS.MUST_CHANGE_PWD, mustChangePassword ? 'true' : 'false');
      if (refreshToken) {
        await secureSet(KEYS.REFRESH_TOKEN, refreshToken);
      } else {
        await secureDelete(KEYS.REFRESH_TOKEN);
      }
      if (resolvedIdentifier) {
        await secureSet(KEYS.LAST_IDENTIFIER, resolvedIdentifier);
      }
      await secureSet(KEYS.LAST_ROLE, nextLastRole);
    } else {
      // Session-only login: clear persisted credentials so reopening app asks to sign in again
      await secureDelete(KEYS.ACCESS_TOKEN);
      await secureDelete(KEYS.REFRESH_TOKEN);
      await secureDelete(KEYS.USER_DATA);
      await secureDelete(KEYS.MUST_CHANGE_PWD);
      await secureDelete(KEYS.LAST_IDENTIFIER);
      await secureDelete(KEYS.LAST_ROLE);
    }

    set({
      token: accessToken,
      refreshToken,
      user,
      role,
      mustChangePassword,
      rememberMe: shouldRemember,
      lastIdentifier: shouldRemember ? resolvedIdentifier : '',
      lastRole: shouldRemember ? nextLastRole : 'student',
      isInitialized: true,
    });
  },

  updateTokens: async (accessToken, refreshToken) => {
    if (get().rememberMe) {
      await secureSet(KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await secureSet(KEYS.REFRESH_TOKEN, refreshToken);
      }
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
    set({ user: nextUser });
    if (get().rememberMe) {
      await secureSet(KEYS.USER_DATA, sanitizeUserForStorage(nextUser));
    }
  },

  saveCustomApiUrl: async (url) => {
    const cleaned = url.trim().replace(/\/+$/, '');
    if (cleaned) {
      setApiBaseUrl(cleaned);
      await secureSet(KEYS.API_URL_OVERRIDE, cleaned);
    }
  },

  resetCustomApiUrl: async () => {
    resetApiBaseUrl();
    await secureDelete(KEYS.API_URL_OVERRIDE);
  },

  logout: async () => {
    clearAllCache();
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

    await secureDelete(KEYS.ACCESS_TOKEN);
    await secureDelete(KEYS.REFRESH_TOKEN);
    await secureDelete(KEYS.USER_DATA);
    await secureDelete(KEYS.MUST_CHANGE_PWD);

    set({
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      mustChangePassword: false,
    });
  },
}));
