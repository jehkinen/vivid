import {
  COVER_MIN_PLAINTEXT_CHARS,
  COVER_PROMPT_EXCERPT_MAX,
  COVER_STYLE_PRESETS,
} from '@/shared/constants'
import type { CoverPromptInput, CoverPromptResult } from '@/types/ai'

function findPresetSuffix(stylePreset: CoverPromptInput['stylePreset']): string {
  const preset = COVER_STYLE_PRESETS.find((p) => p.id === stylePreset)
  return preset?.promptSuffix ?? COVER_STYLE_PRESETS[0].promptSuffix
}

function buildExcerpt(plaintext: string | null | undefined): string | undefined {
  const trimmed = plaintext?.trim()
  if (!trimmed) return undefined
  if (trimmed.length <= COVER_PROMPT_EXCERPT_MAX) return trimmed
  return `${trimmed.slice(0, COVER_PROMPT_EXCERPT_MAX).trimEnd()}…`
}

function isSufficient(title: string | null | undefined, plaintext: string | null | undefined): boolean {
  if (title?.trim()) return true
  return (plaintext?.trim().length ?? 0) >= COVER_MIN_PLAINTEXT_CHARS
}

export function buildCoverPrompt(input: CoverPromptInput): CoverPromptResult {
  const title = input.title?.trim() || undefined
  const excerpt = buildExcerpt(input.plaintext)
  const tags = input.tagNames?.map((t) => t.trim()).filter(Boolean)
  const sourceParts = {
    ...(title ? { title } : {}),
    ...(excerpt ? { excerpt } : {}),
    ...(tags?.length ? { tags } : {}),
  }
  const sufficient = isSufficient(input.title, input.plaintext)

  const override = input.promptOverride?.trim()
  if (override) {
    return { prompt: override, sourceParts, sufficient }
  }

  const parts: string[] = [
    'Create a wide blog cover image with no text, no logos, and no watermarks.',
  ]
  if (title) parts.push(`Topic: ${title}.`)
  if (excerpt) parts.push(`Context: ${excerpt}`)
  if (tags?.length) parts.push(`Themes: ${tags.join(', ')}.`)
  parts.push(findPresetSuffix(input.stylePreset))

  return {
    prompt: parts.join(' '),
    sourceParts,
    sufficient,
  }
}
