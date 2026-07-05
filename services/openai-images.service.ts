import {
  OPENAI_IMAGE_MODEL,
  OPENAI_IMAGE_RESPONSE_FORMAT,
  OPENAI_IMAGE_SIZE,
} from '@/shared/constants'

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations'

export class OpenAiImagesService {
  async generateImage(apiKey: string, prompt: string): Promise<Buffer> {
    const response = await fetch(OPENAI_IMAGES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        n: 1,
        size: OPENAI_IMAGE_SIZE,
        response_format: OPENAI_IMAGE_RESPONSE_FORMAT,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Update it in your profile.')
      }
      if (response.status === 429) {
        throw new Error('OpenAI rate limit reached. Wait a moment and try again.')
      }
      let message = `OpenAI request failed (${response.status})`
      try {
        const body = (await response.json()) as { error?: { message?: string } }
        if (body.error?.message) message = body.error.message
      } catch {
        // ignore parse errors
      }
      throw new Error(message)
    }

    const payload = (await response.json()) as {
      data?: Array<{ b64_json?: string }>
    }
    const b64 = payload.data?.[0]?.b64_json
    if (!b64) {
      throw new Error('OpenAI returned no image data')
    }
    return Buffer.from(b64, 'base64')
  }
}

export const openaiImagesService = new OpenAiImagesService()
