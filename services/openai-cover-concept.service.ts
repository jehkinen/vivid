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
- Never write "man and woman" or romantic couple framing. Use "two figures", "two people", or silhouettes.
- For reunions or longing, prefer symbolic distance: figures from behind, side by side, foreheads close, or shadows on a sunlit wall — not tight hugs or body contact.
- Keep any people modest, fully clothed, and non-sexual; editorial reunion mood, not romance.
- Avoid literal close-up faces; prefer silhouettes, hands at a distance, hair in light, windows, nature.
- Compose for a square frame with a clear focal point and balanced edges.
- Capture the emotional peak through environment and light, not physical intimacy.
- Maximum 75 words. One paragraph only.

Example input mood: dream reunion, spring sunlight after winter, fear of loss, tender embrace.
Example output: Two distant silhouettes beside a sunlit window, shoulders almost touching, golden spring light on wheat-blonde hair; warmth in the air, hazy dreamlike glow, bittersweet calm, fully clothed, modest editorial scene.`

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
