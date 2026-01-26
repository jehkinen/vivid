import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getAuthCookieName, verifyAuthToken } from '@/lib/auth'

export async function GET() {
  const token = (await cookies()).get(getAuthCookieName())?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let payload: { sub: string; email: string }
  try {
    payload = await verifyAuthToken(token)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const author = await prisma.author.findUnique({
    where: { id: payload.sub },
    select: { name: true, email: true },
  })
  if (!author) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  return NextResponse.json({ name: author.name, email: author.email })
}
