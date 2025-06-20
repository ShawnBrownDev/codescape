import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Handle authentication errors
    if (error) {
      console.error('Auth error:', error, error_description)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent(error_description || error)}`)
    }

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase.auth.exchangeCodeForSession(code)
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin)
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${new URL(request.url).origin}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`)
  }
}