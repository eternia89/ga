import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Sign out from all sessions (global scope)
  await supabase.auth.signOut({ scope: 'global' })

  const requestUrl = new URL(request.url)
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
