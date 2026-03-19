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
    console.warn('[auth/callback] stage=no_code', {
      url: requestUrl.toString(),
      note: 'OAuth errors (access_denied, signup_disabled, etc.) are sent as hash fragments and never reach the server — check the browser URL for #error= params',
    })
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
    console.error('[auth/callback] stage=exchange_code_for_session error:', {
      code: exchangeError.code,
      message: exchangeError.message,
      status: (exchangeError as { status?: number }).status,
      codeParam: code.slice(0, 8),
      hint: 'Check Supabase OAuth provider config, redirect URI whitelist, and that NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are correct',
    })
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'auth_callback_failed', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[auth/callback] stage=get_user_after_exchange error:', {
      message: 'exchangeCodeForSession succeeded but getUser() returned null — session cookies may not have been set correctly',
      hint: 'Check cookie setAll handler — response object must be the same one cookies are set on',
    })
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

  // Non-404 DB error — explicit early return to prevent silent fall-through
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('[auth/callback] stage=fetch_user_profile error:', {
      code: profileError.code,
      message: profileError.message,
      hint: profileError.hint,
      userId: user.id,
      note: 'Non-404 DB error — check RLS policies on user_profiles table and network connectivity to Supabase',
    })
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'auth_callback_failed', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // No profile found - this email hasn't been added by an admin
  if (profileError && profileError.code === 'PGRST116') {
    console.error('[auth/callback] stage=fetch_user_profile error:', {
      code: 'PGRST116',
      userId: user.id,
      email: user.email,
      message: 'No user_profiles row found for this auth user — user must be created by an admin before OAuth login is allowed',
    })
    await supabase.auth.signOut()
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'no_account', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // Profile is deactivated
  if (profile?.deleted_at) {
    console.warn('[auth/callback] stage=profile_deactivation_check:', {
      userId: user.id,
      email: user.email,
      deletedAt: profile.deleted_at,
      message: 'User attempted login but profile is deactivated',
    })
    await supabase.auth.signOut()
    const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
    errorResponse.cookies.set('auth_error', 'deactivated', { maxAge: 10, path: '/' })
    return errorResponse
  }

  // Success - response already has redirect URL and session cookies set
  console.debug('[auth/callback] stage=success', {
    redirectTo: next,
  })
  return response
}
