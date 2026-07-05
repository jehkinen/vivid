import { describe, it, expect } from 'vitest'
import { buildCoverPrompt } from '@/lib/ai/build-cover-prompt'
import { COVER_MIN_PLAINTEXT_CHARS, COVER_PROMPT_EXCERPT_MAX } from '@/shared/constants'

describe('buildCoverPrompt', () => {
  it('is sufficient when title is present', () => {
    const result = buildCoverPrompt({
      title: 'My Post',
      plaintext: '',
      stylePreset: 'editorial',
    })
    expect(result.sufficient).toBe(true)
    expect(result.sourceParts.title).toBe('My Post')
    expect(result.prompt).toContain('Topic: My Post')
  })

  it('is sufficient when plaintext meets minimum length', () => {
    const plaintext = 'a'.repeat(COVER_MIN_PLAINTEXT_CHARS)
    const result = buildCoverPrompt({
      title: '',
      plaintext,
      stylePreset: 'minimal',
    })
    expect(result.sufficient).toBe(true)
    expect(result.sourceParts.excerpt).toBe(plaintext)
  })

  it('is insufficient when content is too short', () => {
    const result = buildCoverPrompt({
      title: '  ',
      plaintext: 'short',
      stylePreset: 'moody',
    })
    expect(result.sufficient).toBe(false)
  })

  it('truncates long plaintext in excerpt', () => {
    const plaintext = 'word '.repeat(200)
    const result = buildCoverPrompt({
      title: 'Title',
      plaintext,
      stylePreset: 'abstract',
    })
    expect(result.sourceParts.excerpt!.length).toBeLessThanOrEqual(COVER_PROMPT_EXCERPT_MAX + 1)
  })

  it('includes tag names in prompt and sourceParts', () => {
    const result = buildCoverPrompt({
      title: 'Title',
      plaintext: 'Some body text that is long enough for context here.',
      tagNames: ['Travel', 'Notes'],
      stylePreset: 'editorial',
    })
    expect(result.sourceParts.tags).toEqual(['Travel', 'Notes'])
    expect(result.prompt).toContain('Themes: Travel, Notes')
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

  it('applies style preset suffix', () => {
    const editorial = buildCoverPrompt({
      title: 'Title',
      stylePreset: 'editorial',
    })
    const abstract = buildCoverPrompt({
      title: 'Title',
      stylePreset: 'abstract',
    })
    expect(editorial.prompt).toContain('Editorial magazine cover style')
    expect(abstract.prompt).toContain('Abstract artistic interpretation')
  })
})
