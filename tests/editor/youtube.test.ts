import { describe, it, expect } from 'vitest'
import { extractYouTubeVideoId } from '@/lib/editor/lexical/youtube-utils'

describe('extractYouTubeVideoId', () => {
  it('returns raw 11-char id', () => {
    expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses watch URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ'
    )
  })

  it('parses youtu.be URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses embed URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ'
    )
  })

  it('returns null for invalid input', () => {
    expect(extractYouTubeVideoId('')).toBeNull()
    expect(extractYouTubeVideoId('https://example.com')).toBeNull()
    expect(extractYouTubeVideoId('not-an-id')).toBeNull()
  })
})
