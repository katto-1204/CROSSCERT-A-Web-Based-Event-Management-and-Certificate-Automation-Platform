import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LEGACY_REDIRECTS: Record<string, string> = {
  '/dashboard': '/admin/dashboard',
  '/my-events': '/participant/my-events',
  '/my-certificates': '/participant/certificates',
  '/events': '/participant/events',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (LEGACY_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(LEGACY_REDIRECTS[pathname], request.url))
  }

  if (pathname.startsWith('/events/') && pathname !== '/events/create') {
    const id = pathname.split('/')[2]
    if (id) {
      return NextResponse.redirect(new URL(`/participant/event/${id}`, request.url))
    }
  }

  if (pathname.match(/^\/event\/[^/]+\/register$/)) {
    const id = pathname.split('/')[2]
    return NextResponse.redirect(new URL(`/participant/event/${id}`, request.url))
  }

  if (pathname.match(/^\/event\/[^/]+\/evaluation$/)) {
    const id = pathname.split('/')[2]
    return NextResponse.redirect(new URL(`/participant/event/${id}/evaluation`, request.url))
  }

  if (pathname.match(/^\/event\/[^/]+$/)) {
    const id = pathname.split('/')[2]
    return NextResponse.redirect(new URL(`/participant/event/${id}`, request.url))
  }

  if (pathname === '/event/checkin') {
    return NextResponse.redirect(new URL('/admin/checkin', request.url))
  }

  const role = request.cookies.get('crosscert_role')?.value

  if (pathname.startsWith('/admin') && role !== 'admin') {
    const signIn = new URL('/auth/signin', request.url)
    signIn.searchParams.set('next', pathname)
    return NextResponse.redirect(signIn)
  }

  if (pathname.startsWith('/participant') && role !== 'participant' && role !== 'admin') {
    const signIn = new URL('/auth/signin', request.url)
    signIn.searchParams.set('next', pathname)
    return NextResponse.redirect(signIn)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/participant/:path*',
    '/dashboard',
    '/my-events',
    '/my-certificates',
    '/events/:path*',
    '/event/:path*',
  ],
}
