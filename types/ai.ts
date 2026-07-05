import type { COVER_STYLE_PRESETS } from '@/shared/constants'

export type CoverStylePreset = (typeof COVER_STYLE_PRESETS)[number]['id']

export type CoverPromptSourceParts = {
  title?: string
  excerpt?: string
  tags?: string[]
}

export type CoverPromptInput = {
  title?: string | null
  plaintext?: string | null
  tagNames?: string[]
  stylePreset: CoverStylePreset
  promptOverride?: string
}

export type CoverPromptResult = {
  prompt: string
  sourceParts: CoverPromptSourceParts
  sufficient: boolean
}

export type GenerateCoverDraft = {
  title?: string
  plaintext?: string
  tagNames?: string[]
}

export type GenerateCoverRequest = {
  stylePreset: CoverStylePreset
  promptOverride?: string
  draft?: GenerateCoverDraft
  replaceMediaId?: string
}

export type GenerateCoverMedia = {
  id: string
  url: string
  filename: string
}

export type GenerateCoverResponse = {
  media: GenerateCoverMedia
}

export type OpenAiIntegrationStatus = {
  configured: boolean
  hint?: string
}
