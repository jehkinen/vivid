import { LEXICAL_NODE_TYPE } from '@/shared/constants'

export function extractPlaintextFromLexical(lexicalJson: string | null): string | null {
  if (!lexicalJson) return null

  try {
    const parsed = JSON.parse(lexicalJson)
    const root = parsed?.root
    if (!root?.children) return null

    const extractText = (node: any): string => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE || node.type === LEXICAL_NODE_TYPE.GALLERY || node.type === LEXICAL_NODE_TYPE.AUDIO) {
        return ''
      }
      if (node.type === LEXICAL_NODE_TYPE.TEXT || node.type === LEXICAL_NODE_TYPE.EXTENDED_TEXT) {
        return node.text || ''
      }
      if (node.children && Array.isArray(node.children)) {
        return node.children.map(extractText).join('')
      }
      return ''
    }

    const text = root.children.map(extractText).join('\n\n').trim()
    return text || null
  } catch {
    return null
  }
}
