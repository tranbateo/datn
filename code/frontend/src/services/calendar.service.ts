import { API_ENDPOINTS } from '@/constants/api';
import { fetchApi } from '../lib/api-client';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  locationUrl?: string;
  isCompleted: boolean;
  color?: string;
  createdAt: string;
}

export const calendarService = {
  getEvents: (): Promise<CalendarEvent[]> => {
    return fetchApi(API_ENDPOINTS.CALENDAR.LIST);
  },
};
