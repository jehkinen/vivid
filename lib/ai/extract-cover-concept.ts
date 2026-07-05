import {
  COVER_LEAD_SENTENCES_MAX,
  COVER_LOCAL_CONCEPT_MAX,
} from '@/shared/constants'

const SENTENCE_END = /(?<=[.!?…])\s+/

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace > max * 0.6) return `${slice.slice(0, lastSpace).trimEnd()}…`
  return `${slice.trimEnd()}…`
}

function firstParagraph(plaintext: string): string {
  const paragraph = plaintext.split(/\n\s*\n/).map((part) => part.trim()).find(Boolean)
  return paragraph ?? plaintext.trim()
}

function firstSentences(text: string, maxSentences: number): string {
  const parts = text.split(SENTENCE_END).map((part) => part.trim()).filter(Boolean)
  if (parts.length <= maxSentences) return parts.join(' ')
  return `${parts.slice(0, maxSentences).join(' ')}`
}

export type ExtractCoverConceptInput = {
  title?: string | null
  plaintext?: string | null
  tagNames?: string[]
}

export function extractCoverConceptLocal(input: ExtractCoverConceptInput): string | undefined {
  const title = input.title?.trim()
  const body = input.plaintext?.trim()
  const tags = input.tagNames?.map((tag) => tag.trim()).filter(Boolean)

  if (body) {
    const lead = firstSentences(firstParagraph(body), COVER_LEAD_SENTENCES_MAX)
    if (lead) return truncateAtWord(lead, COVER_LOCAL_CONCEPT_MAX)
  }

  if (title) return truncateAtWord(title, COVER_LOCAL_CONCEPT_MAX)

  return tags?.length ? tags.join(', ') : undefined
}
