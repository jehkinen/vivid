export type LexicalJsonNode = Record<string, unknown>

export type WalkLexicalVisitors = {
  onNode?: (node: LexicalJsonNode, context: { depth: number }) => void | 'skip-children'
}

export function parseLexicalJson(lexicalJson: string | null): { root?: { children?: unknown[] } } | null {
  if (!lexicalJson) return null
  try {
    return JSON.parse(lexicalJson) as { root?: { children?: unknown[] } }
  } catch {
    return null
  }
}

export function walkLexicalTree(lexicalJson: string | null, visitors: WalkLexicalVisitors): void {
  const parsed = parseLexicalJson(lexicalJson)
  const root = parsed?.root
  if (!root?.children || !Array.isArray(root.children)) return

  const visit = (node: LexicalJsonNode, depth: number) => {
    const result = visitors.onNode?.(node, { depth })
    if (result === 'skip-children') return
    const children = node.children
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child && typeof child === 'object') {
          visit(child as LexicalJsonNode, depth + 1)
        }
      }
    }
  }

  for (const child of root.children) {
    if (child && typeof child === 'object') {
      visit(child as LexicalJsonNode, 0)
    }
  }
}
