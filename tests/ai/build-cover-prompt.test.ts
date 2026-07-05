import { describe, it, expect } from 'vitest'
import { buildCoverPrompt } from '@/lib/ai/build-cover-prompt'
import { COVER_MIN_PLAINTEXT_CHARS } from '@/shared/constants'

describe('buildCoverPrompt', () => {
  it('is sufficient when title is present', () => {
    const result = buildCoverPrompt({
      title: 'My Post',
      plaintext: '',
      stylePreset: 'editorial',
    })
    expect(result.sufficient).toBe(true)
    expect(result.sourceParts.title).toBe('My Post')
    expect(result.prompt).toContain('will be composed on Generate')
  })

  it('is sufficient when plaintext meets minimum length', () => {
    const plaintext = 'a'.repeat(COVER_MIN_PLAINTEXT_CHARS)
    const result = buildCoverPrompt({
      title: '',
      plaintext,
      stylePreset: 'minimal',
    })
    expect(result.sufficient).toBe(true)
    expect(result.sourceParts.concept).toBeTruthy()
  })

  it('is insufficient when content is too short', () => {
    const result = buildCoverPrompt({
      title: '  ',
      plaintext: 'short',
      stylePreset: 'moody',
    })
    expect(result.sufficient).toBe(false)
  })

  it('uses AI concept for final image prompt without title duplication', () => {
    const result = buildCoverPrompt({
      title: 'Title',
      plaintext: 'word '.repeat(200),
      stylePreset: 'abstract',
      concept: 'Two silhouettes embracing in golden spring sunlight, dreamlike haze.',
    })
    expect(result.prompt).toContain('Two silhouettes embracing')
    expect(result.prompt).not.toContain('Topic:')
    expect(result.prompt).not.toContain('Themes:')
    expect(result.prompt).toContain('Abstract artistic interpretation')
  })

  it('uses promptOverride when provided', () => {
    const result = buildCoverPrompt({
      title: 'Title',
      plaintext: 'Body',
      stylePreset: 'minimal',
      promptOverride: 'Custom prompt only',
    })
    expect(result.prompt).toBe('Custom prompt only')
  })
})
