import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '@/lib/api-client';
import type { MobileUser } from '@/store/authStore';

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  mustChangePassword?: boolean;
  requireOtp?: boolean;
  email?: string;
  message?: string;
  user: MobileUser;
}

export interface Subject {
  id: string;
  name: string;
  grade: number;
  description?: string | null;
}

export interface CourseItem {
  id: string;
  title: string;
  description?: string | null;
  grade?: number | null;
  subject?: { id: string; name: string } | null;
  teacher?: { id?: string; fullName?: string | null } | null;
  _count?: { lessons?: number; documents?: number };
  lessons?: {
    id: string;
    title: string;
    content?: string | null;
    order?: number;
    videoUrl?: string | null;
  }[];
}

export interface CourseDocument {
  id: string;
  fileName: string;
  fileSize?: string | null;
  status?: string;
  createdAt?: string;
  hasFile?: boolean;
}

export interface RagCitation {
  documentId?: string;
  fileName?: string;
  title?: string;
  page?: number | string | null;
  lessonTitle?: string;
  snippet?: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | string;
  content: string;
  imageUrl?: string | null;
  citations?: RagCitation[] | null;
  createdAt?: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  subjectId?: string | null;
  subject?: { id: string; name: string; grade?: number } | null;
  updatedAt?: string;
  createdAt?: string;
  messages?: ChatMessageItem[];
}

export interface Question {
  id: string;
  quizId: string;
  content: string;
  options: string[] | string;
  questionType?: 'MULTIPLE_CHOICE' | 'ESSAY';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
  correctOption?: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  grade: number;
  title: string;
  description?: string | null;
  duration: number;
  status?: string;
  createdAt?: string;
  questions?: Question[];
}

export interface QuestionResult {
  questionNumber?: number;
  questionId: string;
  questionContent?: string;
  questionType?: 'MULTIPLE_CHOICE' | 'ESSAY';
  difficulty?: string;
  options?: string[];
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  errorAnalysis?: string | null;
  correction?: string | null;
  explanation?: string | null;
}

export interface QuizSubmitResponse {
  attemptId: string;
  quizId?: string;
  quizTitle?: string;
  score: number;
  normalizedScore?: number;
  totalQuestions: number;
  xpEarned: number;
  completedAt?: string;
  questionResults?: QuestionResult[];
}

export interface QuizAttemptHistoryItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  subjectName: string;
  grade: number | null;
  duration: number;
  normalizedScore: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  completedAt: string;
}

export interface QuizAttemptDetail {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  subjectName: string;
  duration: number;
  score: number;
  normalizedScore: number;
  totalQuestions: number;
  completedAt: string;
  quiz: Quiz;
  questionResults: QuestionResult[];
}

export interface GamificationProfile {
  level: number;
  currentXp: number;
  xp?: number;
  lifetimeXp?: number;
  nextLevelXp: number;
  streakDays: number;
  longestStreak?: number;
  levelProgressPercent?: number;
}

export type MasteryStatus = 'strong' | 'developing' | 'weak' | 'unassessed';

export interface SubjectMastery {
  subjectId: string;
  subjectName: string;
  grade: number;
  attemptsCount: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  masteryStatus: MasteryStatus;
  recommendation: string;
  recentMistakes: string[];
}

export interface LearningAnalytics {
  grade: number;
  className: string | null;
  summary: {
    totalAttempts: number;
    overallAverageScore: number | null;
    totalAiSessions: number;
    strongCount: number;
    developingCount: number;
    weakCount: number;
    unassessedCount: number;
  };
  weakestSubject: {
    subjectId: string;
    subjectName: string;
    averageScore: number | null;
    masteryStatus: MasteryStatus;
  } | null;
  subjects: SubjectMastery[];
  recentAttempts: {
    id: string;
    quizId: string;
    quizTitle: string;
    subjectName: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  startTime: string;
  endTime: string;
  color?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface ParentTeacherItem {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  roles?: string[];
  roleLabels?: string[];
  studentRoles?: {
    studentId: string;
    studentName: string;
    className?: string | null;
    isHomeroom?: boolean;
    roleLabel: string;
  }[];
  studentIds?: string[];
  isHomeroom?: boolean;
}

export interface ParentDashboardData {
  parentNotifications?: NotificationItem[];
  students: {
    relationship?: string;
    student: {
      id: string;
      fullName: string;
      studentCode?: string | null;
      grade: number;
      className?: string | null;
      homeroomTeacher?: {
        id: string;
        fullName: string;
        email: string;
      } | null;
      school?: { id: string; name: string; code: string } | null;
      gamificationProfile?: {
        xp?: number;
        lifetimeXp?: number;
        level: number;
        currentStreak?: number;
        longestStreak?: number;
      };
    };
    summary?: {
      totalAttempts: number;
      overallAverageScore: number | null;
      strongCount: number;
      weakCount: number;
    };
    subjectAnalytics?: {
      subjectId: string;
      subjectName: string;
      attemptsCount: number;
      averageScore: number | null;
      bestScore: number | null;
      masteryStatus: MasteryStatus;
    }[];
    recentQuizzes: {
      id?: string;
      quiz?: { title: string };
      score: number;
      startedAt: string;
    }[];
    upcomingEvents: CalendarEvent[];
    recentNotifications: NotificationItem[];
  }[];
}

export interface DirectMessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; fullName?: string | null; role?: string };
}

