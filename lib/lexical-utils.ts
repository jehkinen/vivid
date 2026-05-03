import { LEXICAL_NODE_TYPE } from '@/shared/constants'

type LexicalJson = Record<string, unknown>

export function extractPlaintextFromLexical(lexicalJson: string | null): string | null {
  if (!lexicalJson) return null

  try {
    const parsed = JSON.parse(lexicalJson) as { root?: { children?: unknown[] } }
    const root = parsed?.root
    if (!root?.children) return null

    const extractText = (node: LexicalJson): string => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE || node.type === LEXICAL_NODE_TYPE.GALLERY || node.type === LEXICAL_NODE_TYPE.AUDIO || node.type === LEXICAL_NODE_TYPE.YOUTUBE) {
        return ''
      }
      if (node.type === LEXICAL_NODE_TYPE.TEXT || node.type === LEXICAL_NODE_TYPE.EXTENDED_TEXT) {
        return String(node.text ?? '')
      }
      if (node.children && Array.isArray(node.children)) {
        return (node.children as unknown[]).map((c) => extractText(c as LexicalJson)).join('')
      }
      return ''
    }

    const text = root.children.map((c) => extractText(c as LexicalJson)).join('\n\n').trim()
    return text || null
  } catch {
    return null
  }
}
