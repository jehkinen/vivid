import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthCookieName, verifyAuthToken } from '@/lib/auth'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(req: Request) {
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid input'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  const author = await prisma.author.findUnique({
    where: { id: payload.sub },
    select: { passwordHash: true },
  })

  if (!author?.passwordHash) {
    return NextResponse.json({ error: 'Password is not set for this account' }, { status: 400 })
  }

  if (!(await compare(currentPassword, author.passwordHash))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'New password must be different from the current one' }, { status: 400 })
  }

  const passwordHash = await hash(newPassword, 10)
  await prisma.author.update({
    where: { id: payload.sub },
    data: { passwordHash },
  })

  return NextResponse.json({ success: true })
}
