import { COVER_STYLE_PRESETS } from '@/shared/constants'
import type { CoverStylePreset } from '@/types/ai'

function findPresetSuffix(stylePreset: CoverStylePreset): string {
  const preset = COVER_STYLE_PRESETS.find((p) => p.id === stylePreset)
  return preset?.promptSuffix ?? COVER_STYLE_PRESETS[0].promptSuffix
}

export function buildCoverImagePrompt(concept: string, stylePreset: CoverStylePreset): string {
  const scene = concept.trim()
  const suffix = findPresetSuffix(stylePreset)
  return [
    'Wide landscape blog cover image.',
    'No text, no letters, no logos, no watermarks, no captions.',
    scene,
    suffix,
  ].join(' ')
}
