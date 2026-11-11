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

export const usersService = {
  getProfile: (): Promise<UserProfile> => {
    return fetchApi(API_ENDPOINTS.USERS.PROFILE);
  },

  updateProfile: (data: Partial<UserProfile> & { password?: string }): Promise<UserProfile> => {
    return fetchApi(API_ENDPOINTS.USERS.PROFILE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
