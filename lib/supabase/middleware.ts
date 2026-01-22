import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Public routes that don't require authentication
    const publicRoutes = ['/auth', '/invite', '/']
    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
    )

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // Skip auth check for public routes to improve performance
    if (!isPublicRoute) {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            // no user, potentially respond by redirecting the user to the login page
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely.

    // Add security headers
    supabaseResponse.headers.set('X-DNS-Prefetch-Control', 'on')
    supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
    supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
    supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // Content Security Policy
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim()

    supabaseResponse.headers.set('Content-Security-Policy', cspHeader)

    return supabaseResponse
}
