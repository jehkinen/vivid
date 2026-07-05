import { COVER_MIN_PLAINTEXT_CHARS } from '@/shared/constants'
import { extractCoverConceptLocal } from '@/lib/ai/extract-cover-concept'
import type { CoverPromptInput, CoverPromptResult } from '@/types/ai'
import { buildCoverImagePrompt } from '@/lib/ai/build-cover-image-prompt'

function isSufficient(title: string | null | undefined, plaintext: string | null | undefined): boolean {
  if (title?.trim()) return true
  return (plaintext?.trim().length ?? 0) >= COVER_MIN_PLAINTEXT_CHARS
}

export function isUsablePromptOverride(value: string | null | undefined): value is string {
  const trimmed = value?.trim()
  if (!trimmed) return false
  if (trimmed.includes('will be composed on Generate')) return false
  if (trimmed.includes('Post essence (preview)')) return false
  return true
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

  const override = isUsablePromptOverride(input.promptOverride) ? input.promptOverride.trim() : undefined
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

  return { prompt: '', sourceParts, sufficient }
}
