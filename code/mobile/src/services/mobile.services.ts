import { API_ENDPOINTS, getApiBaseUrl } from '@/constants/api';
import {
  ApiError,
  attemptTokenRefresh,
  fetchApi,
  translateBackendError,
} from '@/lib/api-client';
import { useAuthStore, type MobileUser } from '@/store/authStore';

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
    relatedExcerpts?: { fileName: string; page: number; content: string }[];
  }[];
  documents?: CourseDocument[];
}

export interface CourseDocument {
  id: string;
  fileName: string;
  fileSize?: string | null;
  size?: string | null;
  status?: string;
  createdAt?: string;
  uploadedAt?: string;
  hasFile?: boolean;
  chunks?: { page: number; content: string }[];
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
  currentLevelMinXp?: number;
  nextLevelXp: number;
  xpInCurrentLevel?: number;
  xpRequiredForNextLevel?: number;
  xpRemainingToNextLevel?: number;
  streakDays: number;
  longestStreak?: number;
  levelProgressPercent?: number;
  rank?: number;
}

export type MasteryStatus = 'strong' | 'developing' | 'weak' | 'unassessed';

export interface SubjectMastery {
  subjectId: string;
  subjectName: string;
  grade: number;
  courseId?: string | null;
  attemptsCount: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  trend?: 'up' | 'down' | 'stable' | 'none';
  masteryStatus: MasteryStatus;
  recommendation: string;
  weakQuizzes?: { quizId: string; title: string; score: number }[];
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
  roleSummary?: string;
  homeroomClassNames?: string[];
  studentNames?: string[];
  studentRoles?: {
    studentId: string;
    studentName: string;
    className?: string | null;
    isHomeroom?: boolean;
    homeroomClassName?: string | null;
    subjects?: string[];
    summary?: string;
    roleLabel?: string;
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

/**
 * Normalizes a multiple-choice answer or option string so "A", "A. 24", and "24"
 * match consistently across exam taking, grading, and attempt review.
 */
export function matchesQuizOption(
  candidate: string | null | undefined,
  optionText: string,
  letter: string,
): boolean {
  if (!candidate) return false;
  const cleanCand = candidate.trim();
  const cleanOpt = optionText.trim();
  const upperLetter = letter.trim().toUpperCase();
  if (!cleanCand) return false;
  if (cleanCand === cleanOpt || cleanCand.toUpperCase() === upperLetter) return true;

  const stripPrefix = (s: string) => s.replace(/^[A-Da-d][.):\-\s]+/, '').trim();
  const candPrefixMatch = cleanCand.match(/^([A-Da-d])[.):\-\s]/);
  if (candPrefixMatch && candPrefixMatch[1].toUpperCase() === upperLetter) {
    return true;
  }
  const strippedCand = stripPrefix(cleanCand);
  const strippedOpt = stripPrefix(cleanOpt);
  return Boolean(strippedCand && strippedOpt && strippedCand === strippedOpt);
}

/**
 * Generates a RFC-4122 UUID v4 for idempotent quiz attempt submission (BR-QUIZ-002).
 */
export function generateClientUuid(): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += hex[(Math.floor(Math.random() * 16) & 0x3) | 0x8];
    } else {
      uuid += hex[Math.floor(Math.random() * 16)];
    }
  }
  return uuid;
}

