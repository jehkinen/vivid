import type { Prisma } from '@prisma/client'
import { getPrisma } from '@/lib/prisma'
import { extractPostReferenceTargetIdsForSource } from '@/lib/editor/lexical/extract-post-references'
import { POST_STATUS } from '@/shared/constants'
import type { PostGraphDto, PostReferenceItem, PostReferencesBundle, PostPreviewMeta } from '@/types/post-references'

type PrismaTx = Prisma.TransactionClient

function toReferenceItem(post: {
  id: string
  title: string | null
  slug: string
  publishedAt: Date | null
  deletedAt: Date | null
  status: string
}): PostReferenceItem {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    publishedAt: post.publishedAt,
    deletedAt: post.deletedAt,
    status: post.status,
  }
}

export class PostReferencesService {
  async syncFromLexical(
    sourcePostId: string,
    lexical: string | null,
    tx?: PrismaTx
  ): Promise<void> {
    const client = tx?.postReference ? tx : getPrisma()
    const targetIds = extractPostReferenceTargetIdsForSource(sourcePostId, lexical)

    if (targetIds.length === 0) {
      await client.postReference.deleteMany({ where: { sourcePostId } })
      return
    }

    const existingPosts = await client.post.findMany({
      where: { id: { in: targetIds }, deletedAt: null },
      select: { id: true },
    })
    const validTargetIds = existingPosts.map((p) => p.id)

    await client.postReference.deleteMany({
      where: {
        sourcePostId,
        targetPostId: { notIn: validTargetIds },
      },
    })

    if (validTargetIds.length > 0) {
      await client.postReference.createMany({
        data: validTargetIds.map((targetPostId) => ({ sourcePostId, targetPostId })),
        skipDuplicates: true,
      })
    }
  }

  async findIncoming(sourcePostId: string): Promise<PostReferenceItem[]> {
    const refs = await getPrisma().postReference.findMany({
      where: { targetPostId: sourcePostId },
      include: {
        sourcePost: {
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            deletedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return refs.map((r) => toReferenceItem(r.sourcePost))
  }

  async findOutgoing(sourcePostId: string): Promise<PostReferenceItem[]> {
    const refs = await getPrisma().postReference.findMany({
      where: { sourcePostId },
      include: {
        targetPost: {
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            deletedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return refs.map((r) => toReferenceItem(r.targetPost))
  }

  async findForPost(postId: string): Promise<PostReferencesBundle> {
    const [incoming, outgoing] = await Promise.all([
      this.findIncoming(postId),
      this.findOutgoing(postId),
    ])
    return { incoming, outgoing }
  }

  async findSlugMapByIds(ids: string[]): Promise<Record<string, string>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (uniqueIds.length === 0) return {}
    const posts = await getPrisma().post.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, slug: true },
    })
    return Object.fromEntries(posts.map((p) => [p.id, p.slug]))
  }

  async findPreviewMapByIds(ids: string[]): Promise<Record<string, PostPreviewMeta>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (uniqueIds.length === 0) return {}
    const posts = await getPrisma().post.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        plaintext: true,
        publishedAt: true,
        wordCount: true,
      },
    })
    return Object.fromEntries(posts.map((p) => [p.id, p]))
  }

  async getSubgraph(opts: { postId?: string; depth?: 1 | 2 }): Promise<PostGraphDto> {
    const depth = opts.depth ?? 1
    const publishedWhere = {
      deletedAt: null,
      status: POST_STATUS.PUBLISHED,
    }

    if (!opts.postId) {
      const edges = await getPrisma().postReference.findMany({
        where: {
          sourcePost: publishedWhere,
          targetPost: publishedWhere,
        },
        select: { sourcePostId: true, targetPostId: true },
      })
      const nodeIds = new Set<string>()
      for (const e of edges) {
        nodeIds.add(e.sourcePostId)
        nodeIds.add(e.targetPostId)
      }
      const posts = await getPrisma().post.findMany({
        where: { id: { in: [...nodeIds] }, ...publishedWhere },
        select: { id: true, title: true, slug: true, publishedAt: true },
      })
      return {
        nodes: posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          publishedAt: p.publishedAt,
        })),
        edges: edges.map((e) => ({ source: e.sourcePostId, target: e.targetPostId })),
      }
    }

    const centerId = opts.postId
    const edgeSet = new Map<string, { source: string; target: string }>()
    let frontier = new Set([centerId])
    const visited = new Set<string>([centerId])

    for (let d = 0; d < depth; d++) {
      if (frontier.size === 0) break
      const ids = [...frontier]
      frontier = new Set()

      const refs = await getPrisma().postReference.findMany({
        where: {
          OR: [{ sourcePostId: { in: ids } }, { targetPostId: { in: ids } }],
          sourcePost: publishedWhere,
          targetPost: publishedWhere,
        },
        select: { sourcePostId: true, targetPostId: true },
      })

      for (const ref of refs) {
        const key = `${ref.sourcePostId}:${ref.targetPostId}`
        edgeSet.set(key, { source: ref.sourcePostId, target: ref.targetPostId })
        for (const id of [ref.sourcePostId, ref.targetPostId]) {
          if (!visited.has(id)) {
            visited.add(id)
            frontier.add(id)
          }
        }
      }
    }

    const posts = await getPrisma().post.findMany({
      where: { id: { in: [...visited] }, ...publishedWhere },
      select: { id: true, title: true, slug: true, publishedAt: true },
    })

    return {
      nodes: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
      })),
      edges: [...edgeSet.values()],
    }
  }
}

export const postReferencesService = new PostReferencesService()
