import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { generateId } from '@/shared/id'
import { extractPlaintextFromLexical } from '@/lib/lexical-utils'
import { countWords } from '@/lib/utils'
import { IMAGE_CONVERSIONS, MEDIABLE_TYPES, POST_SORT_OPTIONS, POST_STATUS, POST_TYPE, POST_VISIBILITY, type PostSortOption } from '@/shared/constants'
import { mediaService, type MediaService } from './media.service'
import { storageService } from './storage.service'
import { postReferencesService } from './post-references.service'
import { invalidateUsedMediaIdsCache } from '@/lib/media-used-ids-cache'

interface CreatePostData {
  title?: string
  slug?: string
  lexical?: string | null
  plaintext?: string | null
  status?: string
  visibility?: string
  publishedAt?: string | null
  tagIds?: string[]
}

interface UpdatePostData {
  title?: string
  slug?: string
  lexical?: string | null
  plaintext?: string | null
  status?: string
  visibility?: string
  publishedAt?: string | null
  featured?: boolean
  featuredMediaId?: string | null
  tagIds?: string[]
}

interface FindPostsParams {
  id?: string
  slug?: string
  search?: string
  tagIds?: string[]
  tagSlug?: string
  status?: string
  visibility?: string
  authorIds?: string[]
  sort?: PostSortOption
  includeDeleted?: boolean
  deletedOnly?: boolean
  includeAuthors?: boolean
  limit?: number
  offset?: number
}

const SORT_ORDER_BY: Record<PostSortOption, { [key: string]: 'asc' | 'desc' }> = {
  [POST_SORT_OPTIONS.NEWEST]: { createdAt: 'desc' },
  [POST_SORT_OPTIONS.OLDEST]: { createdAt: 'asc' },
  [POST_SORT_OPTIONS.RECENTLY_UPDATED]: { updatedAt: 'desc' },
}

export class PostsService {
  constructor(private mediaService: MediaService) {}

  async findOne(params: { id?: string; slug?: string; includeDeleted?: boolean }) {
    const where: Prisma.PostWhereInput = {}
    if (params.id) {
      where.id = params.id
    } else if (params.slug) {
      where.slug = params.slug
    }

    if (!params.includeDeleted) {
      where.deletedAt = null
    }

    const post = await prisma.post.findFirst({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        authors: {
          include: {
            author: true,
          },
        },
        featuredMedia: true,
      },
    })

    if (post?.featuredMedia && post.featuredMedia.deletedAt == null) {
      const url = await storageService.getFileUrl(post.featuredMedia.key)
      const hasThumb =
        post.featuredMedia.generatedConversions &&
        typeof post.featuredMedia.generatedConversions === 'object' &&
        (post.featuredMedia.generatedConversions as Record<string, boolean>)[IMAGE_CONVERSIONS.THUMB]
      const thumbUrl = hasThumb
        ? await this.mediaService.getConversionUrl(post.featuredMedia, IMAGE_CONVERSIONS.THUMB)
        : undefined
      return { ...post, featuredMedia: { ...post.featuredMedia, url, thumbUrl } }
    }
    if (post?.featuredMedia) {
      return { ...post, featuredMedia: null }
    }

