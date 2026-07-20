'use server';

import { fetchApiServer } from '@/lib/api-server';

export async function getDashboardStats() {
  try {
    const data = await fetchApiServer<any>('/admin/dashboard/stats');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminStudents() {
  try {
    const data = await fetchApiServer<any[]>('/admin/users/students');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminTeachers() {
  try {
    const data = await fetchApiServer<any[]>('/admin/users/teachers');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminParents() {
  try {
    const data = await fetchApiServer<any[]>('/admin/users/parents');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminCourses() {
  try {
    const data = await fetchApiServer<any[]>('/admin/courses');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminNotifications() {
  try {
    const data = await fetchApiServer<any[]>('/admin/notifications');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminFeedback() {
  try {
    const data = await fetchApiServer<any[]>('/admin/feedback');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminAiModels() {
  try {
    const data = await fetchApiServer<any[]>('/admin/ai-models');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminSettings() {
  try {
    const data = await fetchApiServer<any[]>('/admin/settings');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminQuizzes() {
  try {
    const data = await fetchApiServer<any[]>('/admin/quizzes');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminAnalyticsStats() {
  try {
    const data = await fetchApiServer<any>('/admin/analytics/stats');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

