import { describe, it, expect } from 'vitest'
import { getImageCardWidthClass } from '@/lib/editor/lexical/image-layout'
import { IMAGE_CARD_WIDTH } from '@/shared/constants'

describe('getImageCardWidthClass', () => {
  it('returns full width class', () => {
    expect(getImageCardWidthClass(IMAGE_CARD_WIDTH.FULL)).toBe('w-full')
  })

  it('returns wide class', () => {
    expect(getImageCardWidthClass(IMAGE_CARD_WIDTH.WIDE)).toBe('max-w-4xl mx-auto')
  })

  it('returns normal class by default', () => {
    expect(getImageCardWidthClass(IMAGE_CARD_WIDTH.NORMAL)).toBe('max-w-2xl mx-auto')
    expect(getImageCardWidthClass(undefined)).toBe('max-w-2xl mx-auto')
  })
})
