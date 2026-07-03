import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // First, generate the next-intl response (handles routing/localization)
  const intlResponse = intlMiddleware(request);

  // Then pass both request and the intlResponse to Supabase to attach Auth cookies/headers
  return await updateSession(request, intlResponse);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(vi|en)/:path*']
};
