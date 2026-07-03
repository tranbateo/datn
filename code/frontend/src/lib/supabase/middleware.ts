import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, response: NextResponse) {
  let supabaseResponse = response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const locale = pathname.startsWith('/en') ? '/en' : '/vi'

  // Protect /admin routes (except /admin/login)
  const isAdminRoute = /^\/(vi|en)\/admin(?!\/login)/.test(pathname)
  const isAdminLoginRoute = /^\/(vi|en)\/admin\/login/.test(pathname)
  const isStudentAuthRoute = /^\/(vi|en)\/(login|register)/.test(pathname)
  const isTeacherRoute = /^\/(vi|en)\/teacher/.test(pathname)

  const userRole = user?.user_metadata?.role || 'student'

  // 1. Admin Route Protection
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/admin/login`
      return NextResponse.redirect(url)
    }
    if (userRole !== 'admin') {
      // Logged in but not an admin -> send to home
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/`
      return NextResponse.redirect(url)
    }
  }

  // 2. Admin Login Route Protection
  if (isAdminLoginRoute && user) {
    if (userRole === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/admin`
      return NextResponse.redirect(url)
    } else {
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/`
      return NextResponse.redirect(url)
    }
  }

  // 3. Student Auth Route Protection
  if (isStudentAuthRoute && user) {
    const url = request.nextUrl.clone()
    if (userRole === 'admin') url.pathname = `${locale}/admin`
    else if (userRole === 'teacher') url.pathname = `${locale}/teacher`
    else url.pathname = `${locale}/dashboard`
    return NextResponse.redirect(url)
  }

  // 4. Student Dashboard Route Protection
  const isDashboardRoute = /^\/(vi|en)\/dashboard/.test(pathname)
  if (isDashboardRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/login`
      return NextResponse.redirect(url)
    }
    if (userRole === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/admin`
      return NextResponse.redirect(url)
    }
    if (userRole === 'teacher') {
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/teacher`
      return NextResponse.redirect(url)
    }
  }

  // 5. Teacher Route Protection
  if (isTeacherRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = `${locale}/login`
      return NextResponse.redirect(url)
    }
    if (userRole !== 'teacher') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'admin' ? `${locale}/admin` : `${locale}/dashboard`
      return NextResponse.redirect(url)
    }
  }

  // 6. Prevent Admin from accessing Student/Marketing routes
  if (user && userRole === 'admin' && !isAdminRoute && !isAdminLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = `${locale}/admin`
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
