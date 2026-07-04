import { describe, it, expect } from 'vitest'
import { AUTO_LINK_MATCHERS } from '@/lib/editor/link-matchers'

describe('AUTO_LINK_MATCHERS', () => {
  const urlMatcher = AUTO_LINK_MATCHERS[0]
  const emailMatcher = AUTO_LINK_MATCHERS[1]

  describe('URL matcher', () => {
    it('matches https URL', () => {
      const match = urlMatcher('https://example.com/path')
      expect(match).toEqual({
        index: 0,
        length: 'https://example.com/path'.length,
        text: 'https://example.com/path',
        url: 'https://example.com/path',
      })
    })

    it('prefixes www URLs with https', () => {
      const match = urlMatcher('www.example.com')
      expect(match?.url).toBe('https://www.example.com')
    })

    it('returns null for plain text', () => {
      expect(urlMatcher('not a link')).toBeNull()
    })
  })

  describe('email matcher', () => {
    it('matches email and adds mailto', () => {
      const match = emailMatcher('user@example.com')
      expect(match?.text).toBe('user@example.com')
      expect(match?.url).toBe('mailto:user@example.com')
    })

    it('returns null for invalid email', () => {
      expect(emailMatcher('user@')).toBeNull()
    })
  })
})
