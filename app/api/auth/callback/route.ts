import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = decodeURIComponent(requestUrl.searchParams.get('next') ?? '/')

  if (!code) {
    // No cookie here — Supabase appends error info as URL hash fragment
    // (e.g., #error=access_denied&error_code=signup_disabled)
    // The login page reads the hash client-side and shows the right message
    return NextResponse.redirect(`${requestUrl.origin}/login`)
  }

  // Use response-based cookie pattern (not cookies() from next/headers)
  // This ensures session cookies are properly set on the redirect response
  const response = NextResponse.redirect(`${requestUrl.origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Exchange code for session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  )

  if (exchangeError) {
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'auth_callback_failed', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'auth_callback_failed', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // Check if user has a profile (admin-created account)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('deleted_at')
    .eq('id', user.id)
    .single()

  // No profile found - this email hasn't been added by an admin
  if (profileError && profileError.code === 'PGRST116') {
    await supabase.auth.signOut()
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'no_account', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // Profile is deactivated
  if (profile?.deleted_at) {
    await supabase.auth.signOut()
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'deactivated', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // Success - response already has redirect URL and session cookies set
  return response
}
