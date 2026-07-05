import {
  COVER_MIN_PLAINTEXT_CHARS,
  COVER_STYLE_PRESETS,
} from '@/shared/constants'
import { extractCoverConceptLocal } from '@/lib/ai/extract-cover-concept'
import type { CoverPromptInput, CoverPromptResult } from '@/types/ai'
import { buildCoverImagePrompt } from '@/lib/ai/build-cover-image-prompt'

function isSufficient(title: string | null | undefined, plaintext: string | null | undefined): boolean {
  if (title?.trim()) return true
  return (plaintext?.trim().length ?? 0) >= COVER_MIN_PLAINTEXT_CHARS
}

export function buildCoverPrompt(input: CoverPromptInput): CoverPromptResult {
  const title = input.title?.trim() || undefined
  const tags = input.tagNames?.map((t) => t.trim()).filter(Boolean)
  const localConcept = extractCoverConceptLocal({
    title: input.title,
    plaintext: input.plaintext,
    tagNames: input.tagNames,
  })
  const concept = input.concept?.trim() || localConcept
  const sourceParts = {
    ...(title ? { title } : {}),
    ...(concept ? { concept } : {}),
    ...(tags?.length ? { tags } : {}),
  }
  const sufficient = isSufficient(input.title, input.plaintext)

  const override = input.promptOverride?.trim()
  if (override) {
    return { prompt: override, sourceParts, sufficient }
  }

  if (input.concept?.trim()) {
    return {
      prompt: buildCoverImagePrompt(input.concept, input.stylePreset),
      sourceParts: { ...sourceParts, concept: input.concept.trim() },
      sufficient,
    }
  }

  const preset = COVER_STYLE_PRESETS.find((p) => p.id === input.stylePreset)
  const parts: string[] = [
    'Wide landscape blog cover image will be composed on Generate.',
    'No text, no logos, no watermarks.',
  ]
  if (localConcept) parts.push(`Post essence (preview): ${localConcept}.`)
  if (preset) parts.push(`Style: ${preset.label}.`)

  return {
    prompt: parts.join(' '),
    sourceParts,
    sufficient,
  }
}
