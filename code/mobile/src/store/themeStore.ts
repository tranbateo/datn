import { Appearance, Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'aitutor_theme_mode';
let webMemoryTheme: ThemePreference | null = null;

function applyNativeColorScheme(pref: ThemePreference) {
  if (Platform.OS === 'web') return;
  try {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
    }
  } catch {
    // Ignore on platforms/versions where Appearance.setColorScheme is unavailable
  }
}

async function readSavedTheme(): Promise<ThemePreference | null> {
  if (Platform.OS === 'web') {
    return webMemoryTheme;
  }
  try {
    const raw = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveTheme(pref: ThemePreference): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryTheme = pref;
    return;
  }
  try {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, pref);
  } catch {
    // Ignore SecureStore write errors
  }
}

interface ThemeState {
  // Default to crisp Light mode so learners/teachers are never forced into dark mode
  preference: ThemePreference;
  isHydrated: boolean;
  hydrateTheme: () => Promise<void>;
  setPreference: (pref: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'light',
  isHydrated: false,

  hydrateTheme: async () => {
    const saved = await readSavedTheme();
    const resolved: ThemePreference = saved ?? 'light';
    applyNativeColorScheme(resolved);
    set({ preference: resolved, isHydrated: true });
  },

  setPreference: async (pref) => {
    applyNativeColorScheme(pref);
    set({ preference: pref, isHydrated: true });
    await saveTheme(pref);
  },
}));
