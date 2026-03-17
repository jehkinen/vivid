import { prisma } from '@/lib/prisma'
import { generateId } from '@/shared/id'
import { LIST_VISIBILITY } from '@/shared/constants'

interface CreateListData {
  title: string
  slug: string
  visibility?: string
}

interface UpdateListData {
  title?: string
  slug?: string
  visibility?: string
}

interface CreateListItemData {
  text: string
}

export class ListsService {
  async findMany(visibility?: string) {
    const where = visibility ? { visibility } : {}
    return prisma.list.findMany({
      where,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    })
  }

  async findManyPublic() {
    return this.findMany(LIST_VISIBILITY.PUBLIC)
  }

  async findOne(id: string) {
    return prisma.list.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async findBySlug(slug: string) {
    return prisma.list.findFirst({
      where: { slug, visibility: LIST_VISIBILITY.PUBLIC },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async create(data: CreateListData) {
    const id = generateId()
    const list = await prisma.list.create({
      data: {
        id,
        title: data.title,
        slug: data.slug,
        visibility: data.visibility ?? LIST_VISIBILITY.PUBLIC,
      },
      include: { items: true },
    })
    return list
  }

  async update(id: string, data: UpdateListData) {
    return prisma.list.update({
      where: { id },
      data: {
        ...(data.title != null && { title: data.title }),
        ...(data.slug != null && { slug: data.slug }),
        ...(data.visibility != null && { visibility: data.visibility }),
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })
  }

  async delete(id: string) {
    return prisma.list.delete({
      where: { id },
    })
  }

  async addItem(listId: string, data: CreateListItemData) {
    const maxOrder = await prisma.listItem.aggregate({
      where: { listId },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1
    return prisma.listItem.create({
      data: {
        id: generateId(),
        listId,
        text: data.text,
        sortOrder,
      },
    })
  }

  async updateItem(listId: string, itemId: string, data: { text?: string; checked?: boolean }) {
    return prisma.listItem.updateMany({
      where: { id: itemId, listId },
      data: {
        ...(data.text != null && { text: data.text }),
        ...(data.checked != null && { checked: data.checked }),
      },
    })
  }

  async deleteItem(listId: string, itemId: string) {
    return prisma.listItem.deleteMany({
      where: { id: itemId, listId },
    })
  }

  async reorderItems(listId: string, itemIds: string[]) {
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.listItem.updateMany({
          where: { id, listId },
          data: { sortOrder: index },
        })
      )
    )
    return this.findOne(listId)
  }
}

export const listsService = new ListsService()
