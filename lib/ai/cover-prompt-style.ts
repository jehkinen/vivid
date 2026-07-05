import { COVER_STYLE_PRESETS } from '@/shared/constants'
import type { CoverStylePreset } from '@/types/ai'
import {
  COVER_IMAGE_PROMPT_GUARDRAIL,
  COVER_IMAGE_PROMPT_PREFIX,
  buildCoverImagePrompt,
} from '@/lib/ai/build-cover-image-prompt'
import { normalizeUserCoverPrompt } from '@/lib/ai/cover-prompt-guardrails'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const AUTO_PREFIX = new RegExp(`^${escapeRegex(COVER_IMAGE_PROMPT_PREFIX)}\\s*`, 'i')

const GUARDRAIL_SUFFIX = new RegExp(
  `\\s*${escapeRegex(COVER_IMAGE_PROMPT_GUARDRAIL)}\\.?\\s*$`,
  'i'
)

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
