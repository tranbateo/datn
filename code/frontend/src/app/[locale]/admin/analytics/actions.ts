'use server';

import { fetchApiServer } from '@/lib/api-server';

export async function getAnalyticsStats() {
  try {
    const data = await fetchApiServer('/admin/analytics/stats');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: (error as Error).message };
  }
}
