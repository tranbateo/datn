import { NextResponse, type NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

export async function updateSession(request: NextRequest, response: NextResponse) {
  const token = request.cookies.get('auth-token')?.value;

  let userRole = 'student';
  let mustChangePassword = false;
  let user: any | null = null;

  if (token) {
    try {
      user = decodeJwt(token);
      userRole = (user.role as string)?.toLowerCase() || 'student';
      mustChangePassword = Boolean(user.mustChangePassword);
    } catch {
      // Invalid token
    }
  }

  const pathname = request.nextUrl.pathname;
  const locale = pathname.startsWith('/en') ? '/en' : '/vi';
  const isAdminLike = userRole === 'admin' || userRole === 'school_admin';

  const isChangePasswordRoute = /^\/(vi|en)\/change-password/.test(pathname);
  const isAdminRoute = /^\/(vi|en)\/admin(?!\/login)/.test(pathname);
  const isAdminLoginRoute = /^\/(vi|en)\/admin\/login/.test(pathname);
  const isStudentAuthRoute = /^\/(vi|en)\/(login|register)/.test(pathname);
  const isTeacherRoute = /^\/(vi|en)\/teacher/.test(pathname);
  const isParentRoute = /^\/(vi|en)\/parent/.test(pathname);
  const isDashboardRoute = /^\/(vi|en)\/dashboard/.test(pathname);

  const getHomeForRole = (role: string) => {
    if (role === 'admin' || role === 'school_admin') return `${locale}/admin`;
    if (role === 'teacher') return `${locale}/teacher`;
    if (role === 'parent') return `${locale}/parent`;
    return `${locale}/dashboard`;
  };

  // 0. Enforce First-time Password Change (BR-AUTH-003)
  if (user && mustChangePassword && !isChangePasswordRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale}/change-password`;
    return NextResponse.redirect(url);
  }

  if (isChangePasswordRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/login`;
      return NextResponse.redirect(url);
    }
    if (!mustChangePassword) {
      const url = request.nextUrl.clone();
      url.pathname = getHomeForRole(userRole);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 1. Admin & School Admin Route Protection
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/admin/login`;
      return NextResponse.redirect(url);
    }
    if (!isAdminLike) {
      const url = request.nextUrl.clone();
      url.pathname = getHomeForRole(userRole);
      return NextResponse.redirect(url);
    }
  }

  // 2. Admin Login Route Protection
  if (isAdminLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = getHomeForRole(userRole);
    return NextResponse.redirect(url);
  }

  // 3. Student Auth Route Protection
  if (isStudentAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = getHomeForRole(userRole);
    return NextResponse.redirect(url);
  }

  // 4. Student Dashboard Route Protection
  if (isDashboardRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/login`;
      return NextResponse.redirect(url);
    }
    if (userRole !== 'student') {
      const url = request.nextUrl.clone();
      url.pathname = getHomeForRole(userRole);
      return NextResponse.redirect(url);
    }
  }

  // 5. Teacher Route Protection
  if (isTeacherRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/login`;
      return NextResponse.redirect(url);
    }
    if (userRole !== 'teacher') {
      const url = request.nextUrl.clone();
      url.pathname = getHomeForRole(userRole);
      return NextResponse.redirect(url);
    }
  }

  // 6. Parent Route Protection
  if (isParentRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/login`;
      return NextResponse.redirect(url);
    }
    if (userRole !== 'parent') {
      const url = request.nextUrl.clone();
      url.pathname = getHomeForRole(userRole);
      return NextResponse.redirect(url);
    }
  }

  // 7. Prevent Admin / School Admin from staying on Student/Marketing routes
  if (user && isAdminLike && !isAdminRoute && !isAdminLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale}/admin`;
    return NextResponse.redirect(url);
  }

  return response;
}
