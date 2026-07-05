import { COVER_STYLE_PRESETS } from '@/shared/constants'
import type { CoverStylePreset } from '@/types/ai'

export const COVER_IMAGE_PROMPT_PREFIX = [
  'Square blog cover image, centerpiece composition.',
  'No text, no letters, no logos, no watermarks, no captions.',
  'Emotionally resonant, visually striking.',
].join(' ')

export const COVER_IMAGE_PROMPT_GUARDRAIL =
  'Modest fully clothed figures, non-sexual editorial art.'

function findPresetSuffix(stylePreset: CoverStylePreset): string {
  const preset = COVER_STYLE_PRESETS.find((p) => p.id === stylePreset)
  return preset?.promptSuffix ?? COVER_STYLE_PRESETS[0].promptSuffix
}

export function buildCoverImagePrompt(concept: string, stylePreset: CoverStylePreset): string {
  const scene = concept.trim()
  const suffix = findPresetSuffix(stylePreset)
  return [COVER_IMAGE_PROMPT_PREFIX, scene, suffix, COVER_IMAGE_PROMPT_GUARDRAIL].join(' ')
}
