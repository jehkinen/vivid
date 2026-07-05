import { describe, it, expect } from 'vitest'
import {
  applyAutoCoverPromptGuardrails,
  normalizeUserCoverPrompt,
  formatOpenAiModerationError,
  isOpenAiModerationBlock,
} from '@/lib/ai/cover-prompt-guardrails'

describe('cover prompt guardrails', () => {
  it('appends modest markers to auto prompts when missing', () => {
    const result = applyAutoCoverPromptGuardrails('Square cover with two silhouettes.')
    expect(result).toContain('Modest fully clothed figures')
    expect(result).toContain('non-sexual')
  })

  it('skips append when markers already present', () => {
    const input = 'Modest fully clothed, non-sexual scene.'
    expect(applyAutoCoverPromptGuardrails(input)).toBe(input)
  })

  it('strips midjourney aspect ratio flags from user prompts', () => {
    expect(normalizeUserCoverPrompt('Anime scene --ar 4:5')).toBe('Anime scene')
  })

  it('detects moderation blocks', () => {
    expect(
      isOpenAiModerationBlock('Your request was rejected by the safety system. safety_violations=[sexual].')
    ).toBe(true)
  })

  it('adds hint for moderation blocks', () => {
    const message = 'Your request was rejected by the safety system.'
    expect(formatOpenAiModerationError(message)).toContain('silhouettes from behind')
  })
})
