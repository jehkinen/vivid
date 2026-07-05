import type { LexicalNode } from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { POST_LINK_FIELD, POST_LINK_REL_PREFIX } from '@/shared/constants'

export function getPostIdFromLinkRel(rel: unknown): string | undefined {
  if (typeof rel !== 'string' || !rel.startsWith(POST_LINK_REL_PREFIX)) return undefined
  const id = rel.slice(POST_LINK_REL_PREFIX.length)
  return id.length > 0 ? id : undefined
}

export function buildPostLinkRel(postId: string): string {
  return `${POST_LINK_REL_PREFIX}${postId}`
}

export function getPostIdFromLinkNode(node: LexicalNode | null | undefined): string | undefined {
  if (!node || !$isLinkNode(node)) return undefined
  const fromRel = getPostIdFromLinkRel(node.getRel())
  if (fromRel) return fromRel
  const json = node.exportJSON() as Record<string, unknown>
  const postId = json[POST_LINK_FIELD]
  return postId != null && String(postId).length > 0 ? String(postId) : undefined
}

export function getPostIdFromLexicalLinkNode(node: Record<string, unknown>): string | undefined {
  const fromRel = getPostIdFromLinkRel(node.rel)
  if (fromRel) return fromRel
  const postId = node[POST_LINK_FIELD]
  return postId != null && String(postId).length > 0 ? String(postId) : undefined
}
