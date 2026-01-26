import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { generateId } from '@/shared/id'
import { extractPlaintextFromLexical } from '@/lib/lexical-utils'
import { POST_SORT_OPTIONS, POST_STATUS, POST_TYPE, POST_VISIBILITY, type PostSortOption } from '@/shared/constants'
import { mediaService, type MediaService } from './media.service'
import { storageService } from './storage.service'

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
  status?: string
  visibility?: string
  authorIds?: string[]
  sort?: PostSortOption
  includeDeleted?: boolean
  deletedOnly?: boolean
}

const SORT_ORDER_BY: Record<PostSortOption, { [key: string]: 'asc' | 'desc' }> = {
  [POST_SORT_OPTIONS.NEWEST]: { createdAt: 'desc' },
  [POST_SORT_OPTIONS.OLDEST]: { createdAt: 'asc' },
  [POST_SORT_OPTIONS.RECENTLY_UPDATED]: { updatedAt: 'desc' },
}

export class PostsService {
  constructor(private mediaService: MediaService) {}

  async findOne(params: { id?: string; slug?: string; includeDeleted?: boolean }) {
    const where: any = {}
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
      return { ...post, featuredMedia: { ...post.featuredMedia, url } }
    }
    if (post?.featuredMedia) {
      return { ...post, featuredMedia: null }
    }

    return post
  }

  async findMany(params: FindPostsParams) {
    const where: any = {}

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
    const orderBy = SORT_ORDER_BY[sort] ?? { updatedAt: 'desc' }

    const posts = await prisma.post.findMany({
      where,
      orderBy,
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
      },
    })

    const featuredIds = [...new Set(posts.map((p) => p.featuredMediaId).filter(Boolean))] as string[]
    const featuredList = featuredIds.length > 0 ? await this.mediaService.findManyByIds(featuredIds) : []
    const featuredMap = Object.fromEntries(featuredList.map((m) => [m.id, m]))

    return posts.map((p) => ({
      ...p,
      featuredMedia: p.featuredMediaId ? featuredMap[p.featuredMediaId] ?? null : null,
    }))
  }

  async create(data: CreatePostData) {
    const generatedPlaintext = data.plaintext || extractPlaintextFromLexical(data.lexical || null)
    const tags = data.tagIds?.length
      ? { create: data.tagIds.map((tagId) => ({ tagId })) }
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
      status: data.status || POST_STATUS.DRAFT,
      type: POST_TYPE.POST,
      visibility: data.visibility || POST_VISIBILITY.PUBLIC,
      publishedAt,
      tags,
    }
    return prisma.post.create({
      data: createData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
  }

  async update(id: string, data: UpdatePostData) {
    const generatedPlaintext = data.lexical !== undefined 
      ? (data.plaintext || extractPlaintextFromLexical(data.lexical))
      : data.plaintext

    return prisma.$transaction(async (tx) => {
      if (data.tagIds !== undefined) {
        await tx.postTag.deleteMany({ where: { postId: id } })
        if (data.tagIds.length > 0) {
          await tx.postTag.createMany({
            data: data.tagIds.map((tagId: string) => ({
              postId: id,
              tagId,
            })),
            skipDuplicates: true,
          })
        }
      }

      const updateData: Record<string, unknown> = {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.slug && { slug: data.slug }),
          ...(data.lexical !== undefined && { lexical: data.lexical }),
          ...(generatedPlaintext !== undefined && { plaintext: generatedPlaintext }),
          ...(data.status && { status: data.status }),
          ...(data.visibility && { visibility: data.visibility }),
          ...(data.featured !== undefined && { featured: data.featured }),
          ...(data.featuredMediaId !== undefined && { featuredMediaId: data.featuredMediaId }),
          updatedAt: new Date(),
        }
        if (data.publishedAt !== undefined) {
          updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null
        } else if (data.status === POST_STATUS.PUBLISHED) {
          const current = await tx.post.findUnique({ where: { id }, select: { publishedAt: true } })
          if (current && !current.publishedAt) {
            updateData.publishedAt = new Date()
          }
        }

        return tx.post.update({
          where: { id },
          data: updateData as any,
          include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })
    })
  }

  async softDelete(id: string) {
    return prisma.$transaction(async (tx) => {
      const media = await tx.media.findMany({
        where: {
          mediableType: 'Post',
          mediableId: id,
        },
      })

      if (media.length > 0) {
        await tx.media.updateMany({
          where: {
            mediableType: 'Post',
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
          mediableType: 'Post',
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
    return prisma.$transaction(async (tx) => {
      const media = await tx.media.findMany({
        where: {
          mediableType: 'Post',
          mediableId: id,
        },
      })

      for (const m of media) {
        await this.mediaService.hardDelete(m.id)
      }

      return tx.post.delete({
        where: { id },
      })
    })
  }
}

export const postsService = new PostsService(mediaService)
