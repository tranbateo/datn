import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export const teacherService = {
  getStudents: (): Promise<any[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.STUDENTS);
  },
  getCourses: (): Promise<any[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.COURSES);
  },
  getQuestions: (): Promise<any[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.QUESTIONS);
  },
  getDocuments: (): Promise<any[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.DOCUMENTS);
  },
  createQuestions: (questions: any[]): Promise<any> => {
    return fetchApi(API_ENDPOINTS.TEACHER.QUESTIONS, {
      method: 'POST',
      body: JSON.stringify(questions),
    });
  },
  getQuizzes: (): Promise<any[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.QUIZZES);
  },
  createQuizWithAiQuestions: (data: any): Promise<any> => {
    return fetchApi(API_ENDPOINTS.TEACHER.QUIZZES_AI_BUILD, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};
