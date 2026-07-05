const MODERATION_SAFE_MARKERS = ['non-sexual', 'modest', 'fully clothed'] as const

export function applyCoverPromptGuardrails(prompt: string): string {
  const normalized = prompt.trim()
  const lower = normalized.toLowerCase()
  if (MODERATION_SAFE_MARKERS.every((marker) => lower.includes(marker))) {
    return normalized
  }
  return `${normalized} Modest fully clothed figures, non-sexual editorial art.`
}

export function isOpenAiModerationBlock(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('safety system') ||
    lower.includes('moderation_blocked') ||
    lower.includes('safety_violations')
  )
}

export function formatOpenAiModerationError(message: string): string {
  if (!isOpenAiModerationBlock(message)) return message
  return `${message} Try silhouettes from behind, spring light through a window, or symbolic scenes instead of close physical contact.`
}
