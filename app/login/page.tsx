'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ShaderBackground from '@/components/login/ShaderBackground'
import PublicLogo from '@/components/public/PublicLogo'
import { authClient } from '@/lib/api/authClient'

function safeReturnPath(from: string | null): string | null {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return null
  if (from.startsWith('/vivid')) return null
  return from
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      await authClient.login({ email, password })
      const next = safeReturnPath(searchParams.get('from')) ?? '/vivid/posts'
      router.push(next)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center">
      <div className="mb-6 px-4 py-2 rounded-lg bg-black/30 backdrop-blur-sm">
        <PublicLogo />
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-black/30 px-8 py-7 shadow-2xl shadow-black/40 backdrop-blur-xl w-full">
        <h1 className="text-[1.25rem] font-medium tracking-tight text-white mb-0.5">Sign in</h1>
        <p className="text-[0.8125rem] text-white/50 mb-6">Email and password</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[0.8125rem] font-medium text-white/80 mb-1.5">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-10 bg-white/[0.06] border-white/15 text-white placeholder:text-white/35 focus-visible:border-white/25"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[0.8125rem] font-medium text-white/80 mb-1.5">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="h-10 bg-white/[0.06] border-white/15 text-white placeholder:text-white/35 focus-visible:border-white/25"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="h-10 w-full font-medium" disabled={pending}>
            {pending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-5 text-center text-[0.8125rem] text-white/40 italic">
          Into the Pensieve, the memories swirl.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <ShaderBackground />
      <Suspense
        fallback={
          <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center text-white/50 text-sm">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
