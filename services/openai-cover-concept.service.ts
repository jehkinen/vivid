import {
  COVER_CONCEPT_INPUT_MAX,
  COVER_CONCEPT_MAX_TOKENS,
  OPENAI_CONCEPT_MODEL,
} from '@/shared/constants'
import type { ExtractCoverConceptInput } from '@/lib/ai/extract-cover-concept'
import {
  parseCoverVisualBriefResponse,
  type CoverVisualBrief,
} from '@/lib/ai/parse-cover-visual-brief'

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'

const CONCEPT_SYSTEM_PROMPT = `You turn blog posts into one square cover-image scene.

Read the full post in any language. Your job is faithfulness to the author's main idea — not a decorative metaphor.

First find the SINGLE central story beat: what actually happens, what changed, or what the author keeps circling back to.
Then describe that exact beat as one visible image.

Reply with JSON only, no markdown:
{"coreMoment":"One plain English sentence naming the main event.","scene":"One English paragraph: that moment as a cover image."}

Scene rules:
- The scene MUST depict the central event (a refused gift, a goodbye, a dream reunion, a discovery — whatever the post is really about)
- Include concrete visible details from the post: objects, gestures, setting, mood
- Describe lighting, color mood, and atmosphere that match the post feeling
- Use vivid sensory details: textures, light direction, time of day, season, weather
- Do NOT invent unrelated imagery (random alleys, puzzle boxes, seasons) unless the post is about them
- Replace proper names with neutral roles (a young woman, a friend, two classmates)
- No readable text, logos, captions, or watermarks in the image
- Modest, fully clothed, non-sexual
- Maximum 80 words in scene`

export class OpenAiCoverConceptService {
  async extractVisualBrief(apiKey: string, input: ExtractCoverConceptInput): Promise<CoverVisualBrief> {
    const title = input.title?.trim()
    const body = input.plaintext?.trim()?.slice(0, COVER_CONCEPT_INPUT_MAX)
    const tags = input.tagNames?.map((tag) => tag.trim()).filter(Boolean)

    const userParts: string[] = [
      'Extract one cover image from this post.',
      'The scene must match the post main idea — the central event, not a side metaphor or mood-only atmosphere.',
    ]
    if (title) userParts.push(`Title (context): ${title}`)
    if (body) userParts.push(`Post:\n${body}`)
    if (tags?.length) {
      userParts.push(`Tags (context only): ${tags.join(', ')}`)
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
        temperature: 0.4,
        response_format: { type: 'json_object' },
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
    return parseCoverVisualBriefResponse(content)
  }
}

export const openaiCoverConceptService = new OpenAiCoverConceptService()
