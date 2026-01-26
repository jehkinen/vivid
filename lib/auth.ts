import { SignJWT, jwtVerify } from 'jose'

const AUTH_COOKIE = 'auth-token'
const getSecret = () => {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(s)
}

export async function signAuthToken(payload: { sub: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getSecret())
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as { sub: string; email: string }
}

export function getAuthCookieName() {
  return AUTH_COOKIE
}
