import { prisma } from '@/lib/prisma'
import { POST_STATUS } from '@/shared/constants'

export class SearchService {
  async search(query: string) {
    const searchTerm = query.trim()

    if (!searchTerm) {
      return { posts: [], tags: [] }
    }

    const [posts, tags] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { plaintext: { contains: searchTerm, mode: 'insensitive' } },
          ],
          status: POST_STATUS.PUBLISHED,
        },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
        },
      }),
      prisma.tag.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      }),
    ])

    return { posts, tags }
  }
}

export const searchService = new SearchService()