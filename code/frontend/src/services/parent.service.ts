import { fetchApi } from '@/lib/api-client';

export interface ParentDashboardData {
  students: {
    student: {
      id: string;
      fullName: string;
      grade: number;
      gamificationProfile?: {
        xp: number;
        level: number;
      }
    };
    recentQuizzes: { quiz?: { title: string }, score: number, startedAt: string }[];
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
  linkStudent: (linkCode: string) => fetchApi<{success: boolean, student: any}>('/parents/link-student', {
    method: 'POST',
    body: JSON.stringify({ linkCode })
  }),
  generateLinkCode: () => fetchApi<{linkCode: string}>('/parents/generate-link-code'),
  
  // Teachers
  getTeachers: () => fetchApi<{teachers: any[]}>('/parents/teachers'),

  // Messages
  getMessages: (teacherId: string) => fetchApi<any[]>(`/messages/${teacherId}`),
  sendMessage: (teacherId: string, content: string) => fetchApi<any>(`/messages/${teacherId}`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),

  // Proposals
  getProposals: () => fetchApi<any[]>('/proposals/parent'),
  createProposal: (teacherId: string, title: string, content: string) => fetchApi<any>('/proposals', {
    method: 'POST',
    body: JSON.stringify({ teacherId, title, content })
  }),
};
