import { LEXICAL_NODE_TYPE, POST_LINK_FIELD } from '@/shared/constants'
import { walkLexicalTree } from '@/lib/editor/lexical/walk-tree'
import { getPostIdFromLexicalLinkNode } from '@/lib/editor/post-link-helpers'

export function extractPostReferenceTargetIds(lexicalJson: string | null): string[] {
  const ids = new Set<string>()

  walkLexicalTree(lexicalJson, {
    onNode(node) {
      const type = String(node.type ?? '')
      if (type === LEXICAL_NODE_TYPE.LINK || type === LEXICAL_NODE_TYPE.AUTOLINK) {
        const postId = getPostIdFromLexicalLinkNode(node)
        if (postId) ids.add(postId)
        return
      }
      if (type === LEXICAL_NODE_TYPE.POST_CARD && node.postId) {
        ids.add(String(node.postId))
        return 'skip-children'
      }
    },
  })

  return [...ids]
}

export function extractPostReferenceTargetIdsForSource(
  sourcePostId: string,
  lexicalJson: string | null
): string[] {
  return extractPostReferenceTargetIds(lexicalJson).filter((id) => id !== sourcePostId)
}
