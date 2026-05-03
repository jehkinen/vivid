import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookieName, verifyAuthToken } from '@/lib/auth'

/** Returns 401 JSON if the request has no valid auth cookie; otherwise null. */
export async function unauthorizedUnlessAuthed(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(getAuthCookieName())?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await verifyAuthToken(token)
    return null
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
