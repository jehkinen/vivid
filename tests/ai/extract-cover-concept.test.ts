import { describe, it, expect } from 'vitest'
import { extractCoverConceptLocal } from '@/lib/ai/extract-cover-concept'
import { COVER_LOCAL_CONCEPT_MAX } from '@/shared/constants'

describe('extractCoverConceptLocal', () => {
  it('prefers body lead over title and tags', () => {
    const concept = extractCoverConceptLocal({
      title: 'Summer in Lisbon',
      plaintext: 'We arrived at dawn. The streets were empty. Cafes opened slowly. By noon the city was alive again.',
      tagNames: ['Travel'],
    })
    expect(concept).toContain('We arrived at dawn.')
    expect(concept).not.toContain('Summer in Lisbon')
    expect(concept).not.toContain('By noon')
    expect(concept).not.toContain('Travel')
  })

  it('falls back to title when body is empty', () => {
    const concept = extractCoverConceptLocal({
      title: 'Summer in Lisbon',
      plaintext: '',
      tagNames: ['Travel'],
    })
    expect(concept).toBe('Summer in Lisbon')
  })

  it('uses first paragraph only', () => {
    const concept = extractCoverConceptLocal({
      title: 'Notes',
      plaintext: 'First paragraph about the main idea.\n\nSecond paragraph should be ignored for the lead.',
    })
    expect(concept).toContain('First paragraph')
    expect(concept).not.toContain('Second paragraph')
  })

  it('truncates very long concepts', () => {
    const concept = extractCoverConceptLocal({
      plaintext: `${'Long sentence. '.repeat(40)}`,
    })
    expect(concept!.length).toBeLessThanOrEqual(COVER_LOCAL_CONCEPT_MAX + 1)
  })
})
