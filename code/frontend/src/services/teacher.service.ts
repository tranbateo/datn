import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export const teacherService = {
  getStudents: (): Promise<Record<string, unknown>[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.STUDENTS);
  },
  getCourses: (): Promise<Record<string, unknown>[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.COURSES);
  },
  getQuestions: (): Promise<Record<string, unknown>[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.QUESTIONS);
  },
  getDocuments: (): Promise<Record<string, unknown>[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.DOCUMENTS);
  }
};
