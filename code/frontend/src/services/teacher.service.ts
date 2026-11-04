import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export const teacherService = {
  getStudents: (): Promise<any[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.STUDENTS);
  },
  getClasses: (): Promise<any[]> => {
    return fetchApi('/teacher/classes');
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
  updateDocumentStatus: (id: string | number, status: string): Promise<any> => {
    return fetchApi(`/teacher/documents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  deleteDocument: (id: string | number): Promise<any> => {
    return fetchApi(`/teacher/documents/${id}`, {
      method: 'DELETE',
    });
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
  updateQuizStatus: (id: string | number, status: string): Promise<any> => {
    return fetchApi(`/teacher/quizzes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  overrideAttemptScore: (attemptId: string, score: number, reason: string): Promise<any> => {
    return fetchApi(`/teacher/attempts/${attemptId}/score`, {
      method: 'PATCH',
      body: JSON.stringify({ score, reason }),
    });
  },
  createQuizWithAiQuestions: (data: any): Promise<any> => {
    return fetchApi(API_ENDPOINTS.TEACHER.QUIZZES_AI_BUILD, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
