import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session on every request and guards /admin/*.
 *
 * Called from the root proxy.ts (this used to be middleware.ts before Next 16
 * renamed the file convention).
 *
 * Two rules to preserve if you edit this:
 *  1. Nothing may run between createServerClient() and getUser().
 *  2. Always return the `response` object that setAll() rewrote. Building a
 *     fresh NextResponse drops the refreshed cookies and logs the user out.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Unauthenticated users can't reach the admin area.
  if (!user && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Already signed in? Skip the auth pages.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/queue'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
