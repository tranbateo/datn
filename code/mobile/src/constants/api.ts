import Constants from 'expo-constants';
import { Platform } from 'react-native';

function readConfiguredApiUrl(): string | undefined {
  const fromExpoConfig = Constants.expoConfig?.extra?.apiUrl;
  if (typeof fromExpoConfig === 'string' && fromExpoConfig.trim()) {
    return fromExpoConfig.trim();
  }
  const fromManifest2 = (
    Constants.manifest2?.extra as
      | { expoClient?: { extra?: { apiUrl?: unknown } } }
      | undefined
  )?.expoClient?.extra?.apiUrl;
  if (typeof fromManifest2 === 'string' && fromManifest2.trim()) {
    return fromManifest2.trim();
  }
  return undefined;
}

const DEV_FALLBACK_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

const CONFIGURED_API_URL = readConfiguredApiUrl();

const DEFAULT_API_URL: string = (
  process.env.EXPO_PUBLIC_API_URL ||
  (!__DEV__ && CONFIGURED_API_URL ? CONFIGURED_API_URL : undefined) ||
  DEV_FALLBACK_API_URL ||
  CONFIGURED_API_URL ||
  'http://localhost:3001'
).replace(/\/+$/, '');

let runtimeApiBaseUrl: string = DEFAULT_API_URL;

export function isLocalLoopbackApiUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?(\/|$)/i.test(
    url.trim(),
  );
}

export function getDefaultApiBaseUrl(): string {
  return DEFAULT_API_URL;
}

export function getApiBaseUrl(): string {
  return runtimeApiBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  const cleaned = url.trim().replace(/\/+$/, '');
  if (cleaned) {
    runtimeApiBaseUrl = cleaned;
  }
}

export function resetApiBaseUrl(): void {
  runtimeApiBaseUrl = DEFAULT_API_URL;
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_LOGIN_OTP: '/auth/verify-login-otp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FIRST_TIME_CHANGE_PASSWORD: '/auth/first-time-change-password',
    PASSWORD_RESET_REQUEST: '/auth/password-reset-request',
  },
  USERS: {
    PROFILE: '/users/profile',
    AVATAR: '/users/profile/avatar',
    FEEDBACK: '/users/feedback',
  },
  CURRICULUM: {
    SUBJECTS: (grade: number | string) => `/curriculum/subjects?grade=${grade}`,
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    CREATE_LESSON: (courseId: string) => `/courses/${courseId}/lessons`,
    UPDATE_LESSON: (courseId: string, lessonId: string) =>
      `/courses/${courseId}/lessons/${lessonId}`,
    DELETE_LESSON: (courseId: string, lessonId: string) =>
      `/courses/${courseId}/lessons/${lessonId}`,
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
    SEND_MESSAGE_STREAM: (id: string) => `/chat/session/${id}/message-stream`,
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
    LEADERBOARD: (grade?: number) =>
      grade ? `/gamification/leaderboard?grade=${grade}` : '/gamification/leaderboard',
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
    LIST_TEACHER: '/proposals/teacher',
    CREATE: '/proposals',
    UPDATE_STATUS: (id: string) => `/proposals/${id}/status`,
  },
  TEACHER: {
    DASHBOARD_STATS: '/teacher/dashboard/stats',
    CLASSES: '/teacher/classes',
    STUDENTS: '/teacher/students',
    STUDENT_ATTEMPTS: (studentId: string) => `/teacher/students/${studentId}/attempts`,
    RESET_STUDENT_PASSWORD: (studentId: string) =>
      `/teacher/students/${studentId}/reset-password`,
    PASSWORD_RESET_REQUESTS: '/teacher/password-reset-requests',
    PARENTS: '/teacher/parents',
    SEND_NOTIFICATION: '/teacher/notifications/send',
    QUIZZES: '/teacher/quizzes',
    QUIZZES_AI_BUILD: '/teacher/quizzes/ai-build',
    QUIZ_DETAILS: (quizId: string) => `/teacher/quizzes/${quizId}/details`,
    QUIZ_STATUS: (quizId: string) => `/teacher/quizzes/${quizId}/status`,
    OVERRIDE_SCORE: (attemptId: string) => `/teacher/attempts/${attemptId}/score`,
    COURSES: '/teacher/courses',
    DOCUMENTS: '/teacher/documents',
    DOCUMENT_STATUS: (docId: string) => `/teacher/documents/${docId}/status`,
    DOCUMENT_DELETE: (docId: string) => `/teacher/documents/${docId}`,
  },
} as const;
