import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { signAuthToken, getAuthCookieName } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
  }
  const { email, password } = parsed.data

  const author = await prisma.author.findUnique({ where: { email } })
  if (!author?.passwordHash || !(await compare(password, author.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = await signAuthToken({ sub: author.id, email: author.email })
  const res = NextResponse.json({ success: true })
  const cookieName = getAuthCookieName()
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
