import type { Media, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/shared/id'
import { sanitizeFilenameForS3 } from '@/lib/utils'
import { storageService } from './storage.service'
import { imageProcessingService } from './image-processing.service'
import {
  MEDIA_COLLECTIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_CONVERSIONS,
  MEDIA_FILTER_TYPES,
  MEDIABLE_TYPES,
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

  async getLibrary(options: { page: number; perPage: number; type: MediaFilterType }) {
    const { page, perPage, type } = options

    const where: Prisma.MediaWhereInput = {
      deletedAt: null,
    }

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

    const itemsWithUrls = await Promise.all(
      items.map(async (m) => {
        const mime = m.mimeType || ''
        const isImage = mime.startsWith('image/')
        const hasThumb =
          isImage &&
          m.generatedConversions &&
          typeof m.generatedConversions === 'object' &&
          (m.generatedConversions as Record<string, boolean>)[IMAGE_CONVERSIONS.THUMB]

        let thumbUrl: string | null = null
        if (hasThumb) {
          const lastDot = m.key.lastIndexOf('.')
          const hasExt = lastDot > m.key.lastIndexOf('/')
          const ext = hasExt ? m.key.slice(lastDot) : ''
          const baseKey = hasExt ? m.key.slice(0, lastDot) : m.key
          const lastSlash = baseKey.lastIndexOf('/')
          const prefix = lastSlash >= 0 ? baseKey.slice(0, lastSlash) : ''
          const baseName = lastSlash >= 0 ? baseKey.slice(lastSlash + 1) : baseKey
          const thumbKey = `${prefix}/conversions/${baseName}-${IMAGE_CONVERSIONS.THUMB}${ext}`
          thumbUrl = await storageService.getFileUrl(thumbKey)
        }

        const url = await storageService.getFileUrl(m.key)
        let linkedTitle: string | null = null
        let linkedSlug: string | null = null

        if (m.mediableType === MEDIABLE_TYPES.POST) {
          const post = await prisma.post.findUnique({
            where: { id: m.mediableId },
            select: { title: true, slug: true },
          })
          if (post) {
            linkedTitle = post.title
            linkedSlug = post.slug
          }
        }

        return { ...m, url, thumbUrl, linkedTitle, linkedSlug }
      })
    )

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