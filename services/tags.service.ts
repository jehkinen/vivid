import { prisma } from '@/lib/prisma'
import { generateId } from '@/shared/id'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'
import { POST_STATUS } from '@/shared/constants'

export interface MergeTagsResult {
  mergedPostCount: number
  targetTagSlug: string
}

interface CreateTagData {
  name: string
  color?: string
  slug: string
}

interface UpdateTagData {
  name?: string
  color?: string
  slug?: string
}

export class TagsService {
  async findMany() {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })
    return tags.sort((a, b) => {
      const countDiff = b._count.posts - a._count.posts
      return countDiff !== 0 ? countDiff : a.name.localeCompare(b.name)
    })
  }

  async findManyWithPublishedPostCount() {
    const counts = await prisma.postTag.groupBy({
      by: ['tagId'],
      where: {
        post: {
          status: POST_STATUS.PUBLISHED,
          deletedAt: null,
        },
      },
      _count: { postId: true },
    })
    const countByTagId = Object.fromEntries(counts.map((c) => [c.tagId, c._count.postId]))
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
    return tags.map((tag) => ({
      ...tag,
      postCount: countByTagId[tag.id] ?? 0,
    }))
  }

  async findOne(slug: string) {
    return prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })
  }

  async create(data: CreateTagData) {
    const color = data.color || this.getRandomColor()

    return prisma.tag.create({
      data: {
        id: generateId(),
        name: data.name,
        slug: data.slug,
        color,
      },
    })
  }

  async update(id: string, data: UpdateTagData) {
    return prisma.tag.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.color && { color: data.color }),
        ...(data.slug && { slug: data.slug }),
      },
    })
  }

  async delete(id: string) {
    const tag = await prisma.tag.findUnique({ where: { id } })
    if (!tag) throw new Error('Tag not found')
    return prisma.tag.delete({ where: { id } })
  }

  async merge(sourceTagId: string, targetTagId: string): Promise<MergeTagsResult> {
    if (sourceTagId === targetTagId) throw new Error('Source and target tag must be different')
    const [sourceTag, targetTag] = await Promise.all([
      prisma.tag.findUnique({ where: { id: sourceTagId } }),
      prisma.tag.findUnique({ where: { id: targetTagId } }),
    ])
    if (!sourceTag) throw new Error('Source tag not found')
    if (!targetTag) throw new Error('Target tag not found')

    const [sourcePostIds, targetPostIds] = await Promise.all([
      prisma.postTag.findMany({ where: { tagId: sourceTagId }, select: { postId: true } }).then((r) => r.map((x) => x.postId)),
      prisma.postTag.findMany({ where: { tagId: targetTagId }, select: { postId: true } }).then((r) => r.map((x) => x.postId)),
    ])
    const targetSet = new Set(targetPostIds)
    const toAdd = sourcePostIds.filter((pid) => !targetSet.has(pid))

    await prisma.$transaction(async (tx) => {
      if (toAdd.length > 0) {
        await tx.postTag.createMany({
          data: toAdd.map((postId) => ({
            id: generateId(),
            postId,
            tagId: targetTagId,
          })),
          skipDuplicates: true,
        })
      }
      await tx.tag.delete({ where: { id: sourceTagId } })
    })

    return { mergedPostCount: sourcePostIds.length, targetTagSlug: targetTag.slug }
  }

  private getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * TAG_DEFAULT_COLORS.length)
    return TAG_DEFAULT_COLORS[randomIndex]
  }
}

export const tagsService = new TagsService()