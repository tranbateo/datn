"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  try {
    const { fetchApiServer } = await import('@/lib/api-server');
    await fetchApiServer('/users/sync', { method: 'POST' });
  } catch (syncError) {
    console.error('Failed to sync user with backend:', syncError);
  }

  const actualRole = authData.user.user_metadata?.role || 'student';
  const selectedRole = formData.get('role') as string;

  if (selectedRole && selectedRole !== actualRole && actualRole !== 'admin') {
    // If they selected teacher but are a student, or vice versa
    await supabase.auth.signOut();
    return { error: 'Tài khoản của bạn không khớp với vai trò đã chọn. Vui lòng chọn đúng vai trò.' };
  }

  const role = actualRole;

  // Redirect to appropriate dashboard based on role
  let targetPath = '/';
  if (role === 'admin') targetPath = '/admin';
  else if (role === 'teacher') targetPath = '/teacher';
  
  redirect({ href: targetPath, locale: 'vi' }); 
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        role: 'student' // Default role for standard signup
      }
    }
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOtp(formData: FormData) {
  const supabase = await createClient();
  const data = {
    email: formData.get('email') as string,
    token: formData.get('token') as string,
    type: 'signup' as const,
  };

  const { error } = await supabase.auth.verifyOtp(data);

  if (error) {
    return { error: error.message };
  }

  try {
    const { fetchApiServer } = await import('@/lib/api-server');
    await fetchApiServer('/users/sync', { method: 'POST' });
  } catch (syncError) {
    console.error('Failed to sync user with backend:', syncError);
  }

  // User requested to login manually after successful OTP verification
  await supabase.auth.signOut();

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Use a plain redirect from next/navigation so we don't hardcode locale and cause a client-side layout remount
  // However, since this is a server action, it's safer to just let the client do a full reload.
  // We'll redirect to the root path which will resolve locale automatically.
  // Next.js middleware will handle the locale prefix
  const { redirect: nextRedirect } = await import('next/navigation');
  nextRedirect('/');
}
