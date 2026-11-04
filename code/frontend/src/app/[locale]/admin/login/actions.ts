"use server";

import { redirect } from '@/i18n/routing';

export async function adminLogin(formData: FormData) {
  const rawIdentifier = (formData.get('identifier') || formData.get('email')) as string;
  const identifier = rawIdentifier ? rawIdentifier.trim() : '';
  const password = formData.get('password') as string;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  let targetPath = '/admin';

  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'Login failed' };
    }

    const data = await response.json();

    if (data.requireOtp) {
      return { requireOtp: true, email: data.email, message: data.message };
    }

    const actualRole = data.user.role?.toLowerCase() || 'student';

    if (actualRole !== 'admin' && actualRole !== 'school_admin') {
      return { error: 'NOT_ADMIN' };
    }

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('auth-token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    if (data.mustChangePassword) {
      targetPath = '/change-password';
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'NETWORK_ERROR' };
  }

  redirect({ href: targetPath, locale: 'vi' });
}

export async function verifyAdminLoginOtpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  let targetPath = '/admin';

  try {
    const response = await fetch(`${baseUrl}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'OTP verification failed' };
    }

    const data = await response.json();
    const actualRole = data.user.role?.toLowerCase() || 'student';

    if (actualRole !== 'admin' && actualRole !== 'school_admin') {
      return { error: 'NOT_ADMIN' };
    }

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('auth-token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    if (data.mustChangePassword) {
      targetPath = '/change-password';
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'NETWORK_ERROR' };
  }

  redirect({ href: targetPath, locale: 'vi' });
}
