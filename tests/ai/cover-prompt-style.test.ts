import { describe, it, expect } from 'vitest'
import {
  applyCoverStyleToPrompt,
  rebuildCoverPromptFromScene,
  stripCoverPromptDecorations,
} from '@/lib/ai/cover-prompt-style'

describe('cover prompt style', () => {
  it('strips auto prefix, style suffixes, and guardrails', () => {
    const raw =
      'Square blog cover image, centerpiece composition. No text, no letters, no logos, no watermarks, no captions. Emotionally resonant, visually striking. A snowy street scene. Bold cartoon illustration, clean thin linework, soft cel shading, expressive stylized characters, not photorealistic. Modest fully clothed figures, non-sexual editorial art.'
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
      'Square blog cover image, centerpiece composition. No text, no letters, no logos, no watermarks, no captions. Emotionally resonant, visually striking. Snowy street scene. Bold cartoon illustration, clean thin linework, soft cel shading, expressive stylized characters, not photorealistic.'
    const next = applyCoverStyleToPrompt(messy, 'editorial')
    expect(next).toContain('Snowy street scene')
    expect(next).toContain('Editorial magazine cover style')
    expect(next).not.toContain('cartoon')
  })

  it('strips legacy prefix when swapping style on old saved overrides', () => {
    const legacy =
      'Square blog cover image. No text, no letters, no logos, no watermarks, no captions. A young man on a balcony at sunset. Bold cartoon illustration, clean thin linework, soft cel shading, expressive stylized characters, not photorealistic.'
    const next = applyCoverStyleToPrompt(legacy, 'editorial')
    expect(next).toContain('A young man on a balcony at sunset')
    expect(next).toContain('Editorial magazine cover style')
    expect(next).toContain('centerpiece composition')
    expect(next).not.toContain('Square blog cover image. No text')
    expect(next).not.toContain('cartoon')
  })
})
