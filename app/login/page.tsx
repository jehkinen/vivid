'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ShaderBackground from '@/components/login/ShaderBackground'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Invalid email or password')
        return
      }
      router.push('/vivid/posts')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <ShaderBackground />
      <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center">
        <span className="inline-flex rounded-full px-6 py-2.5 bg-black/25 backdrop-blur-sm mb-6">
          <span className="text-3xl font-semibold tracking-[0.35em] bg-gradient-to-r from-[#3eb8b5] via-[#d4738f] to-[#9b8bd4] bg-clip-text text-transparent [-webkit-text-fill-color:transparent] [filter:drop-shadow(0_0_2px_rgba(0,0,0,0.9))_drop-shadow(0_2px_12px_rgba(0,0,0,0.6))]">vivid</span>
        </span>
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
          <p className="mt-5 text-center text-[0.8125rem] text-white/40">
            <Link href="/vivid/posts" className="text-white/60 hover:text-white/90 transition-colors">
              Back to app
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
