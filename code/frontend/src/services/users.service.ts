import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  studentCode?: string;
  role: string;
  grade?: number;
  avatarUrl?: string;
}

export function formatClassLabel(className?: string | null, fallbackGrade?: number | null): string {
  if (className && className.trim()) {
    const trimmed = className.trim();
    return /^lớp\b/i.test(trimmed) ? trimmed : `Lớp ${trimmed}`;
  }
  if (fallbackGrade) {
    return `Khối ${fallbackGrade}`;
  }
  return 'Chưa xếp lớp';
}

export function getFallbackAvatar(seed?: string | null): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'User')}`;
}

export async function processAvatarFile(file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP hoặc GIF.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Dung lượng ảnh tối đa là 5MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('File ảnh không hợp lệ.'));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        // Center crop to square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const PROFILE_STORAGE_KEY = 'eduai_student_profile_cache';
const PROFILE_TTL_MS = 120_000; // 2 minutes

let memoryProfileCache: { profile: UserProfile; ts: number } | null = null;
let inflightProfilePromise: Promise<UserProfile> | null = null;

export function getCachedProfileSync(): UserProfile | null {
  if (memoryProfileCache && Date.now() - memoryProfileCache.ts < PROFILE_TTL_MS) {
    return memoryProfileCache.profile;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.profile && Date.now() - (parsed.ts || 0) < PROFILE_TTL_MS) {
          memoryProfileCache = { profile: parsed.profile, ts: parsed.ts };
          return parsed.profile;
        }
      }
    } catch {
      // ignore storage parse error
    }
  }
  return null;
}

export function clearProfileCache(): void {
  memoryProfileCache = null;
  inflightProfilePromise = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(PROFILE_STORAGE_KEY);
      sessionStorage.removeItem('eduai_dashboard_snapshot_v1');
    } catch {
      // ignore
    }
  }
}

export const usersService = {
  getProfile: (forceRefresh = false): Promise<UserProfile> => {
    if (!forceRefresh) {
      const cached = getCachedProfileSync();
      if (cached) {
        return Promise.resolve(cached);
      }
      if (inflightProfilePromise) {
        return inflightProfilePromise;
      }
    }

    inflightProfilePromise = fetchApi<UserProfile>(API_ENDPOINTS.USERS.PROFILE)
      .then((profile) => {
        const now = Date.now();
        memoryProfileCache = { profile, ts: now };
        if (typeof window !== 'undefined') {
          try {
            const existingRaw = sessionStorage.getItem(PROFILE_STORAGE_KEY);
            const existing = existingRaw ? JSON.parse(existingRaw) : {};
            sessionStorage.setItem(
              PROFILE_STORAGE_KEY,
              JSON.stringify({ ...existing, profile, ts: now }),
            );
          } catch {
            // ignore
          }
        }
        inflightProfilePromise = null;
        return profile;
      })
      .catch((err) => {
        inflightProfilePromise = null;
        throw err;
      });

    return inflightProfilePromise;
  },

  updateProfile: async (data: Partial<UserProfile> & { password?: string }): Promise<UserProfile> => {
    const updated = await fetchApi<UserProfile>(API_ENDPOINTS.USERS.PROFILE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    clearProfileCache();
    return updated;
  },
};
