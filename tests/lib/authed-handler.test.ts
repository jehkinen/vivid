import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/require-auth-request', () => ({
  unauthorizedUnlessAuthed: vi.fn(),
}))

import { unauthorizedUnlessAuthed } from '@/lib/require-auth-request'
import { authedHandler } from '@/lib/authed-handler'

describe('authedHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthorized', async () => {
    vi.mocked(unauthorizedUnlessAuthed).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
    const handler = authedHandler(async () => NextResponse.json({ ok: true }))
    const res = await handler(new NextRequest('http://localhost/api/tags'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('calls inner handler when authorized', async () => {
    vi.mocked(unauthorizedUnlessAuthed).mockResolvedValue(null)
    const handler = authedHandler(async () => NextResponse.json({ data: 'test' }))
    const res = await handler(new NextRequest('http://localhost/api/tags'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: 'test' })
  })
})
