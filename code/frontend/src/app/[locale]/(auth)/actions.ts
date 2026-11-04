"use server";

import { redirect } from '@/i18n/routing';
import { cookies } from 'next/headers';

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getRedirectPath(role: string, mustChangePassword?: boolean): string {
  if (mustChangePassword) return '/change-password';
  if (role === 'admin' || role === 'school_admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  if (role === 'parent') return '/parent';
  return '/dashboard';
}

export async function login(formData: FormData) {
  const rawIdentifier = (formData.get('identifier') || formData.get('email')) as string;
  const identifier = rawIdentifier ? rawIdentifier.trim() : '';
  const password = formData.get('password') as string;
  const selectedRole = formData.get('role') as string;

  let targetPath = '';

  try {
    const response = await fetch(`${getApiUrl()}/auth/login`, {
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

    if (actualRole === 'admin') {
      return { error: 'ADMIN_USE_PORTAL' };
    }

    // Allow school_admin if selectedRole is 'school_admin' or 'teacher' or not mismatched
    if (
      selectedRole &&
      selectedRole !== actualRole &&
      !(selectedRole === 'school_admin' && actualRole === 'school_admin')
    ) {
      return { error: 'roleMismatch' };
    }

    const cookieStore = await cookies();
    cookieStore.set('auth-token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    targetPath = getRedirectPath(actualRole, data.mustChangePassword);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }

  if (targetPath) {
    redirect({ href: targetPath, locale: 'vi' });
  }
}

export async function verifyLoginOtpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;

  let targetPath = '';

  try {
    const response = await fetch(`${getApiUrl()}/auth/verify-login-otp`, {
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

    const cookieStore = await cookies();
    cookieStore.set('auth-token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    targetPath = getRedirectPath(actualRole, data.mustChangePassword);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }

  if (targetPath) {
    redirect({ href: targetPath, locale: 'vi' });
  }
}

export async function firstTimeChangePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword) {
    return { error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' };
  }
  if (newPassword.length < 6) {
    return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp.' };
  }

  let targetPath = '';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return { error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
    }

    const response = await fetch(`${getApiUrl()}/auth/first-time-change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || 'Đổi mật khẩu thất bại.' };
    }

    const data = await response.json();

    if (data.accessToken) {
      cookieStore.set('auth-token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    const actualRole = data.user?.role?.toLowerCase() || 'student';
    targetPath = getRedirectPath(actualRole, false);
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
