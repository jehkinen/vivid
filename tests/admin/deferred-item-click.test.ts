import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDeferredItemClickHandle } from '@/components/admin/media/deferred-item-click'

describe('createDeferredItemClickHandle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs selection after delay on single click', () => {
    const handle = createDeferredItemClickHandle(250)
    const select = vi.fn()
    handle.schedule('a', select)
    expect(select).not.toHaveBeenCalled()
    vi.advanceTimersByTime(250)
    expect(select).toHaveBeenCalledOnce()
  })

  it('cancels pending selection when preview opens on double click', () => {
    const handle = createDeferredItemClickHandle(250)
    const select = vi.fn()
    handle.schedule('a', select)
    handle.cancel('a')
    vi.advanceTimersByTime(250)
    expect(select).not.toHaveBeenCalled()
  })
})
