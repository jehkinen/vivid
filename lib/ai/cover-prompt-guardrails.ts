export function normalizeUserCoverPrompt(prompt: string): string {
  return prompt
    .replace(/\s--ar\s+\d+:\d+/gi, '')
    .trim()
}

export function applyAutoCoverPromptGuardrails(prompt: string): string {
  return prompt.trim()
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
