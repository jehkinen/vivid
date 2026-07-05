import { LEXICAL_NODE_TYPE } from '@/shared/constants'

const ROOT_ELEMENT_TYPES = new Set<string>([
  LEXICAL_NODE_TYPE.PARAGRAPH,
  LEXICAL_NODE_TYPE.HEADING,
  LEXICAL_NODE_TYPE.QUOTE,
  LEXICAL_NODE_TYPE.LIST,
  LEXICAL_NODE_TYPE.CODE,
  LEXICAL_NODE_TYPE.IMAGE,
  LEXICAL_NODE_TYPE.GALLERY,
  LEXICAL_NODE_TYPE.AUDIO,
  LEXICAL_NODE_TYPE.YOUTUBE,
])

const NODE_TYPE_ALIASES: Record<string, string> = {
  [LEXICAL_NODE_TYPE.EXTENDED_TEXT]: LEXICAL_NODE_TYPE.TEXT,
  [LEXICAL_NODE_TYPE.EXTENDED_HEADING]: LEXICAL_NODE_TYPE.HEADING,
}

function sanitizeNode(node: { type?: string; children?: unknown[] }): typeof node {
  if (!node || typeof node !== 'object') return node
  const type = node.type
  const normalizedType = type ? (NODE_TYPE_ALIASES[type] ?? type) : type
  const children = Array.isArray(node.children)
    ? node.children.map((c) => sanitizeNode(c as { type?: string; children?: unknown[] }))
    : node.children
  return { ...node, type: normalizedType, children }
}

export function sanitizeLexicalRoot(parsed: { root?: { children?: unknown[] } }): typeof parsed {
  const root = parsed?.root
  if (!root?.children || !Array.isArray(root.children)) return parsed
  root.children = root.children.map((child: unknown) => {
    const sanitized = sanitizeNode(child as { type?: string; children?: unknown[] })
    const type = sanitized?.type
    if (type === LEXICAL_NODE_TYPE.TEXT || (type && !ROOT_ELEMENT_TYPES.has(type))) {
      return {
        type: LEXICAL_NODE_TYPE.PARAGRAPH,
        children: type === LEXICAL_NODE_TYPE.TEXT ? [sanitized] : [],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      }
    }
    return sanitized
  })
  return parsed
}
