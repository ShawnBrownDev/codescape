import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  try {
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Handle authentication errors
    if (error) {
      console.error('Auth error:', error, error_description)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`
      )
    }

    if (!code) {
      console.error('No code provided')
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?error=no_code&error_description=No authorization code provided`
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        throw sessionError
      }

      if (!data.session) {
        throw new Error('No session created')
      }

      // Set cookie options
      const cookieOptions = {
        name: 'sb-access-token',
        value: data.session.access_token,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 7, // 1 week
      }

      // Set the cookie
      cookieStore.set(cookieOptions)

    } catch (exchangeError: any) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?error=exchange_error&error_description=${encodeURIComponent(exchangeError.message || 'Error exchanging code for session')}`
      )
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  } catch (error: any) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/error?error=unexpected_error&error_description=${encodeURIComponent(error.message || 'An unexpected error occurred')}`
    )
  }
}