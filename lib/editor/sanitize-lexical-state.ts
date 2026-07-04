const ROOT_ELEMENT_TYPES = new Set([
  'paragraph',
  'heading',
  'quote',
  'list',
  'code',
  'image',
  'gallery',
  'audio',
])

const NODE_TYPE_ALIASES: Record<string, string> = {
  'extended-text': 'text',
  'extended-heading': 'heading',
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
    if (type === 'text' || (type && !ROOT_ELEMENT_TYPES.has(type))) {
      return {
        type: 'paragraph',
        children: type === 'text' ? [sanitized] : [],
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
