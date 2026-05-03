import { IMAGE_CARD_WIDTH, LEXICAL_NODE_TYPE } from '@/shared/constants'

type LexicalJson = Record<string, unknown>

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

    const renderNode = (node: LexicalJson): string => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE) {
        const src =
          node.mediaId && resolveUrl ? resolveUrl(String(node.mediaId)) : String(node.src ?? '')
        const cardWidthClass =
          node.cardWidth === IMAGE_CARD_WIDTH.FULL
            ? 'w-full'
            : node.cardWidth === IMAGE_CARD_WIDTH.WIDE
              ? 'max-w-4xl mx-auto'
              : 'max-w-2xl mx-auto'
        return `<figure class="my-6 ${cardWidthClass}"><img src="${src}" alt="${String(node.alt ?? '')}" ${node.width ? `width="${node.width}"` : ''} ${node.height ? `height="${node.height}"` : ''} class="rounded-lg" style="max-width: 100%; height: auto;" />${node.title ? `<figcaption class="text-sm text-muted-foreground mt-2 text-center">${node.title}</figcaption>` : ''}</figure>`
      }
      if (node.type === LEXICAL_NODE_TYPE.GALLERY) {
        const galleryImages = Array.isArray(node.images) ? node.images : []
        const images = galleryImages.map((raw) => {
          const img = raw as LexicalJson
          const src =
            img.mediaId && resolveUrl ? resolveUrl(String(img.mediaId)) : String(img.src ?? '')
          return `<div class="relative aspect-square overflow-hidden rounded-lg"><img src="${src}" alt="${String(img.alt ?? '')}" class="w-full h-full object-cover" /></div>`
        }).join('')
        return `<figure class="my-6"><div class="kg-gallery-container grid grid-cols-2 md:grid-cols-3 gap-2">${images}</div></figure>`
      }
      if (node.type === LEXICAL_NODE_TYPE.AUDIO) {
        const src =
          node.mediaId && resolveUrl ? resolveUrl(String(node.mediaId)) : String(node.src ?? '')
        const title = node.title
          ? `<figcaption class="text-sm text-muted-foreground mt-2 text-center">${node.title}</figcaption>`
          : ''
        return `<figure class="my-6"><div class="rounded-lg border border-border bg-muted p-4"><audio controls class="w-full max-w-full" preload="metadata"><source src="${src}" /></audio></div>${title}</figure>`
      }
      if (node.type === LEXICAL_NODE_TYPE.YOUTUBE && node.videoId) {
        const embedSrc = `https://www.youtube.com/embed/${encodeURIComponent(String(node.videoId))}`
        return `<figure class="my-6"><div class="relative aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden border border-border bg-muted"><iframe src="${embedSrc}" title="YouTube video" class="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></figure>`
      }
      if (node.type === LEXICAL_NODE_TYPE.TEXT) {
        let text = String(node.text ?? '')
        const fmt = typeof node.format === 'number' ? node.format : 0
        if (fmt) {
          if (fmt & 1) text = `<strong>${text}</strong>`
          if (fmt & 2) text = `<em>${text}</em>`
          if (fmt & 4) text = `<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${text}</code>`
        }
        return text
      }
      if (node.type === LEXICAL_NODE_TYPE.PARAGRAPH) {
        const ch = Array.isArray(node.children) ? node.children : []
        const children = ch.map((c) => renderNode(c as LexicalJson)).join('')
        const alignClass =
          node.format === 'center' ? ' text-center' : node.format === 'right' ? ' text-right' : node.format === 'justify' ? ' text-justify' : ''
        return `<p class="mb-4${alignClass}">${children}</p>`
      }
      if (node.type === LEXICAL_NODE_TYPE.HEADING) {
        const level = String(node.tag ?? 'h1')
        const ch = Array.isArray(node.children) ? node.children : []
        const children = ch.map((c) => renderNode(c as LexicalJson)).join('')
        return `<${level} class="font-bold mb-4">${children}</${level}>`
      }
      if (node.type === LEXICAL_NODE_TYPE.LIST) {
        const tag = node.listType === 'number' ? 'ol' : 'ul'
        const ch = Array.isArray(node.children) ? node.children : []
        const children = ch.map((c) => renderNode(c as LexicalJson)).join('')
        return `<${tag} class="my-4 ml-6">${children}</${tag}>`
      }
      if (node.type === LEXICAL_NODE_TYPE.LISTITEM) {
        const ch = Array.isArray(node.children) ? node.children : []
        const children = ch.map((c) => renderNode(c as LexicalJson)).join('')
        return `<li class="mb-2">${children}</li>`
      }
      if (node.type === LEXICAL_NODE_TYPE.QUOTE) {
        const ch = Array.isArray(node.children) ? node.children : []
        const children = ch.map((c) => renderNode(c as LexicalJson)).join('')
        return `<blockquote class="border-l-4 border-border pl-4 italic my-4">${children}</blockquote>`
      }
      if (node.type === LEXICAL_NODE_TYPE.CODE) {
        return `<pre class="bg-muted p-4 rounded overflow-x-auto my-4"><code>${String(node.code ?? '')}</code></pre>`
      }
      if (node.type === LEXICAL_NODE_TYPE.LINK) {
        const ch = Array.isArray(node.children) ? node.children : []
        const children = ch.map((c) => renderNode(c as LexicalJson)).join('')
        return `<a href="${String(node.url ?? '')}" target="${String(node.target ?? '_blank')}" class="text-primary hover:underline">${children}</a>`
      }
      if (node.children && Array.isArray(node.children)) {
        return (node.children as unknown[]).map((c) => renderNode(c as LexicalJson)).join('')
      }
      return ''
    }

    return (root.children as unknown[]).map((c) => renderNode(c as LexicalJson)).join('')
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

    const extractImages = (node: LexicalJson) => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE) {
        images.push({
          src: String(node.src ?? ''),
          mediaId: node.mediaId as string | undefined,
        })
      } else if (node.type === LEXICAL_NODE_TYPE.AUDIO && node.mediaId) {
        images.push({ src: String(node.src ?? ''), mediaId: node.mediaId as string })
      } else if (node.type === LEXICAL_NODE_TYPE.GALLERY && node.images && Array.isArray(node.images)) {
        node.images.forEach((raw) => {
          const img = raw as LexicalJson
          images.push({
            src: String(img.src ?? ''),
            mediaId: img.mediaId as string | undefined,
          })
        })
      } else if (node.children && Array.isArray(node.children)) {
        ;(node.children as unknown[]).forEach((c) => extractImages(c as LexicalJson))
      }
    }

    ;(root.children as unknown[]).forEach((c) => extractImages(c as LexicalJson))
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