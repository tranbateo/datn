 
"use server";


import { redirect } from '@/i18n/routing';
import { cookies } from 'next/headers';

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const selectedRole = formData.get('role') as string;

  let targetPath = '';

  try {
    const response = await fetch(`${getApiUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'Login failed' };
    }

    const data = await response.json();
    const actualRole = data.user.role?.toLowerCase() || 'student';

    if (actualRole === 'admin') {
      return { error: 'ADMIN_USE_PORTAL' };
    }

    if (selectedRole && selectedRole !== actualRole) {
      return { error: 'roleMismatch' };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    let tempPath = '/';
    if (actualRole === 'admin') tempPath = '/admin';
    else if (actualRole === 'teacher') tempPath = '/teacher';
    else if (actualRole === 'parent') tempPath = '/parent';
    else if (actualRole === 'student') tempPath = '/dashboard';
    
    targetPath = tempPath;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }

  if (targetPath) {
    redirect({ href: targetPath, locale: 'vi' }); 
  }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const role = formData.get('role') as string;

  try {
    const response = await fetch(`${getApiUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        fullName: `${firstName} ${lastName}`.trim(),
        role: role || 'STUDENT',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'Signup failed' };
    }

    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function verifyOtp(formData: FormData) {
  const email = formData.get('email') as string;
  const otp = formData.get('token') as string;

  try {
    const response = await fetch(`${getApiUrl()}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'OTP verification failed' };
    }

    // We get accessToken back but user requested to login manually after successful OTP
    // So we don't set the cookie here, just return success
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  const { redirect: nextRedirect } = await import('next/navigation');
  nextRedirect('/');
}
