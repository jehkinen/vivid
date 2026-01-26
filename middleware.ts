import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthCookieName, verifyAuthToken } from '@/lib/auth'

export const config = {
  matcher: ['/vivid/:path*', '/login'],
}

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl

  if (pathname === '/login') {
    if (isAuthed) return NextResponse.redirect(new URL('/vivid/posts', request.url))
    return NextResponse.next()
  }

  if (pathname.startsWith('/vivid')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.next()
  }

  return NextResponse.next()
}
