import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

let runtimeApiBaseUrl: string = (
  process.env.EXPO_PUBLIC_API_URL ||
  DEFAULT_API_URL ||
  'http://localhost:3001'
).replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  return runtimeApiBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  const cleaned = url.trim().replace(/\/+$/, '');
  if (cleaned) {
    runtimeApiBaseUrl = cleaned;
  }
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FIRST_TIME_CHANGE_PASSWORD: '/auth/first-time-change-password',
    PASSWORD_RESET_REQUEST: '/auth/password-reset-request',
  },
  USERS: {
    PROFILE: '/users/profile',
    FEEDBACK: '/users/feedback',
  },
  CURRICULUM: {
    SUBJECTS: (grade: number | string) => `/curriculum/subjects?grade=${grade}`,
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
  },
  DOCUMENTS: {
    BY_COURSE: (courseId: string) => `/documents/course/${courseId}`,
    FILE: (docId: string) => `/documents/${docId}/file`,
  },
  CHAT: {
    SESSIONS: '/chat/sessions',
    CREATE_SESSION: '/chat/session',
    SESSION_DETAIL: (id: string) => `/chat/session/${id}`,
    SEND_MESSAGE: (id: string) => `/chat/session/${id}/message`,
  },
  QUIZ: {
    BY_SUBJECT: (subjectId: string) => `/quiz/subject/${subjectId}`,
    DETAIL: (quizId: string) => `/quiz/${quizId}`,
    SUBMIT: (quizId: string) => `/quiz/${quizId}/submit`,
    GENERATE_RANDOM: '/quiz/generate-random',
    MY_ATTEMPTS: (subjectId?: string) =>
      subjectId
        ? `/quiz/attempts/my-history?subjectId=${encodeURIComponent(subjectId)}`
        : '/quiz/attempts/my-history',
    ATTEMPT_DETAIL: (attemptId: string) => `/quiz/attempts/${attemptId}`,
  },
  GAMIFICATION: {
    PROFILE: '/gamification/profile',
    ANALYTICS: '/gamification/analytics',
  },
  CALENDAR: {
    LIST: '/calendar',
    DELETE: (id: string) => `/calendar/${id}`,
    OCR: '/calendar/ocr',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
  PARENTS: {
    DASHBOARD: '/parents/dashboard',
    GENERATE_LINK_CODE: '/parents/generate-link-code',
    LINK_STUDENT: '/parents/link-student',
    UNLINK_STUDENT: (studentId: string) => `/parents/link-student/${studentId}`,
    TEACHERS: '/parents/teachers',
    MARK_NOTIFICATION_READ: (id: string) => `/parents/notifications/${id}/read`,
  },
  MESSAGES: {
    THREAD: (teacherId: string) => `/messages/${teacherId}`,
  },
  PROPOSALS: {
    LIST_PARENT: '/proposals/parent',
    CREATE: '/proposals',
  },
} as const;