export interface ProposalItem {
  id: string;
  title: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  teacherReply?: string | null;
  createdAt: string;
  teacher?: { id: string; fullName?: string | null } | null;
  student?: { id: string; fullName?: string | null } | null;
}

export function formatClassLabel(
  className?: string | null,
  fallbackGrade?: number | null,
): string {
  if (className && className.trim()) {
    const trimmed = className.trim();
    return /^lớp\b/i.test(trimmed) ? trimmed : `Lớp ${trimmed}`;
  }
  if (fallbackGrade) return `Khối ${fallbackGrade}`;
  return 'Chưa xếp lớp';
}

export function parseQuestionOptions(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export const authApi = {
  login: (identifier: string, password: string) =>
    fetchApi<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ identifier, email: identifier, password }),
    }),

  firstTimeChangePassword: (currentPassword: string, newPassword: string) =>
    fetchApi<LoginResponse>(API_ENDPOINTS.AUTH.FIRST_TIME_CHANGE_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  requestPasswordReset: (payload: {
    role: 'STUDENT' | 'PARENT';
    identifier: string;
    reason?: string;
  }) =>
    fetchApi<{
      success: boolean;
      role: string;
      handlerText: string;
      message: string;
    }>(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    }),
};

export const usersApi = {
  getProfile: () => fetchApi<MobileUser>(API_ENDPOINTS.USERS.PROFILE),

  updateProfile: (payload: {
    fullName?: string;
    phone?: string;
    password?: string;
    avatarUrl?: string;
  }) =>
    fetchApi<MobileUser>(API_ENDPOINTS.USERS.PROFILE, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  submitFeedback: (category: string, content: string) =>
    fetchApi<{ success?: boolean }>(API_ENDPOINTS.USERS.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify({ category, content }),
    }),
};

export const curriculumApi = {
  getSubjectsByGrade: (grade: number) =>
    fetchApi<Subject[]>(API_ENDPOINTS.CURRICULUM.SUBJECTS(grade)),
};

export const coursesApi = {
  list: () => fetchApi<CourseItem[]>(API_ENDPOINTS.COURSES.LIST),
  detail: (id: string) => fetchApi<CourseItem>(API_ENDPOINTS.COURSES.DETAIL(id)),
  documents: (courseId: string) =>
    fetchApi<CourseDocument[]>(API_ENDPOINTS.DOCUMENTS.BY_COURSE(courseId)),
};

export const chatApi = {
  getSessions: () => fetchApi<ChatSessionItem[]>(API_ENDPOINTS.CHAT.SESSIONS),

  createSession: (payload: { title?: string; subjectId?: string }) =>
    fetchApi<ChatSessionItem>(API_ENDPOINTS.CHAT.CREATE_SESSION, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSessionHistory: (id: string) =>
    fetchApi<ChatSessionItem>(API_ENDPOINTS.CHAT.SESSION_DETAIL(id)),

  sendMessage: (
    sessionId: string,
    content: string,
    image?: { uri: string; name?: string; type?: string } | null,
  ) => {
    if (image) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('image', {
        uri: image.uri,
        name: image.name || 'homework.jpg',
        type: image.type || 'image/jpeg',
      } as unknown as Blob);
      return fetchApi<{
        userMsg: ChatMessageItem;
        aiMsg: ChatMessageItem;
        citations: RagCitation[];
      }>(API_ENDPOINTS.CHAT.SEND_MESSAGE(sessionId), {
        method: 'POST',
        body: formData,
        timeoutMs: 90_000,
      });
    }

    return fetchApi<{
      userMsg: ChatMessageItem;
      aiMsg: ChatMessageItem;
      citations: RagCitation[];
    }>(API_ENDPOINTS.CHAT.SEND_MESSAGE(sessionId), {
      method: 'POST',
      body: JSON.stringify({ content }),
      timeoutMs: 90_000,
    });
  },
};

