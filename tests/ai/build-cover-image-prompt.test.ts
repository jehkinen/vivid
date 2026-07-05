import { describe, it, expect } from 'vitest'
import { buildCoverImagePrompt } from '@/lib/ai/build-cover-image-prompt'

describe('buildCoverImagePrompt', () => {
  it('combines scene with style suffix and guardrails', () => {
    const prompt = buildCoverImagePrompt(
      'Warm golden light on two silhouettes in a soft embrace.',
      'editorial'
    )
    expect(prompt).toContain('No text')
    expect(prompt).toContain('Warm golden light')
    expect(prompt).toContain('Editorial magazine cover style')
  })
})
