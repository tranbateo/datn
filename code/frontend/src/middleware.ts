import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Basic CSRF Protection for state-changing API requests
  const method = request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Only allow requests from the same origin
    if (origin && host && !origin.includes(host)) {
      return new NextResponse('CSRF Error: Invalid Origin', { status: 403 });
    }
  }

  // 2. Generate the next-intl response (handles routing/localization)
  const intlResponse = intlMiddleware(request);

  // 3. Pass both request and the intlResponse to Supabase to attach Auth cookies/headers
  return await updateSession(request, intlResponse);
}

export const config = {
  // Match only internationalized pathnames and API routes
  matcher: ['/', '/(vi|en)/:path*', '/api/:path*']
};
