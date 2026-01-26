import { IMAGE_CARD_WIDTH, LEXICAL_NODE_TYPE } from '@/shared/constants'

export type RenderLexicalToHtmlOptions = {
  resolveUrl?: (mediaId: string) => string
}

export function renderLexicalToHtml(
  lexicalJson: string | null,
  options?: RenderLexicalToHtmlOptions
): string {
  if (!lexicalJson) return ''
  const resolveUrl = options?.resolveUrl

  try {
    const parsed = JSON.parse(lexicalJson)
    const root = parsed?.root
    if (!root?.children) return ''

    const renderNode = (node: any): string => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE) {
        const src = (node.mediaId && resolveUrl) ? resolveUrl(node.mediaId) : node.src
        const cardWidthClass =
          node.cardWidth === IMAGE_CARD_WIDTH.FULL
            ? 'w-full'
            : node.cardWidth === IMAGE_CARD_WIDTH.WIDE
              ? 'max-w-4xl mx-auto'
              : 'max-w-2xl mx-auto'
        return `<figure class="my-6 ${cardWidthClass}"><img src="${src}" alt="${node.alt || ''}" ${node.width ? `width="${node.width}"` : ''} ${node.height ? `height="${node.height}"` : ''} class="rounded-lg" style="max-width: 100%; height: auto;" />${node.title ? `<figcaption class="text-sm text-muted-foreground mt-2 text-center">${node.title}</figcaption>` : ''}</figure>`
      }
      if (node.type === LEXICAL_NODE_TYPE.GALLERY) {
        const images = (node.images || []).map((img: any) => {
          const src = (img.mediaId && resolveUrl) ? resolveUrl(img.mediaId) : img.src
          return `<div class="relative aspect-square overflow-hidden rounded-lg"><img src="${src}" alt="${img.alt || ''}" class="w-full h-full object-cover" /></div>`
        }).join('')
        return `<figure class="my-6"><div class="kg-gallery-container grid grid-cols-2 md:grid-cols-3 gap-2">${images}</div></figure>`
      }
      if (node.type === LEXICAL_NODE_TYPE.TEXT) {
        let text = node.text || ''
        if (node.format) {
          if (node.format & 1) text = `<strong>${text}</strong>`
          if (node.format & 2) text = `<em>${text}</em>`
          if (node.format & 4) text = `<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${text}</code>`
        }
        return text
      }
      if (node.type === LEXICAL_NODE_TYPE.PARAGRAPH) {
        const children = (node.children || []).map(renderNode).join('')
        return `<p class="mb-4">${children}</p>`
      }
      if (node.type === LEXICAL_NODE_TYPE.HEADING) {
        const level = node.tag || 'h1'
        const children = (node.children || []).map(renderNode).join('')
        return `<${level} class="font-bold mb-4">${children}</${level}>`
      }
      if (node.type === LEXICAL_NODE_TYPE.LIST) {
        const tag = node.listType === 'number' ? 'ol' : 'ul'
        const children = (node.children || []).map(renderNode).join('')
        return `<${tag} class="my-4 ml-6">${children}</${tag}>`
      }
      if (node.type === LEXICAL_NODE_TYPE.LISTITEM) {
        const children = (node.children || []).map(renderNode).join('')
        return `<li class="mb-2">${children}</li>`
      }
      if (node.type === LEXICAL_NODE_TYPE.QUOTE) {
        const children = (node.children || []).map(renderNode).join('')
        return `<blockquote class="border-l-4 border-border pl-4 italic my-4">${children}</blockquote>`
      }
      if (node.type === LEXICAL_NODE_TYPE.CODE) {
        return `<pre class="bg-muted p-4 rounded overflow-x-auto my-4"><code>${node.code || ''}</code></pre>`
      }
      if (node.type === LEXICAL_NODE_TYPE.LINK) {
        const children = (node.children || []).map(renderNode).join('')
        return `<a href="${node.url}" target="${node.target || '_blank'}" class="text-primary hover:underline">${children}</a>`
      }
      if (node.children && Array.isArray(node.children)) {
        return node.children.map(renderNode).join('')
      }
      return ''
    }

    return root.children.map(renderNode).join('')
  } catch {
    return ''
  }
}

export function extractImageNodes(lexicalJson: string | null): Array<{ src: string; mediaId?: string }> {
  if (!lexicalJson) return []

  try {
    const parsed = JSON.parse(lexicalJson)
    const root = parsed?.root
    if (!root?.children) return []

    const images: Array<{ src: string; mediaId?: string }> = []

    const extractImages = (node: any) => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE) {
        images.push({
          src: node.src,
          mediaId: node.mediaId,
        })
      } else if (node.type === LEXICAL_NODE_TYPE.GALLERY && node.images) {
        node.images.forEach((img: any) => {
          images.push({
            src: img.src,
            mediaId: img.mediaId,
          })
        })
      } else if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractImages)
      }
    }

    root.children.forEach(extractImages)
    return images
  } catch {
    return []
  }
}

export function collectMediaIds(lexicalJson: string | null): string[] {
  return extractImageNodes(lexicalJson ?? '')
    .map((i) => i.mediaId)
    .filter((x): x is string => !!x)
}