export const quizApi = {
  getBySubject: (subjectId: string) =>
    fetchApi<Quiz[]>(API_ENDPOINTS.QUIZ.BY_SUBJECT(subjectId)),

  getById: (quizId: string) => fetchApi<Quiz>(API_ENDPOINTS.QUIZ.DETAIL(quizId)),

  generateRandom: (params: {
    subjectId: string;
    numQuestions: number;
    topic?: string;
  }) =>
    fetchApi<Quiz>(API_ENDPOINTS.QUIZ.GENERATE_RANDOM, {
      method: 'POST',
      body: JSON.stringify(params),
      timeoutMs: 120_000,
    }),

  submit: (
    quizId: string,
    answers: {
      questionId: string;
      selectedOption?: string;
      textAnswer?: string;
    }[],
    exitReason?: string,
  ) =>
    fetchApi<QuizSubmitResponse>(API_ENDPOINTS.QUIZ.SUBMIT(quizId), {
      method: 'POST',
      body: JSON.stringify({ answers, exitReason }),
      timeoutMs: 90_000,
    }),

  getHistory: (subjectId?: string) =>
    fetchApi<QuizAttemptHistoryItem[]>(API_ENDPOINTS.QUIZ.MY_ATTEMPTS(subjectId)),

  getAttemptDetail: (attemptId: string) =>
    fetchApi<QuizAttemptDetail>(API_ENDPOINTS.QUIZ.ATTEMPT_DETAIL(attemptId)),
};

export const gamificationApi = {
  getProfile: () => fetchApi<GamificationProfile>(API_ENDPOINTS.GAMIFICATION.PROFILE),
  getAnalytics: () => fetchApi<LearningAnalytics>(API_ENDPOINTS.GAMIFICATION.ANALYTICS),
};

export const calendarApi = {
  list: () => fetchApi<CalendarEvent[]>(API_ENDPOINTS.CALENDAR.LIST),

  create: (payload: {
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) =>
    fetchApi<CalendarEvent>(API_ENDPOINTS.CALENDAR.LIST, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    fetchApi<{ success: boolean }>(API_ENDPOINTS.CALENDAR.DELETE(id), {
      method: 'DELETE',
    }),

  ocr: (uri: string, fileName?: string, mimeType?: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName || 'schedule.jpg',
      type: mimeType || 'image/jpeg',
    } as unknown as Blob);

    return fetchApi<
      {
        title: string;
        description?: string;
        type?: string;
        startTime: string;
        endTime: string;
      }[]
    >(API_ENDPOINTS.CALENDAR.OCR, {
      method: 'POST',
      body: formData,
      timeoutMs: 90_000,
    });
  },
};

export const notificationsApi = {
  list: () => fetchApi<NotificationItem[]>(API_ENDPOINTS.NOTIFICATIONS.LIST),
  markRead: (id: string) =>
    fetchApi<{ success?: boolean }>(API_ENDPOINTS.NOTIFICATIONS.READ(id), {
      method: 'PATCH',
    }),
  markAllRead: () =>
    fetchApi<{ success?: boolean }>(API_ENDPOINTS.NOTIFICATIONS.READ_ALL, {
      method: 'PATCH',
    }),
};

export const parentApi = {
  getDashboard: () => fetchApi<ParentDashboardData>(API_ENDPOINTS.PARENTS.DASHBOARD),
  generateLinkCode: () =>
    fetchApi<{ linkCode: string; expiresAt?: string; expiresInMinutes?: number }>(
      API_ENDPOINTS.PARENTS.GENERATE_LINK_CODE,
    ),
  linkStudent: (linkCode: string) =>
    fetchApi<{ success: boolean; student?: { id: string; fullName?: string } }>(
      API_ENDPOINTS.PARENTS.LINK_STUDENT,
      {
        method: 'POST',
        body: JSON.stringify({ linkCode }),
      },
    ),
  unlinkStudent: (studentId: string) =>
    fetchApi<{ success: boolean; message?: string }>(
      API_ENDPOINTS.PARENTS.UNLINK_STUDENT(studentId),
      { method: 'DELETE' },
    ),
  getTeachers: () =>
    fetchApi<{ teachers: ParentTeacherItem[] }>(API_ENDPOINTS.PARENTS.TEACHERS),
  getMessages: (teacherId: string) =>
    fetchApi<DirectMessageItem[]>(API_ENDPOINTS.MESSAGES.THREAD(teacherId)),
  sendMessage: (teacherId: string, content: string) =>
    fetchApi<DirectMessageItem>(API_ENDPOINTS.MESSAGES.THREAD(teacherId), {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getProposals: () => fetchApi<ProposalItem[]>(API_ENDPOINTS.PROPOSALS.LIST_PARENT),
  createProposal: (payload: {
    teacherId: string;
    title: string;
    content: string;
    studentId?: string;
  }) =>
    fetchApi<ProposalItem>(API_ENDPOINTS.PROPOSALS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  markNotificationRead: (id: string) =>
    fetchApi<{ success: boolean }>(API_ENDPOINTS.PARENTS.MARK_NOTIFICATION_READ(id), {
      method: 'PATCH',
    }),
};
