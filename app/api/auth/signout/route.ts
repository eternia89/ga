import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Sign out from all sessions (global scope)
  const { error } = await supabase.auth.signOut({ scope: 'global' })
  if (error) {
    console.error('[signout] Failed to sign out:', error.message)
  }

  const requestUrl = new URL(request.url)
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
