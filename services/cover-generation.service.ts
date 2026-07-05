import { buildCoverImagePrompt } from '@/lib/ai/build-cover-image-prompt'
import { applyCoverPromptGuardrails } from '@/lib/ai/cover-prompt-guardrails'
import { buildCoverPrompt, isUsablePromptOverride } from '@/lib/ai/build-cover-prompt'
import { extractCoverConceptLocal } from '@/lib/ai/extract-cover-concept'
import {
  GENERATED_COVER_FILENAME,
  MEDIA_COLLECTIONS,
  MEDIABLE_TYPES,
} from '@/shared/constants'
import type { GenerateCoverRequest } from '@/types/ai'
import { authorSecretsService, OpenAiNotConfiguredError } from './author-secrets.service'
import { mediaService } from './media.service'
import { openaiCoverConceptService } from './openai-cover-concept.service'
import { openaiImagesService } from './openai-images.service'
import { postsService } from './posts.service'

export { OpenAiNotConfiguredError }

export class CoverGenerationService {
  async generateCover(authorId: string, postId: string, input: GenerateCoverRequest) {
    const post = await postsService.findOne({ id: postId, includeDeleted: true })
    if (!post) {
      throw new Error('Post not found')
    }

    const apiKey = await authorSecretsService.requireOpenAiKey(authorId)

    const title = input.draft?.title ?? post.title
    const plaintext = input.draft?.plaintext ?? post.plaintext
    const tagNames =
      input.draft?.tagNames ??
      post.tags?.map((entry) => entry.tag.name).filter(Boolean) ??
      []

    const sufficient = buildCoverPrompt({
      title,
      plaintext,
      tagNames,
      stylePreset: input.stylePreset,
    }).sufficient

    if (!sufficient) {
      throw new Error('Write a title or a few sentences before generating a cover')
    }

    const promptOverride = isUsablePromptOverride(input.promptOverride)
      ? input.promptOverride.trim()
      : undefined

    const concept = promptOverride
      ? undefined
      : await openaiCoverConceptService.extractVisualBrief(apiKey, {
          title,
          plaintext,
          tagNames,
        })

    const prompt = applyCoverPromptGuardrails(
      promptOverride
        ? promptOverride
        : buildCoverImagePrompt(
            concept ?? extractCoverConceptLocal({ title, plaintext, tagNames }) ?? title ?? '',
            input.stylePreset
          )
    )

    const buffer = await openaiImagesService.generateImage(apiKey, prompt)
    const results = await mediaService.upload(
      MEDIABLE_TYPES.POST,
      postId,
      [
        {
          buffer,
          filename: GENERATED_COVER_FILENAME,
          mimeType: 'image/jpeg',
          size: buffer.byteLength,
        },
      ],
      {
        collection: MEDIA_COLLECTIONS.FEATURED,
        replaceMediaId: input.replaceMediaId,
      }
    )

    const media = results[0]
    return {
      id: media.id,
      url: media.url,
      filename: media.filename,
      concept: concept ?? extractCoverConceptLocal({ title, plaintext, tagNames }),
      prompt,
    }
  }
}

export const coverGenerationService = new CoverGenerationService()
