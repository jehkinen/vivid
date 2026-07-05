import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { $createLinkNode } from '@lexical/link'
import { buildPostLinkRel } from '@/lib/editor/post-link-helpers'

export interface PostLinkTarget {
  postId: string
  slug: string
  title: string | null
}

export function $insertPostLink({ postId, slug, title }: PostLinkTarget): void {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return

  const url = `/${slug}`
  const label = title?.trim() || slug
  const rel = buildPostLinkRel(postId)

  if (!selection.isCollapsed()) {
    const extracted = selection.extract()
    const linkNode = $createLinkNode(url, { rel, target: null })
    linkNode.append(...extracted)
    selection.insertNodes([linkNode])
    return
  }

  const linkNode = $createLinkNode(url, { rel, target: null })
  linkNode.append($createTextNode(label))
  selection.insertNodes([linkNode])
}
