 
import { NextResponse, type NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

export async function updateSession(request: NextRequest, response: NextResponse) {
  const token = request.cookies.get('auth-token')?.value;
  
  let userRole = 'student';
  let user: Record<string, unknown> | null = null;

  if (token) {
    try {
      user = decodeJwt(token);
      userRole = (user.role as string)?.toLowerCase() || 'student';
    } catch {
      // Invalid token
    }
  }

  const pathname = request.nextUrl.pathname;
  const locale = pathname.startsWith('/en') ? '/en' : '/vi';

  const isAdminRoute = /^\/(vi|en)\/admin(?!\/login)/.test(pathname);
  const isAdminLoginRoute = /^\/(vi|en)\/admin\/login/.test(pathname);
  const isStudentAuthRoute = /^\/(vi|en)\/(login|register)/.test(pathname);
  const isTeacherRoute = /^\/(vi|en)\/teacher/.test(pathname);

  // 1. Admin Route Protection
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/admin/login`;
      return NextResponse.redirect(url);
    }
    if (userRole !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/`;
      return NextResponse.redirect(url);
    }
  }

  // 2. Admin Login Route Protection
  if (isAdminLoginRoute && user) {
    if (userRole === 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/admin`;
      return NextResponse.redirect(url);
    } else {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/`;
      return NextResponse.redirect(url);
    }
  }

  // 3. Student Auth Route Protection
  if (isStudentAuthRoute && user) {
    const url = request.nextUrl.clone();
    if (userRole === 'admin') url.pathname = `${locale}/admin`;
    else if (userRole === 'teacher') url.pathname = `${locale}/teacher`;
    else url.pathname = `${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // 4. Student Dashboard Route Protection
  const isDashboardRoute = /^\/(vi|en)\/dashboard/.test(pathname);
  if (isDashboardRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/login`;
      return NextResponse.redirect(url);
    }
    if (userRole === 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/admin`;
      return NextResponse.redirect(url);
    }
    if (userRole === 'teacher') {
      const url = request.nextUrl.clone();
      url.pathname = `${locale}/teacher`;
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
      url.pathname = userRole === 'admin' ? `${locale}/admin` : `${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // 6. Prevent Admin from accessing Student/Marketing routes
  if (user && userRole === 'admin' && !isAdminRoute && !isAdminLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale}/admin`;
    return NextResponse.redirect(url);
  }

  // Return the intlResponse passed from proxy.ts
  return response;
}
