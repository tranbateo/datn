import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export const teacherService = {
  getStudents: (): Promise<any[]> => {
    return fetchApi(API_ENDPOINTS.TEACHER.STUDENTS);
  },
  getPasswordResetRequests: (): Promise<any[]> => {
    return fetchApi('/teacher/password-reset-requests');
  },
  resetHomeroomStudentPassword: (studentId: string): Promise<any> => {
    return fetchApi(`/teacher/students/${studentId}/reset-password`, {
      method: 'POST',
    });
  },
  getParents: (): Promise<any[]> => {
    return fetchApi('/teacher/parents');
  },
  sendNotification: (payload: {
    targetType: 'CLASS' | 'STUDENT';
    classId?: string;
    studentId?: string;
    audience: 'PARENTS' | 'STUDENTS' | 'BOTH';
    title: string;
    body: string;
  }): Promise<{
    success: boolean;
    sentCount: number;
    studentRecipientsCount: number;
    parentRecipientsCount: number;
    message: string;
  }> => {
    return fetchApi('/teacher/notifications/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getProposals: (): Promise<any[]> => {
    return fetchApi('/proposals/teacher');
  },
  updateProposalStatus: (id: string, status: 'APPROVED' | 'REJECTED'): Promise<any> => {
    return fetchApi(`/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  getMessages: (userId: string): Promise<any[]> => {
    return fetchApi(`/messages/${userId}`);
  },
  sendMessage: (userId: string, content: string): Promise<any> => {
    return fetchApi(`/messages/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
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
  getQuizDetails: (quizId: string | number): Promise<any> => {
    return fetchApi(`/teacher/quizzes/${quizId}/details`);
  },
  solveManualQuestions: (payload: {
    courseId?: string;
    questions: Array<{
      content: string;
      options?: string[];
      correctOption?: string | number | null;
      explanation?: string | null;
    }>;
  }): Promise<any[]> => {
    return fetchApi('/teacher/quizzes/solve-manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getStudentAttempts: (studentId: string): Promise<any> => {
    return fetchApi(`/teacher/students/${studentId}/attempts`);
  },
  getCourseDetail: (courseId: string): Promise<any> => {
    return fetchApi(`/courses/${courseId}`);
  },
  createLesson: (
    courseId: string,
    payload: { title: string; content?: string; order?: number },
  ): Promise<any> => {
    return fetchApi(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateLesson: (
    courseId: string,
    lessonId: string,
    payload: { title?: string; content?: string; order?: number },
  ): Promise<any> => {
    return fetchApi(`/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteLesson: (courseId: string, lessonId: string): Promise<any> => {
    return fetchApi(`/courses/${courseId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
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