    return post
  }

  async findMany(params: FindPostsParams) {
    const where: Prisma.PostWhereInput = {}

    if (params.deletedOnly) {
      where.deletedAt = { not: null }
    } else if (!params.includeDeleted) {
      where.deletedAt = null
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { plaintext: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    if (params.tagIds && params.tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: params.tagIds,
          },
        },
      }
    }
    if (params.tagSlug) {
      where.tags = {
        some: {
          tag: { slug: params.tagSlug },
        },
      }
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.visibility) {
      where.visibility = params.visibility
    }

    if (params.authorIds && params.authorIds.length > 0) {
      where.authors = {
        some: {
          authorId: { in: params.authorIds },
        },
      }
    }

    const sort = params.sort || POST_SORT_OPTIONS.NEWEST
    const orderBy =
      params.status === POST_STATUS.PUBLISHED && sort === POST_SORT_OPTIONS.NEWEST
        ? { publishedAt: 'desc' as const }
        : (SORT_ORDER_BY[sort] ?? { updatedAt: 'desc' })
    const limit = params.limit ?? 20
    const offset = params.offset ?? 0
    const includeAuthors = params.includeAuthors ?? false

    const raw = await prisma.post.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit + 1,
      select: {
        id: true,
        title: true,
        slug: true,
        plaintext: true,
        wordCount: true,
        publishedAt: true,
        status: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        featuredMediaId: true,
        tags: {
          include: {
            tag: true,
          },
        },
        ...(includeAuthors
          ? {
              authors: {
                include: {
                  author: {
                    select: { name: true },
                  },
                },
              },
            }
          : {}),
      },
    })

    const hasMore = raw.length > limit
    const posts = raw.slice(0, limit)
    const featuredIds = [...new Set(posts.map((p) => p.featuredMediaId).filter(Boolean))] as string[]
    const featuredList = featuredIds.length > 0 ? await this.mediaService.findManyByIds(featuredIds) : []
    const featuredMap = Object.fromEntries(
      await Promise.all(
        featuredList.map(async (m) => {
          const hasThumb =
            m.generatedConversions &&
            typeof m.generatedConversions === 'object' &&
            (m.generatedConversions as Record<string, boolean>)[IMAGE_CONVERSIONS.THUMB]
          const thumbUrl = hasThumb ? await this.mediaService.getConversionUrl(m, IMAGE_CONVERSIONS.THUMB) : undefined
          return [m.id, { ...m, thumbUrl }] as const
        })
      )
    )

    return {
      posts: posts.map((p) => ({
        ...p,
        featuredMedia: p.featuredMediaId ? featuredMap[p.featuredMediaId] ?? null : null,
      })),
      hasMore,
    }
  }

  async create(data: CreatePostData) {
    const generatedPlaintext = data.plaintext || extractPlaintextFromLexical(data.lexical || null)
    const tags = data.tagIds?.length
      ? { create: data.tagIds.filter((id): id is string => Boolean(id)).map((tagId) => ({ tagId })) }
      : undefined

    const isPublished = data.status === POST_STATUS.PUBLISHED
    const publishedAt = data.publishedAt
      ? new Date(data.publishedAt)
      : isPublished
        ? new Date()
        : null

    const createData: Prisma.PostUncheckedCreateInput = {
      id: generateId(),
      uuid: uuidv4(),
      title: data.title ?? '',
      slug: data.slug || `untitled-${generateId().slice(0, 8)}`,
      lexical: data.lexical ?? null,
      plaintext: generatedPlaintext ?? null,
      wordCount: countWords(generatedPlaintext),
      status: data.status || POST_STATUS.DRAFT,
      type: POST_TYPE.POST,
      visibility: data.visibility || POST_VISIBILITY.PUBLIC,
      publishedAt,
      tags,
    }
    try {
      const post = await prisma.$transaction(async (tx) => {
        return tx.post.create({
          data: createData,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        })
      })
      if (data.lexical) {
        await postReferencesService.syncFromLexical(post.id, data.lexical)
      }
      return post
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new Error('Slug must be unique for this post type')
      }
      throw err
    }
  }

  async update(id: string, data: UpdatePostData) {
    const hasLexical = data.lexical !== undefined && data.lexical !== null
    const lexicalStr: string | null = hasLexical ? data.lexical ?? null : null
    const generatedPlaintext = hasLexical
      ? (data.plaintext || extractPlaintextFromLexical(lexicalStr))
      : data.plaintext

    const wouldWipeContent =
      hasLexical &&
      generatedPlaintext !== undefined &&
      countWords(generatedPlaintext) === 0

    let allowContentUpdate = true
    if (wouldWipeContent) {
      const current = await prisma.post.findUnique({
        where: { id },
        select: { wordCount: true },
      })
      if (current?.wordCount != null && current.wordCount > 0) {
        allowContentUpdate = false
        const hasOtherUpdates =
          data.title !== undefined ||
          !!data.slug ||
          !!data.status ||
          data.visibility !== undefined ||
          data.tagIds !== undefined ||
          data.publishedAt !== undefined ||
          data.featuredMediaId !== undefined
        if (!hasOtherUpdates) {
          const existing = await prisma.post.findUnique({
            where: { id },
            include: { tags: { include: { tag: true } } },
          })
          if (existing) return existing
        }
      }
    }

    const updateData: Record<string, unknown> = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug && { slug: data.slug }),
      ...(allowContentUpdate && hasLexical && { lexical: data.lexical }),
      ...(allowContentUpdate && generatedPlaintext !== undefined && {
        plaintext: generatedPlaintext,
        wordCount: countWords(generatedPlaintext),
      }),
      ...(data.status && { status: data.status }),
      ...(data.visibility && { visibility: data.visibility }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.featuredMediaId !== undefined && { featuredMediaId: data.featuredMediaId }),
      updatedAt: new Date(),
    }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null
    } else if (data.status === POST_STATUS.PUBLISHED) {
      const current = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } })
      if (current && !current.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const shouldSyncRefs = allowContentUpdate && hasLexical

    let post

    if (data.tagIds !== undefined) {
      post = await prisma.$transaction(async (tx) => {
        await tx.postTag.deleteMany({ where: { postId: id } })
        if (data.tagIds!.length > 0) {
          await tx.postTag.createMany({
            data: data.tagIds!.map((tagId: string) => ({
              postId: id,
              tagId,
            })),
            skipDuplicates: true,
          })
        }
        return tx.post.update({
          where: { id },
          data: updateData as Prisma.PostUpdateInput,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        })
      })
      if (shouldSyncRefs) {
        await postReferencesService.syncFromLexical(id, data.lexical ?? null)
      }
    } else if (shouldSyncRefs) {
      post = await prisma.$transaction(async (tx) => {
        return tx.post.update({
          where: { id },
          data: updateData as Prisma.PostUpdateInput,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        })
      })
      await postReferencesService.syncFromLexical(id, data.lexical ?? null)
    } else {
      post = await prisma.post.update({
        where: { id },
        data: updateData as Prisma.PostUpdateInput,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })
    }

    if (data.featuredMediaId) {
      await this.mediaService.purgeStaleFeaturedCovers(id, data.featuredMediaId)
    }

    if (data.featuredMediaId !== undefined || data.lexical !== undefined) {
      invalidateUsedMediaIdsCache()
    }

    return post
  }

  async softDelete(id: string) {
    return prisma.$transaction(async (tx) => {
      const media = await tx.media.findMany({
        where: {
          mediableType: MEDIABLE_TYPES.POST,
          mediableId: id,
        },
      })

      if (media.length > 0) {
        await tx.media.updateMany({
          where: {
            mediableType: MEDIABLE_TYPES.POST,
            mediableId: id,
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }

      return tx.post.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      })
    })
  }

  async restore(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.media.updateMany({
        where: {
          mediableType: MEDIABLE_TYPES.POST,
          mediableId: id,
        },
        data: {
          deletedAt: null,
        },
      })

      return tx.post.update({
        where: { id },
        data: {
          deletedAt: null,
        },
      })
    })
  }

  async hardDelete(id: string) {
    const media = await prisma.media.findMany({
      where: {
        mediableType: MEDIABLE_TYPES.POST,
        mediableId: id,
      },
    })

    for (const m of media) {
      await this.mediaService.hardDelete(m.id)
    }

    return prisma.post.delete({
      where: { id },
    })
  }
}

export const postsService = new PostsService(mediaService)
