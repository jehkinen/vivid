import { prisma } from '@/lib/prisma'
import { generateId } from '@/shared/id'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'

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
    return prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
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

  private getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * TAG_DEFAULT_COLORS.length)
    return TAG_DEFAULT_COLORS[randomIndex]
  }
}

export const tagsService = new TagsService()