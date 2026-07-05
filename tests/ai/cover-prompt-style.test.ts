import { describe, it, expect } from 'vitest'
import {
  applyCoverStyleToPrompt,
  rebuildCoverPromptFromScene,
  stripCoverPromptDecorations,
} from '@/lib/ai/cover-prompt-style'

describe('cover prompt style', () => {
  it('strips auto prefix, style suffixes, and guardrails', () => {
    const raw =
      'Square blog cover image. No text, no letters, no logos, no watermarks, no captions. A snowy street scene. Bold cartoon illustration, clean thin linework, soft cel shading, expressive stylized characters, not photorealistic. Modest fully clothed figures, non-sexual editorial art.'
    expect(stripCoverPromptDecorations(raw)).toBe('A snowy street scene')
  })

  it('rebuilds prompt with selected style', () => {
    const prompt = rebuildCoverPromptFromScene('A girl refuses a gift in a hallway.', 'editorial')
    expect(prompt).toContain('A girl refuses a gift')
    expect(prompt).toContain('Editorial magazine cover style')
    expect(prompt).not.toContain('cartoon')
  })

  it('swaps cartoon suffix for editorial when applying style', () => {
    const messy =
      'Square blog cover image. No text, no letters, no logos, no watermarks, no captions. Snowy street scene. Bold cartoon illustration, clean thin linework, soft cel shading, expressive stylized characters, not photorealistic.'
    const next = applyCoverStyleToPrompt(messy, 'editorial')
    expect(next).toContain('Snowy street scene')
    expect(next).toContain('Editorial magazine cover style')
    expect(next).not.toContain('cartoon')
  })
})
