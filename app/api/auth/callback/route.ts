import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    )

    if (exchangeError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_callback_failed`
      )
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_callback_failed`
      )
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
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=no_account`
      )
    }

    // Profile is deactivated
    if (profile?.deleted_at) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=deactivated`
      )
    }

    // Success - redirect to intended destination
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  }

  // No code provided
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=auth_callback_failed`
  )
}
