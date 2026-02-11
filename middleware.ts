import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Refresh session and get user
  const { response, user } = await updateSession(request)

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Define route categories
  const authRoutes = ['/login', '/reset-password', '/update-password']
  const publicRoutes = [...authRoutes, '/api/auth/callback']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)
  const isProtectedRoute = !isPublicRoute

  // Unauthenticated user trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set(
      'redirect',
      encodeURIComponent(pathname + url.search)
    )
    return NextResponse.redirect(redirectUrl)
  }

  // Authenticated user trying to access auth routes (login, reset-password)
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Authenticated user accessing protected route - check for deactivation
  if (user && isProtectedRoute) {
    // Create Supabase client to check user profile
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Check if user profile is deactivated
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('deleted_at')
      .eq('id', user.id)
      .single()

    // If profile has deleted_at, the user is deactivated
    if (profile?.deleted_at) {
      // Sign out the user
      await supabase.auth.signOut()

      // Redirect to login with deactivation error
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'deactivated')
      return NextResponse.redirect(redirectUrl)
    }

    // If no profile found (shouldn't happen with proper OAuth flow), also block
    if (error && error.code === 'PGRST116') {
      // PGRST116 = no rows returned
      await supabase.auth.signOut()
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'no_account')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
