import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthCookieName, verifyAuthToken } from '@/lib/auth'

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}

function isPublicBlogRoute(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/tag/')) return true
  if (pathname.startsWith('/lists')) return true
  if (/^\/[^/]+$/.test(pathname) && pathname !== '/login') {
    return true
  }
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get(getAuthCookieName())?.value
  let isAuthed = false
  if (token) {
    try {
      await verifyAuthToken(token)
      isAuthed = true
    } catch {
      isAuthed = false
    }
  }

  if (pathname === '/login') {
    if (isAuthed) return NextResponse.redirect(new URL('/vivid/posts', request.url))
    return NextResponse.next()
  }

  if (pathname.startsWith('/vivid')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.next()
  }

  if (isPublicBlogRoute(pathname)) {
    if (!isAuthed) {
      const login = new URL('/login', request.url)
      login.searchParams.set('from', pathname)
      return NextResponse.redirect(login)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}
