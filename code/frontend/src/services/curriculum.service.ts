import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export interface Subject {
  id: string;
  name: string;
  grade: number;
  description?: string;
}

export const curriculumService = {
  getSubjectsByGrade: (grade: number): Promise<Subject[]> => {
    return fetchApi(API_ENDPOINTS.CURRICULUM.SUBJECTS(grade));
  }
};
