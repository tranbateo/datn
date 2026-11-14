import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export interface Subject {
  id: string;
  name: string;
  grade: number;
  description?: string;
}

const subjectsMemoryCache = new Map<number, { data: Subject[]; ts: number }>();
const SUBJECTS_TTL_MS = 300_000; // 5 minutes

export const curriculumService = {
  getSubjectsByGrade: async (grade: number): Promise<Subject[]> => {
    const cached = subjectsMemoryCache.get(grade);
    if (cached && Date.now() - cached.ts < SUBJECTS_TTL_MS) {
      return cached.data;
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(`eduai_subjects_grade_${grade}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.data) && Date.now() - (parsed.ts || 0) < SUBJECTS_TTL_MS) {
            subjectsMemoryCache.set(grade, parsed);
            return parsed.data;
          }
        }
      } catch {
        // ignore
      }
    }
    const data = await fetchApi<Subject[]>(API_ENDPOINTS.CURRICULUM.SUBJECTS(grade));
    const entry = { data, ts: Date.now() };
    subjectsMemoryCache.set(grade, entry);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`eduai_subjects_grade_${grade}`, JSON.stringify(entry));
      } catch {
        // ignore
      }
    }
    return data;
  },
};
