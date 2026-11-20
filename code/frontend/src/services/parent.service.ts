import { fetchApi } from '@/lib/api-client';

export interface ParentNotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

export interface ParentSubjectAnalytic {
  subjectId: string;
  subjectName: string;
  attemptsCount: number;
  averageScore: number | null;
  bestScore: number | null;
  masteryStatus: 'strong' | 'developing' | 'weak' | 'unassessed';
}

export interface ParentDashboardData {
  parentNotifications?: ParentNotificationItem[];
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
      school?: {
        id: string;
        name: string;
        code: string;
      } | null;
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
    subjectAnalytics?: ParentSubjectAnalytic[];
    recentQuizzes: { id?: string; quiz?: { title: string }; score: number; startedAt: string }[];
    upcomingEvents: {
      id: string;
      title: string;
      type: string;
      startTime: string;
      endTime: string;
      color?: string;
    }[];
    recentNotifications: {
      id: string;
      title: string;
      body: string;
      createdAt: string;
      isRead: boolean;
    }[];
  }[];
}

export const parentService = {
  getDashboard: () => fetchApi<ParentDashboardData>('/parents/dashboard'),
  markNotificationRead: (notificationId: string) =>
    fetchApi<{ success: boolean }>(`/parents/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }),
  linkStudent: (linkCode: string) =>
    fetchApi<{ success: boolean; student: any }>('/parents/link-student', {
      method: 'POST',
      body: JSON.stringify({ linkCode }),
    }),
  unlinkStudent: (studentId: string) =>
    fetchApi<{ success: boolean; message: string }>(`/parents/link-student/${studentId}`, {
      method: 'DELETE',
    }),
  generateLinkCode: () => fetchApi<{ linkCode: string; expiresInMinutes?: number }>('/parents/generate-link-code'),

  // Teachers
  getTeachers: () => fetchApi<{ teachers: any[] }>('/parents/teachers'),

  // Messages
  getMessages: (teacherId: string) => fetchApi<any[]>(`/messages/${teacherId}`),
  sendMessage: (teacherId: string, content: string) =>
    fetchApi<any>(`/messages/${teacherId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // Proposals
  getProposals: () => fetchApi<any[]>('/proposals/parent'),
  createProposal: (
    teacherId: string,
    title: string,
    content: string,
    studentId?: string,
  ) =>
    fetchApi<any>('/proposals', {
      method: 'POST',
      body: JSON.stringify({
        teacherId,
        title,
        content,
        ...(studentId ? { studentId } : {}),
      }),
    }),
};
