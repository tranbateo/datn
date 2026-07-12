'use server';

import { fetchApiServer } from '@/lib/api-server';

export async function getDashboardStats() {
  try {
    const data = await fetchApiServer('/admin/dashboard/stats');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminStudents() {
  try {
    const data = await fetchApiServer('/admin/users/students');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminTeachers() {
  try {
    const data = await fetchApiServer('/admin/users/teachers');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminParents() {
  try {
    const data = await fetchApiServer('/admin/users/parents');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminCourses() {
  try {
    const data = await fetchApiServer('/admin/courses');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminNotifications() {
  try {
    const data = await fetchApiServer('/admin/notifications');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminFeedback() {
  try {
    const data = await fetchApiServer('/admin/feedback');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminAiModels() {
  try {
    const data = await fetchApiServer('/admin/ai-models');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAdminSettings() {
  try {
    const data = await fetchApiServer('/admin/settings');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

