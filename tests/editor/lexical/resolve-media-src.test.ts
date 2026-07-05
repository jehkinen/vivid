import { describe, it, expect } from 'vitest'
import { resolveMediaSrc } from '@/lib/editor/lexical/resolve-media-src'

describe('resolveMediaSrc', () => {
  it('prefers urlMap entry when mediaId is set', () => {
    expect(resolveMediaSrc('m1', '/fallback', { m1: 'https://cdn/m1' })).toBe('https://cdn/m1')
  })

  it('falls back to src when mediaId missing from map', () => {
    expect(resolveMediaSrc('m1', '/fallback', {})).toBe('/fallback')
  })

  it('returns src when no mediaId', () => {
    expect(resolveMediaSrc(undefined, '/direct', { m1: 'https://cdn/m1' })).toBe('/direct')
  })
})
