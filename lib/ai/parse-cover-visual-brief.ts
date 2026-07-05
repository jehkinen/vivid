export type CoverVisualBrief = {
  coreMoment: string
  scene: string
}

export function parseCoverVisualBriefResponse(content: string): CoverVisualBrief {
  const trimmed = content.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('OpenAI returned no structured concept')
  }

  const parsed = JSON.parse(jsonMatch[0]) as { coreMoment?: unknown; scene?: unknown }
  const coreMoment = typeof parsed.coreMoment === 'string' ? parsed.coreMoment.trim() : ''
  const scene = typeof parsed.scene === 'string' ? parsed.scene.trim() : ''

  if (!scene) {
    throw new Error('OpenAI returned no scene description')
  }

  return {
    coreMoment: coreMoment || scene,
    scene,
  }
}
