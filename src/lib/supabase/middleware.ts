import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = ['/login', '/signup', '/verify-otp', '/forgot-password'].some(
    (p) => pathname.startsWith(p)
  )
  const isProtectedRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/client')
  const isApiRoute = pathname.startsWith('/api')

  if (isApiRoute) return supabaseResponse

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    const role = user.app_metadata?.role
    url.pathname =
      role && ['super_admin', 'admin', 'support'].includes(role)
        ? '/admin/dashboard'
        : '/client/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
