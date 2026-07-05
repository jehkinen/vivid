import { COVER_STYLE_PRESETS } from '@/shared/constants'
import type { CoverStylePreset } from '@/types/ai'
import { buildCoverImagePrompt } from '@/lib/ai/build-cover-image-prompt'
import { normalizeUserCoverPrompt } from '@/lib/ai/cover-prompt-guardrails'

const AUTO_PREFIX =
  /^Square blog cover image\.\s*No text, no letters, no logos, no watermarks, no captions\.\s*/i

const GUARDRAIL_SUFFIX = /\s*Modest fully clothed figures, non-sexual editorial art\.?\s*$/i

function allStyleSuffixes(): string[] {
  return COVER_STYLE_PRESETS.map((preset) => preset.promptSuffix)
}

export function stripCoverPromptDecorations(prompt: string): string {
  let text = normalizeUserCoverPrompt(prompt.trim())
  text = text.replace(AUTO_PREFIX, '')
  text = text.replace(GUARDRAIL_SUFFIX, '')

  for (const suffix of allStyleSuffixes()) {
    while (text.includes(suffix)) {
      text = text.replace(suffix, ' ')
    }
  }

  return text.replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '')
}

export function rebuildCoverPromptFromScene(
  scene: string,
  stylePreset: CoverStylePreset
): string {
  const cleaned = stripCoverPromptDecorations(scene)
  if (!cleaned) return ''
  return buildCoverImagePrompt(cleaned, stylePreset)
}

export function applyCoverStyleToPrompt(
  prompt: string,
  stylePreset: CoverStylePreset
): string {
  const scene = stripCoverPromptDecorations(prompt)
  if (!scene) return prompt.trim()
  return rebuildCoverPromptFromScene(scene, stylePreset)
}
