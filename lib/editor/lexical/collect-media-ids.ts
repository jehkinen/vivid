import { LEXICAL_NODE_TYPE } from '@/shared/constants'
import { walkLexicalTree, type LexicalJsonNode } from '@/lib/editor/lexical/walk-tree'

export type MediaReference = { src: string; mediaId?: string }

export function extractMediaReferences(lexicalJson: string | null): MediaReference[] {
  const refs: MediaReference[] = []

  walkLexicalTree(lexicalJson, {
    onNode(node) {
      const type = String(node.type ?? '')
      if (type === LEXICAL_NODE_TYPE.IMAGE) {
        refs.push({
          src: String(node.src ?? ''),
          mediaId: node.mediaId != null ? String(node.mediaId) : undefined,
        })
        return 'skip-children'
      }
      if (type === LEXICAL_NODE_TYPE.AUDIO && node.mediaId) {
        refs.push({
          src: String(node.src ?? ''),
          mediaId: String(node.mediaId),
        })
        return 'skip-children'
      }
      if (type === LEXICAL_NODE_TYPE.GALLERY && Array.isArray(node.images)) {
        for (const raw of node.images) {
          const img = raw as LexicalJsonNode
          refs.push({
            src: String(img.src ?? ''),
            mediaId: img.mediaId != null ? String(img.mediaId) : undefined,
          })
        }
        return 'skip-children'
      }
    },
  })

  return refs
}

export function collectMediaIds(lexicalJson: string | null): string[] {
  return extractMediaReferences(lexicalJson)
    .map((item) => item.mediaId)
    .filter((id): id is string => !!id)
}
