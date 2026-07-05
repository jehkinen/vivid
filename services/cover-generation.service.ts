import { buildCoverPrompt } from '@/lib/ai/build-cover-prompt'
import {
  GENERATED_COVER_FILENAME,
  MEDIA_COLLECTIONS,
  MEDIABLE_TYPES,
} from '@/shared/constants'
import type { GenerateCoverRequest } from '@/types/ai'
import { authorSecretsService, OpenAiNotConfiguredError } from './author-secrets.service'
import { mediaService } from './media.service'
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

    const { prompt, sufficient } = buildCoverPrompt({
      title,
      plaintext,
      tagNames,
      stylePreset: input.stylePreset,
      promptOverride: input.promptOverride,
    })

    if (!sufficient) {
      throw new Error('Write a title or a few sentences before generating a cover')
    }

    const buffer = await openaiImagesService.generateImage(apiKey, prompt)
    const results = await mediaService.upload(
      MEDIABLE_TYPES.POST,
      postId,
      [
        {
          buffer,
          filename: GENERATED_COVER_FILENAME,
          mimeType: 'image/png',
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
    }
  }
}

export const coverGenerationService = new CoverGenerationService()
