import {
  COVER_CONCEPT_INPUT_MAX,
  COVER_CONCEPT_MAX_TOKENS,
  OPENAI_CONCEPT_MODEL,
} from '@/shared/constants'
import type { ExtractCoverConceptInput } from '@/lib/ai/extract-cover-concept'

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'

const CONCEPT_SYSTEM_PROMPT = `You are a visual art director for square blog cover images.

Read the post (any language). Write ONE scene description in English for an image generator.

Translate emotions and metaphors into visible cinema: light quality, season, weather, silhouettes, gestures, textures, color palette, depth of field.

Rules:
- Do NOT repeat the title, tags, opening sentence, or proper names verbatim.
- Do NOT ask for readable text, names, logos, captions, or watermarks in the image.
- Avoid literal close-up faces; prefer symbolic or cinematic scenes (silhouettes, hands, hair, light through windows, nature, empty rooms waking up).
- Compose for a square frame with a clear focal point and balanced edges.
- Capture the emotional peak of the text (reunion, loss, joy, longing) through environment and body language, not exposition.
- Maximum 75 words. One paragraph only.

Example input mood: dream reunion, spring sunlight after winter, fear of loss, tender embrace.
Example output: Two figures in soft silhouette, foreheads close, golden spring light washing over wheat-blonde hair and closed eyes; warmth radiating from the chest outward; shallow depth, hazy dreamlike glow, bittersweet calm.`

export class OpenAiCoverConceptService {
  async extractVisualBrief(apiKey: string, input: ExtractCoverConceptInput): Promise<string> {
    const title = input.title?.trim()
    const body = input.plaintext?.trim()?.slice(0, COVER_CONCEPT_INPUT_MAX)
    const tags = input.tagNames?.map((tag) => tag.trim()).filter(Boolean)

    const userParts: string[] = [
      'Compose a cover-image scene from this post.',
      'Use emotional and visual metaphors from the full text, not just the title.',
    ]
    if (title) userParts.push(`Title (context only, do not repeat): ${title}`)
    if (body) userParts.push(`Post:\n${body}`)
    if (tags?.length) {
      userParts.push(`Tags (mood hints only, do not list): ${tags.join(', ')}`)
    }

    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_CONCEPT_MODEL,
        messages: [
          { role: 'system', content: CONCEPT_SYSTEM_PROMPT },
          { role: 'user', content: userParts.join('\n\n') },
        ],
        max_tokens: COVER_CONCEPT_MAX_TOKENS,
        temperature: 0.65,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Update it in your profile.')
      }
      let message = `OpenAI concept request failed (${response.status})`
      try {
        const payload = (await response.json()) as { error?: { message?: string } }
        if (payload.error?.message) message = payload.error.message
      } catch {
        // ignore parse errors
      }
      throw new Error(message)
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = payload.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('OpenAI returned no concept summary')
    }
    return content
  }
}

export const openaiCoverConceptService = new OpenAiCoverConceptService()