export const authApi = {
  login: (identifier: string, password: string, schoolCode?: string) =>
    fetchApi<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        identifier,
        email: identifier,
        password,
        ...(schoolCode?.trim() ? { schoolCode: schoolCode.trim() } : {}),
      }),
    }),

  verifyLoginOtp: (email: string, otp: string) =>
    fetchApi<LoginResponse>(API_ENDPOINTS.AUTH.VERIFY_LOGIN_OTP, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, otp }),
    }),

  firstTimeChangePassword: (currentPassword: string, newPassword: string) =>
    fetchApi<LoginResponse>(API_ENDPOINTS.AUTH.FIRST_TIME_CHANGE_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  requestPasswordReset: (payload: {
    role: 'STUDENT' | 'TEACHER' | 'PARENT';
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

  uploadAvatar: (uri: string, fileName?: string, mimeType?: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName || 'avatar.jpg',
      type: mimeType || 'image/jpeg',
    } as unknown as Blob);
    return fetchApi<MobileUser>(API_ENDPOINTS.USERS.AVATAR, {
      method: 'POST',
      body: formData,
      timeoutMs: 30_000,
    });
  },

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

  sendMessageStream: async (
    sessionId: string,
    content: string,
    image: { uri: string; name?: string; type?: string } | null,
    onDelta: (chunk: string) => void,
    isRetry = false,
  ): Promise<{ content: string; citations: RagCitation[]; messageId?: string }> => {
    const token = useAuthStore.getState().token;
    const url = `${getApiBaseUrl()}${API_ENDPOINTS.CHAT.SEND_MESSAGE_STREAM(sessionId)}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.timeout = 95_000;
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.setRequestHeader('Accept', 'text/event-stream');

      let processedOffset = 0;
      let leftoverBuffer = '';
      let accumulated = '';
      let citations: RagCitation[] = [];
      let messageId: string | undefined;
      let streamError: string | null = null;

      const parseSseBuffer = (chunkText: string) => {
        const combined = leftoverBuffer + chunkText;
        const lines = combined.split(/\r?\n/);
        leftoverBuffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const payloadStr = line.slice(5).trim();
          if (!payloadStr || payloadStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payloadStr) as {
              content?: string;
              citations?: RagCitation[];
              messageId?: string;
              error?: string;
            };
            if (parsed.error) {
              streamError = parsed.error;
            }
            if (typeof parsed.content === 'string' && parsed.content.length > 0) {
              accumulated += parsed.content;
              onDelta(parsed.content);
            }
            if (Array.isArray(parsed.citations)) {
              citations = parsed.citations;
            }
            if (parsed.messageId) {
              messageId = parsed.messageId;
            }
          } catch {
            // Ignore malformed partial JSON frame
          }
        }
      };

      xhr.onprogress = () => {
        const text = xhr.responseText || '';
        if (text.length > processedOffset) {
          const delta = text.slice(processedOffset);
          processedOffset = text.length;
          parseSseBuffer(delta);
        }
      };

      xhr.onload = async () => {
        const text = xhr.responseText || '';
        if (text.length > processedOffset) {
          parseSseBuffer(text.slice(processedOffset));
          processedOffset = text.length;
        }
        if (leftoverBuffer.trim()) {
          parseSseBuffer('\n');
        }

        if (xhr.status === 401 && !isRetry) {
          const nextToken = await attemptTokenRefresh();
          if (nextToken) {
            try {
              const retried = await chatApi.sendMessageStream(
                sessionId,
                content,
                image,
                onDelta,
                true,
              );
              resolve(retried);
            } catch (retryErr) {
              reject(retryErr);
            }
            return;
          }
          reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          let errMsg = `Lỗi kết nối Gia sư AI (${xhr.status})`;
          try {
            const parsedErr = JSON.parse(text) as { message?: string | string[] };
            if (Array.isArray(parsedErr.message)) {
              errMsg = parsedErr.message.join(', ');
            } else if (typeof parsedErr.message === 'string' && parsedErr.message.trim()) {
              errMsg = parsedErr.message;
            }
          } catch {
            if (text.trim() && !text.trim().startsWith('<')) {
              errMsg = text.trim().slice(0, 200);
            }
          }
          reject(new ApiError(translateBackendError(errMsg), xhr.status));
          return;
        }

        if (streamError && !accumulated) {
          reject(new ApiError(translateBackendError(streamError), 500));
          return;
        }

        resolve({ content: accumulated, citations, messageId });
      };

      xhr.onerror = () => {
        reject(new ApiError('Không thể kết nối luồng Gia sư AI.', 0));
      };

      xhr.ontimeout = () => {
        reject(
          new ApiError(
            'Gia sư AI phản hồi quá thời gian chờ. Em vui lòng thử lại nhé!',
            408,
          ),
        );
      };

      if (image) {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('image', {
          uri: image.uri,
          name: image.name || 'homework.jpg',
          type: image.type || 'image/jpeg',
        } as unknown as Blob);
        xhr.send(formData);
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ content }));
      }
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
    attemptId?: string,
  ) =>
    fetchApi<QuizSubmitResponse>(API_ENDPOINTS.QUIZ.SUBMIT(quizId), {
      method: 'POST',
      body: JSON.stringify({ answers, exitReason, attemptId }),
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

// ===== TEACHER PORTAL TYPES & API =====

export interface TeacherDashboardStats {
  teacherProfile?: {
    fullName: string;
    studentCode?: string | null;
    email?: string | null;
    primarySubjects: string[];
  };
  totalStudents: number;
  totalCourses: number;
  totalQuizzes: number;
  averageScore: number;
  pendingPasswordResetCount?: number;
  pendingProposalsCount?: number;
  homeroomClasses?: {
    id: string;
    name: string;
    grade: number;
    studentsCount: number;
  }[];
  subjectClasses?: {
    id: string;
    classId: string;
    className: string;
    grade: number;
    subjectId: string;
    subjectName: string;
    studentsCount: number;
  }[];
  needsAttention: { name: string; issues: string; average?: number }[];
}

export interface TeacherClassOption {
  id: string;
  name: string;
  grade: number;
  role: 'GVCN' | 'GVBM';
  subjectName?: string;
  studentsCount: number;
}

export interface TeacherStudentItem {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  className: string;
  classId?: string;
  isHomeroomTeacher: boolean;
  subjects?: string[];
  teacherRole: 'GVCN' | 'GVBM' | string;
  grade: string;
  level: number;
  streak: number;
  xp: number;
  avgScore: number;
  status: string;
  latestQuizTitle?: string | null;
  latestScore?: number | null;
}

export interface TeacherStudentAttemptsResponse {
  student: {
    id: string;
    fullName: string;
    studentCode?: string | null;
    className?: string | null;
    grade?: number | null;
    isHomeroomTeacher?: boolean;
  };
  attempts: {
    id: string;
    quizId: string;
    quizTitle: string;
    subjectName: string;
    canEditScore?: boolean;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }[];
}

export interface TeacherResetRequestItem {
  id: string;
  userId: string;
  fullName: string;
  studentCode?: string | null;
  email?: string | null;
  className?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface TeacherScopedParent {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  students: {
    id: string;
    fullName: string;
    studentCode?: string | null;
    className: string;
    teacherRole: 'GVCN' | 'GVBM' | string;
  }[];
}

export interface TeacherProposalItem {
  id: string;
  title: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt: string;
  parent?: { id: string; fullName?: string | null; phone?: string | null } | null;
  student?: { id: string; fullName?: string | null; studentCode?: string | null } | null;
}

export interface TeacherQuizItem {
  id: string;
  title: string;
  description?: string | null;
  grade: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'CLOSED' | string;
  subject: string;
  subjectId: string;
  questionsCount: number;
  attemptsCount: number;
  duration: number;
  createdAt: string;
}

export interface TeacherQuizDetail {
  id: string;
  title: string;
  description?: string | null;
  grade: number;
  status: string;
  duration: number;
  subject?: { id: string; name: string } | null;
  questions: {
    id: string;
    content: string;
    options: string[];
    correctOption?: string;
    explanation?: string | null;
  }[];
  attempts: {
    id: string;
    studentName: string;
    studentCode?: string | null;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }[];
}

export interface TeacherDocumentItem {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  grade?: number | null;
  size: string;
  hasFile: boolean;
  chunksCount: number;
  rawStatus: string;
  status: 'ready' | 'processing' | 'unpublished' | 'failed' | string;
  date: string;
}

export interface TeacherCourseItem {
  id: string;
  title: string;
  description?: string | null;
  subject?: string;
  grade?: string;
  gradeNum?: number;
  lessons?: number;
  lessonsCount?: number;
  students?: number;
  assignedClasses?: string[];
  documentsCount?: number;
}

interface RawTeacherClassesResponse {
  homeroomClasses?: {
    id: string;
    name: string;
    grade: number;
    role?: string;
    studentsCount: number;
  }[];
  subjectClasses?: {
    id: string;
    classId: string;
    className: string;
    grade: number;
    subjectName?: string;
    role?: string;
    studentsCount: number;
  }[];
}

export const teacherApi = {
  getDashboardStats: () =>
    fetchApi<TeacherDashboardStats>(API_ENDPOINTS.TEACHER.DASHBOARD_STATS),
  getClasses: async (): Promise<TeacherClassOption[]> => {
    const raw = await fetchApi<TeacherClassOption[] | RawTeacherClassesResponse>(
      API_ENDPOINTS.TEACHER.CLASSES,
    );
    if (Array.isArray(raw)) return raw;

    const merged = new Map<string, TeacherClassOption>();
    for (const hc of raw?.homeroomClasses || []) {
      merged.set(hc.id, {
        id: hc.id,
        name: hc.name,
        grade: hc.grade,
        role: 'GVCN',
        studentsCount: hc.studentsCount || 0,
      });
    }
    for (const sc of raw?.subjectClasses || []) {
      const targetClassId = sc.classId || sc.id;
      const existing = merged.get(targetClassId);
      if (existing) {
        // Keep GVCN priority; append subject label if helpful
        existing.subjectName = existing.subjectName
          ? `${existing.subjectName}, ${sc.subjectName || ''}`.replace(/,\s*$/, '')
          : sc.subjectName;
      } else {
        merged.set(targetClassId, {
          id: targetClassId,
          name: sc.className,
          grade: sc.grade,
          role: 'GVBM',
          subjectName: sc.subjectName,
          studentsCount: sc.studentsCount || 0,
        });
      }
    }
    return Array.from(merged.values());
  },
  getCourses: () => fetchApi<TeacherCourseItem[]>(API_ENDPOINTS.TEACHER.COURSES),
  getCourseDetail: (courseId: string) =>
    fetchApi<CourseItem>(API_ENDPOINTS.COURSES.DETAIL(courseId)),
  createLesson: (
    courseId: string,
    payload: { title: string; content?: string; order?: number },
  ) =>
    fetchApi<{ id: string; title: string; content?: string }>(
      API_ENDPOINTS.COURSES.CREATE_LESSON(courseId),
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
  updateLesson: (
    courseId: string,
    lessonId: string,
    payload: { title?: string; content?: string; order?: number },
  ) =>
    fetchApi<{ id: string; title: string; content?: string }>(
      API_ENDPOINTS.COURSES.UPDATE_LESSON(courseId, lessonId),
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    ),
  deleteLesson: (courseId: string, lessonId: string) =>
    fetchApi<{ success?: boolean }>(
      API_ENDPOINTS.COURSES.DELETE_LESSON(courseId, lessonId),
      { method: 'DELETE' },
    ),
  aiBuildQuiz: (payload: {
    title: string;
    courseId: string;
    topic?: string;
    numQuestions: number;
    duration: number;
  }) =>
    fetchApi<TeacherQuizItem>(API_ENDPOINTS.TEACHER.QUIZZES_AI_BUILD, {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 120_000,
    }),
  getStudents: () => fetchApi<TeacherStudentItem[]>(API_ENDPOINTS.TEACHER.STUDENTS),
  getStudentAttempts: (studentId: string) =>
    fetchApi<TeacherStudentAttemptsResponse>(
      API_ENDPOINTS.TEACHER.STUDENT_ATTEMPTS(studentId),
    ),
  overrideAttemptScore: (attemptId: string, score: number, reason: string) =>
    fetchApi<{ id: string; score: number }>(
      API_ENDPOINTS.TEACHER.OVERRIDE_SCORE(attemptId),
      {
        method: 'PATCH',
        body: JSON.stringify({ score, reason }),
      },
    ),
  getPasswordResetRequests: () =>
    fetchApi<TeacherResetRequestItem[]>(
      API_ENDPOINTS.TEACHER.PASSWORD_RESET_REQUESTS,
    ),
  resetStudentPassword: (studentId: string) =>
    fetchApi<{
      success?: boolean;
      temporaryPassword?: string;
      tempPassword?: string;
      studentName?: string;
      studentCode?: string;
      message?: string;
    }>(API_ENDPOINTS.TEACHER.RESET_STUDENT_PASSWORD(studentId), {
      method: 'POST',
    }),
  getParents: () => fetchApi<TeacherScopedParent[]>(API_ENDPOINTS.TEACHER.PARENTS),
  sendNotification: (payload: {
    targetType: 'CLASS' | 'STUDENT';
    classId?: string;
    studentId?: string;
    audience: 'PARENTS' | 'STUDENTS' | 'BOTH';
    title: string;
    body: string;
  }) =>
    fetchApi<{
      success: boolean;
      sentCount: number;
      studentRecipientsCount: number;
      parentRecipientsCount: number;
      message: string;
    }>(API_ENDPOINTS.TEACHER.SEND_NOTIFICATION, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getProposals: () =>
    fetchApi<TeacherProposalItem[]>(API_ENDPOINTS.PROPOSALS.LIST_TEACHER),
  updateProposalStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    fetchApi<TeacherProposalItem>(API_ENDPOINTS.PROPOSALS.UPDATE_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getMessages: (parentId: string) =>
    fetchApi<DirectMessageItem[]>(API_ENDPOINTS.MESSAGES.THREAD(parentId)),
  sendMessage: (parentId: string, content: string) =>
    fetchApi<DirectMessageItem>(API_ENDPOINTS.MESSAGES.THREAD(parentId), {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getQuizzes: () => fetchApi<TeacherQuizItem[]>(API_ENDPOINTS.TEACHER.QUIZZES),
  getQuizDetails: (quizId: string) =>
    fetchApi<TeacherQuizDetail>(API_ENDPOINTS.TEACHER.QUIZ_DETAILS(quizId)),
  updateQuizStatus: (
    quizId: string,
    status: 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'CLOSED',
  ) =>
    fetchApi<{ id: string; status: string }>(
      API_ENDPOINTS.TEACHER.QUIZ_STATUS(quizId),
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    ),
  getDocuments: () =>
    fetchApi<TeacherDocumentItem[]>(API_ENDPOINTS.TEACHER.DOCUMENTS),
  updateDocumentStatus: (
    docId: string,
    status: 'Embedded' | 'UNPUBLISHED',
  ) =>
    fetchApi<{ id: string; status: string }>(
      API_ENDPOINTS.TEACHER.DOCUMENT_STATUS(docId),
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    ),
  deleteDocument: (docId: string) =>
    fetchApi<{ success: boolean }>(API_ENDPOINTS.TEACHER.DOCUMENT_DELETE(docId), {
      method: 'DELETE',
    }),
};
