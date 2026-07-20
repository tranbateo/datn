'use server';

import { fetchApiServer } from '@/lib/api-server';

export async function getTeacherDashboardStats() {
  try {
    const data = await fetchApiServer<any>('/teacher/dashboard/stats');
    return { data, error: null };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: 'Unknown error occurred' };
  }
}
