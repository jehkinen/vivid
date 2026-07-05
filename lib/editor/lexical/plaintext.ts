import { LEXICAL_NODE_TYPE } from '@/shared/constants'
import { walkLexicalTree, type LexicalJsonNode } from '@/lib/editor/lexical/walk-tree'

const MEDIA_BLOCK_TYPES = new Set<string>([
  LEXICAL_NODE_TYPE.IMAGE,
  LEXICAL_NODE_TYPE.GALLERY,
  LEXICAL_NODE_TYPE.AUDIO,
  LEXICAL_NODE_TYPE.YOUTUBE,
])

function extractTextFromNode(node: LexicalJsonNode): string {
  const type = String(node.type ?? '')
  if (MEDIA_BLOCK_TYPES.has(type)) return ''
  if (type === LEXICAL_NODE_TYPE.TEXT || type === LEXICAL_NODE_TYPE.EXTENDED_TEXT) {
    return String(node.text ?? '')
  }
  if (Array.isArray(node.children)) {
    return node.children.map((c) => extractTextFromNode(c as LexicalJsonNode)).join('')
  }
  return ''
}

export function extractPlaintextFromLexical(lexicalJson: string | null): string | null {
  const blocks: string[] = []

  walkLexicalTree(lexicalJson, {
    onNode(node, { depth }) {
      if (depth !== 0) return
      const text = extractTextFromNode(node).trim()
      if (text) blocks.push(text)
    },
  })

  const text = blocks.join('\n\n').trim()
  return text || null
}
