import { prisma } from '@/lib/prisma'
import { generateId } from '@/shared/id'
import { sanitizeFilenameForS3 } from '@/lib/utils'
import { storageService } from './storage.service'
import { imageProcessingService } from './image-processing.service'
import { MEDIABLE_TYPES, MEDIA_COLLECTIONS, IMAGE_CONVERSIONS, ALLOWED_IMAGE_MIME_TYPES } from '@/shared/constants'

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
      const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimeType as any)
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

      if (isImage) {
        const conversions = await imageProcessingService.generateConversions(file.buffer)
        generatedConversions = {}

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
          generatedConversions: generatedConversions || undefined,
        },
        update: {
          key: originalKey,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          generatedConversions: generatedConversions || undefined,
        },
      })

      const url = await storageService.getFileUrl(originalKey)
      results.push({ ...media, url })
    }

    return results
  }

  async findMany(mediableType: string, mediableId: string, collection?: string) {
    const where: any = {
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

    return prisma.media.delete({
      where: { id },
    })
  }

  async replace(id: string, file: UploadFile) {
    const existingMedia = await prisma.media.findUnique({
      where: { id },
    })

    if (!existingMedia) {
      throw new Error('Media not found')
    }

    await storageService.deleteFilesByPrefix(`${existingMedia.mediableType.toLowerCase()}/${existingMedia.id}/`)

    const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimeType as any)
    const { basename, ext } = sanitizeFilenameForS3(file.filename)
    const typePrefix = existingMedia.mediableType.toLowerCase()
    const originalKey = `${typePrefix}/${existingMedia.id}/${basename}.${ext}`
    await storageService.uploadFile(file.buffer, originalKey, file.mimeType)

    let generatedConversions: Record<string, boolean> | null = null

    if (isImage) {
      const conversions = await imageProcessingService.generateConversions(file.buffer)
      generatedConversions = {}

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
        generatedConversions: generatedConversions || undefined,
      },
    })

    const url = await storageService.getFileUrl(originalKey)
    return { ...updatedMedia, url }
  }

  async getConversionUrl(media: any, conversionName: string): Promise<string> {
    const { basename, ext } = sanitizeFilenameForS3(media.filename)
    const conversionKey = `${media.mediableType.toLowerCase()}/${media.id}/conversions/${basename}-${conversionName}.${ext}`
    return storageService.getFileUrl(conversionKey)
  }
}

export const mediaService = new MediaService()