import type { Media, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/shared/id'
import { sanitizeFilenameForS3 } from '@/lib/utils'
import { collectMediaIds } from '@/lib/editor/lexical/collect-media-ids'
import { getCachedUsedMediaIds, invalidateUsedMediaIdsCache } from '@/lib/media-used-ids-cache'
import { storageService } from './storage.service'
import { imageProcessingService } from './image-processing.service'
import {
  MEDIA_COLLECTIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_CONVERSIONS,
  MEDIA_FILTER_TYPES,
  MEDIABLE_TYPES,
  POST_STATUS,
  POST_VISIBILITY,
  type MediaFilterType,
} from '@/shared/constants'

interface UploadFile {
  buffer: Buffer
  filename: string
  mimeType: string
  size: number
}

interface UploadOptions {
  collection?: string
  replaceMediaId?: string
}

export class MediaService {
  async upload(
    mediableType: string,
    mediableId: string,
    files: UploadFile[],
    options: UploadOptions = {}
  ) {
    const collection = options.collection || MEDIA_COLLECTIONS.DEFAULT
    const results = []

    for (const file of files) {
      const mediaId = options.replaceMediaId || generateId()
      const isImage = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimeType)
      const { basename, ext } = sanitizeFilenameForS3(file.filename)

      if (options.replaceMediaId) {
        const existingMedia = await prisma.media.findUnique({
          where: { id: mediaId },
        })

        if (!existingMedia) {
          throw new Error('Media not found')
        }

        if (existingMedia.mediableType !== mediableType || existingMedia.mediableId !== mediableId) {
          throw new Error('Media does not belong to this entity')
        }

        await storageService.deleteFilesByPrefix(`${mediableType.toLowerCase()}/${mediaId}/`)
        storageService.invalidateSignedUrlCacheForPrefix(`${mediableType.toLowerCase()}/${mediaId}/`)
      }

      const typePrefix = mediableType.toLowerCase()
      const originalKey = `${typePrefix}/${mediaId}/${basename}.${ext}`
      await storageService.uploadFile(file.buffer, originalKey, file.mimeType)

      let generatedConversions: Record<string, boolean> | null = null
      let conversionSize = 0

      if (isImage) {
        const conversions = await imageProcessingService.generateConversions(file.buffer)
        generatedConversions = {}
        conversionSize = conversions.reduce((sum, c) => sum + c.buffer.byteLength, 0)

        for (const conversion of conversions) {
          const conversionKey = `${typePrefix}/${mediaId}/conversions/${basename}-${conversion.name}.${ext}`
          await storageService.uploadFile(conversion.buffer, conversionKey, file.mimeType)
          generatedConversions[conversion.name] = true
        }
      }

      const media = await prisma.media.upsert({
        where: { id: mediaId },
        create: {
          id: mediaId,
          mediableType,
          mediableId,
          collection,
          key: originalKey,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          conversionSize,
          generatedConversions: generatedConversions || undefined,
        },
        update: {
          key: originalKey,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          conversionSize,
          generatedConversions: generatedConversions || undefined,
        },
      })

      const url = await storageService.getFileUrl(originalKey)
      results.push({ ...media, url })
    }

    return results
  }

  async findMany(mediableType: string, mediableId: string, collection?: string) {
    const where: Prisma.MediaWhereInput = {
      mediableType,
      mediableId,
      deletedAt: null,
    }

    if (collection) {
      where.collection = collection
    }

    const media = await prisma.media.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return Promise.all(
      media.map(async (m) => {
        const url = await storageService.getFileUrl(m.key)
        return { ...m, url }
      })
    )
  }

  async findOne(id: string) {
    const media = await prisma.media.findUnique({
      where: { id, deletedAt: null },
    })

    if (!media) {
      return null
    }

    const url = await storageService.getFileUrl(media.key)
    return { ...media, url }
  }

  async findManyByIds(ids: string[]) {
    if (ids.length === 0) return []
    const media = await prisma.media.findMany({
      where: { id: { in: ids }, deletedAt: null },
    })
    return Promise.all(
      media.map(async (m) => {
        const url = await storageService.getFileUrl(m.key)
        return { ...m, url }
      })
    )
  }

  async resolveUrlMap(ids: string[]): Promise<Record<string, string>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (uniqueIds.length === 0) return {}
    const list = await this.findManyByIds(uniqueIds)
    const urls: Record<string, string> = {}
    for (const m of list) {
      urls[m.id] = m.url
    }
    return urls
  }

  async softDelete(id: string) {
    return prisma.media.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  async restore(id: string) {
    return prisma.media.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    })
  }

  async hardDelete(id: string) {
    const media = await prisma.media.findUnique({
      where: { id },
    })

    if (!media) {
      return
    }

    await storageService.deleteFilesByPrefix(`${media.mediableType.toLowerCase()}/${media.id}/`)
    await prisma.media.deleteMany({ where: { id } })
  }

  async bulkHardDelete(ids: string[]) {
    const uniqueIds = [...new Set(ids)]
    const usedSet = await getCachedUsedMediaIds(() => this.collectUsedMediaIds())
    const pendingDeletes: string[] = []
    const blocked: Array<{ id: string; reason: string }> = []

    const mediaRows = await prisma.media.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
    })
    const mediaById = new Map(mediaRows.map((row) => [row.id, row]))

    for (const id of uniqueIds) {
      if (usedSet.has(id)) {
        blocked.push({ id, reason: 'Media is in use' })
        continue
      }

      if (!mediaById.has(id)) {
        blocked.push({ id, reason: 'Not found' })
        continue
      }

      pendingDeletes.push(id)
    }

    await Promise.all(pendingDeletes.map((id) => this.hardDelete(id)))

    if (pendingDeletes.length > 0) {
      invalidateUsedMediaIdsCache()
    }

    return { deleted: pendingDeletes, blocked }
  }

  async replace(id: string, file: UploadFile) {
    const existingMedia = await prisma.media.findUnique({
      where: { id },
    })

    if (!existingMedia) {
      throw new Error('Media not found')
    }

    await storageService.deleteFilesByPrefix(`${existingMedia.mediableType.toLowerCase()}/${existingMedia.id}/`)

    const isImage = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimeType)
    const { basename, ext } = sanitizeFilenameForS3(file.filename)
    const typePrefix = existingMedia.mediableType.toLowerCase()
    const originalKey = `${typePrefix}/${existingMedia.id}/${basename}.${ext}`
    await storageService.uploadFile(file.buffer, originalKey, file.mimeType)

    let generatedConversions: Record<string, boolean> | null = null
    let conversionSize = 0

    if (isImage) {
      const conversions = await imageProcessingService.generateConversions(file.buffer)
      generatedConversions = {}
      conversionSize = conversions.reduce((sum, c) => sum + c.buffer.byteLength, 0)

      for (const conversion of conversions) {
        const conversionKey = `${typePrefix}/${existingMedia.id}/conversions/${basename}-${conversion.name}.${ext}`
        await storageService.uploadFile(conversion.buffer, conversionKey, file.mimeType)
        generatedConversions[conversion.name] = true
      }
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        key: originalKey,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        conversionSize,
        generatedConversions: generatedConversions || undefined,
      },
    })

    const url = await storageService.getFileUrl(originalKey)
    return { ...updatedMedia, url }
  }

  async getConversionUrl(media: Pick<Media, 'id' | 'filename' | 'mediableType'>, conversionName: string): Promise<string> {
    const { basename, ext } = sanitizeFilenameForS3(media.filename)
    const conversionKey = `${media.mediableType.toLowerCase()}/${media.id}/conversions/${basename}-${conversionName}.${ext}`
    return storageService.getFileUrl(conversionKey)
  }

  private async findPublicFeaturedMedia(mediaId: string) {
    const post = await prisma.post.findFirst({
      where: {
        featuredMediaId: mediaId,
        status: POST_STATUS.PUBLISHED,
        visibility: POST_VISIBILITY.PUBLIC,
        deletedAt: null,
      },
      select: { id: true },
    })
    if (!post) return null

    return prisma.media.findUnique({
      where: { id: mediaId, deletedAt: null },
    })
  }

  async resolvePublicFeaturedMediaUrl(mediaId: string): Promise<string | null> {
    const media = await this.findPublicFeaturedMedia(mediaId)
    if (!media) return null
    return storageService.getFileUrl(media.key)
  }

  async resolveFeaturedThumbForPublicPost(mediaId: string): Promise<string | null> {
    const media = await this.findPublicFeaturedMedia(mediaId)
    if (!media) return null

    const hasThumb =
      media.generatedConversions &&
      typeof media.generatedConversions === 'object' &&
      (media.generatedConversions as Record<string, boolean>)[IMAGE_CONVERSIONS.THUMB]

    if (hasThumb) {
      return this.getConversionUrl(media, IMAGE_CONVERSIONS.THUMB)
    }

    return storageService.getFileUrl(media.key)
  }

  async purgeStaleFeaturedCovers(postId: string, activeMediaId: string) {
    await prisma.media.updateMany({
      where: {
        mediableType: MEDIABLE_TYPES.POST,
        mediableId: postId,
        collection: MEDIA_COLLECTIONS.FEATURED,
        deletedAt: null,
        id: { not: activeMediaId },
      },
      data: { deletedAt: new Date() },
    })
  }

  private lexicalToJsonString(lexical: unknown): string | null {
    if (lexical == null) return null
    if (typeof lexical === 'string') return lexical
    return JSON.stringify(lexical)
  }

  private async collectUsedMediaIds(): Promise<string[]> {
    const posts = await prisma.post.findMany({
      where: { deletedAt: null },
      select: { featuredMediaId: true, lexical: true },
    })

    const used = new Set<string>()
    for (const post of posts) {
      if (post.featuredMediaId) used.add(post.featuredMediaId)
      for (const mediaId of collectMediaIds(this.lexicalToJsonString(post.lexical))) {
        used.add(mediaId)
      }
    }
    return [...used]
  }

  private buildThumbKey(media: Pick<Media, 'key'>, conversionName: string): string | null {
    const lastDot = media.key.lastIndexOf('.')
    const hasExt = lastDot > media.key.lastIndexOf('/')
    const ext = hasExt ? media.key.slice(lastDot) : ''
    const baseKey = hasExt ? media.key.slice(0, lastDot) : media.key
    const lastSlash = baseKey.lastIndexOf('/')
    const prefix = lastSlash >= 0 ? baseKey.slice(0, lastSlash) : ''
    const baseName = lastSlash >= 0 ? baseKey.slice(lastSlash + 1) : baseKey
    return `${prefix}/conversions/${baseName}-${conversionName}${ext}`
  }

  private mediaHasThumb(media: Pick<Media, 'mimeType' | 'generatedConversions'>): boolean {
    const mime = media.mimeType || ''
    if (!mime.startsWith('image/')) return false
    if (!media.generatedConversions || typeof media.generatedConversions !== 'object') return false
    return Boolean((media.generatedConversions as Record<string, boolean>)[IMAGE_CONVERSIONS.THUMB])
  }

  async getLibrary(options: { page: number; perPage: number; type: MediaFilterType }) {
    const { page, perPage, type } = options

    const where: Prisma.MediaWhereInput = {
      deletedAt: null,
    }

    const usedSet = await getCachedUsedMediaIds(() => this.collectUsedMediaIds())
    const usedIds = [...usedSet]

    if (type === MEDIA_FILTER_TYPES.IMAGE) {
      where.mimeType = { startsWith: 'image/' }
    } else if (type === MEDIA_FILTER_TYPES.VIDEO) {
      where.mimeType = { startsWith: 'video/' }
    } else if (type === MEDIA_FILTER_TYPES.AUDIO) {
      where.mimeType = { startsWith: 'audio/' }
    } else if (type === MEDIA_FILTER_TYPES.DOCUMENT) {
      where.mimeType = {
        in: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      }
    } else if (type === MEDIA_FILTER_TYPES.UNUSED) {
      if (usedIds.length > 0) {
        where.id = { notIn: usedIds }
      }
    }

    const skip = (page - 1) * perPage

    const [items, total, totalSize] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.media.count({ where }),
      prisma.media.aggregate({
        _sum: {
          size: true,
          conversionSize: true,
        },
        where,
      }),
    ])

    const itemIds = items.map((item) => item.id)
    const featuredPosts =
      itemIds.length > 0
        ? await prisma.post.findMany({
            where: {
              featuredMediaId: { in: itemIds },
              deletedAt: null,
            },
            select: { featuredMediaId: true, title: true, slug: true },
          })
        : []
    const featuredByMediaId = new Map(
      featuredPosts.map((post) => [post.featuredMediaId!, post])
    )

    const postMediableIds = [
      ...new Set(
        items
          .filter(
            (item) =>
              item.mediableType === MEDIABLE_TYPES.POST &&
              item.mediableId &&
              !featuredByMediaId.has(item.id)
          )
          .map((item) => item.mediableId as string)
      ),
    ]
    const linkedPosts =
      postMediableIds.length > 0
        ? await prisma.post.findMany({
            where: { id: { in: postMediableIds }, deletedAt: null },
            select: { id: true, title: true, slug: true },
          })
        : []
    const postById = new Map(linkedPosts.map((post) => [post.id, post]))

    const urlKeys: string[] = []
    const urlKeyByItemId = new Map<string, string>()
    const thumbKeyByItemId = new Map<string, string>()

    for (const item of items) {
      const hasThumb = this.mediaHasThumb(item)
      if (hasThumb) {
        const thumbKey = this.buildThumbKey(item, IMAGE_CONVERSIONS.THUMB)
        if (thumbKey) {
          thumbKeyByItemId.set(item.id, thumbKey)
          urlKeys.push(thumbKey)
          urlKeyByItemId.set(item.id, thumbKey)
        }
      } else {
        urlKeys.push(item.key)
        urlKeyByItemId.set(item.id, item.key)
      }
    }

    const uniqueUrlKeys = [...new Set(urlKeys)]
    const signedUrls = await Promise.all(
      uniqueUrlKeys.map(async (key) => [key, await storageService.getFileUrl(key)] as const)
    )
    const urlByKey = new Map(signedUrls)

    const itemsWithUrls = items.map((m) => {
      const listKey = urlKeyByItemId.get(m.id)
      const url = listKey ? urlByKey.get(listKey) ?? '' : ''
      const thumbKey = thumbKeyByItemId.get(m.id)
      const thumbUrl = thumbKey ? urlByKey.get(thumbKey) ?? null : null
      const isUsed = usedSet.has(m.id)
      const featuredPost = featuredByMediaId.get(m.id)
      let linkedTitle: string | null = null
      let linkedSlug: string | null = null

      if (featuredPost) {
        linkedTitle = featuredPost.title
        linkedSlug = featuredPost.slug
      } else if (m.mediableType === MEDIABLE_TYPES.POST) {
        const post = m.mediableId ? postById.get(m.mediableId) : undefined
        if (post) {
          if (isUsed) {
            linkedTitle = post.title
            linkedSlug = post.slug
          } else {
            linkedTitle = `Unused · ${post.title}`
          }
        } else if (!isUsed) {
          linkedTitle = 'Unused'
        }
      } else if (!isUsed) {
        linkedTitle = 'Unused'
      }

      return { ...m, url, thumbUrl, linkedTitle, linkedSlug, isUsed }
    })

    const hasMore = skip + items.length < total
    const sumOriginal = totalSize._sum.size ?? 0
    const sumConversions = totalSize._sum.conversionSize ?? 0

    return {
      items: itemsWithUrls,
      hasMore,
      total,
      totalStored: sumOriginal + sumConversions,
    }
  }
}

export const mediaService = new MediaService()