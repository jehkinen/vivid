import { describe, it, expect } from 'vitest'
import { HIGHLIGHT_COLORS, getContrastTextColor } from '@/lib/editor/constants'

describe('getContrastTextColor', () => {
  it('returns light text on dark highlight', () => {
    expect(getContrastTextColor('#1f2937')).toBe('#ffffff')
  })

  it('returns dark text on light highlight', () => {
    expect(getContrastTextColor('#fef3c7')).toBe('#1f2937')
    expect(getContrastTextColor(HIGHLIGHT_COLORS[0])).toBe('#1f2937')
  })
})

describe('HIGHLIGHT_COLORS', () => {
  it('contains unique hex colors', () => {
    expect(new Set(HIGHLIGHT_COLORS).size).toBe(HIGHLIGHT_COLORS.length)
    for (const color of HIGHLIGHT_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
