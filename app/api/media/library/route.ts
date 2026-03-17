import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { storageService } from '@/services/storage.service'
import { IMAGE_CONVERSIONS, MEDIA_FILTER_TYPES, type MediaFilterType } from '@/shared/constants'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
  const perPage = Math.min(Math.max(parseInt(searchParams.get('perPage') || '40', 10) || 40, 1), 200)
  const typeParam = searchParams.get('type') as MediaFilterType | null
  const type: MediaFilterType = typeParam && Object.values(MEDIA_FILTER_TYPES).includes(typeParam)
    ? typeParam
    : MEDIA_FILTER_TYPES.ALL

  const where: any = {
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
      in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
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

      if (m.mediableType === 'Post') {
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

  return NextResponse.json({
    items: itemsWithUrls,
    hasMore,
    totalOriginalBytes: totalSize._sum.size ?? 0,
  })
}

