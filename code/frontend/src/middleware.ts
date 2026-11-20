import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. CSRF Protection for state-changing requests (BR-AUTH-002), including /api/proxy/*
  const method = request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse('CSRF Error: Invalid Origin', { status: 403 });
        }
      } catch {
        return new NextResponse('CSRF Error: Malformed Origin', { status: 403 });
      }
    }
  }

  // Proxy API calls do not go through next-intl localization
  if (request.nextUrl.pathname.startsWith('/api/proxy')) {
    return NextResponse.next();
  }

  // 2. Generate the next-intl response (handles routing/localization)
  const intlResponse = intlMiddleware(request);

  // 3. Pass both request and the intlResponse to session middleware
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: ['/', '/(vi)/:path*', '/api/proxy/:path*'],
};
