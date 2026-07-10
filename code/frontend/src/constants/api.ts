export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  USERS: {
    PROFILE: '/users/profile',
  },
  QUIZ: {
    BY_SUBJECT: (subjectId: string | number) => `/quiz/subject/${subjectId}`,
    DETAIL: (quizId: string | number) => `/quiz/${quizId}`,
    SUBMIT: (quizId: string | number) => `/quiz/${quizId}/submit`,
  },
  GAMIFICATION: {
    PROFILE: '/gamification/profile',
    LEADERBOARD: (limit: number) => `/gamification/leaderboard?limit=${limit}`,
    ADD_XP: '/gamification/add-xp',
  },
  CURRICULUM: {
    SUBJECTS: (grade: number | string) => `/curriculum/subjects?grade=${grade}`,
  },
  CHAT: {
    MESSAGE: '/chat-rag/message',
    SESSION: '/chat/session',
  },
  COURSES: {
    LIST: '/courses',
  },
  CALENDAR: {
    LIST: '/calendar',
    OCR: '/calendar/ocr',
  },
  DOCUMENTS: {
    LIST: '/documents',
    UPLOAD: (courseId: string | number) => `/documents/upload/${courseId}`,
  }
} as const;
