import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  // Prevent open redirect (only allow internal relative paths)
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Sync user to backend after successful email confirmation
      try {
        const { fetchApiServer } = await import('@/lib/api-server');
        await fetchApiServer('/users/sync', { method: 'POST' });
      } catch (syncError) {
        console.error('Failed to sync user with backend:', syncError);
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to the login page on callback failure
  return NextResponse.redirect(`${origin}/vi/login`)
}
