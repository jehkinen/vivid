import { readFileSync, existsSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { basename, extname } from 'path'
import { prisma } from '../lib/prisma'
import { postsService } from '../services/posts.service'
import { mediaService } from '../services/media.service'
import { POST_STATUS } from '../shared/constants'
import { ALLOWED_IMAGE_MIME_TYPES } from '../shared/constants'

const __dirname = dirname(fileURLToPath(import.meta.url))

const HTML_PATH = join(__dirname, 'rgp-journal-single.html')
const IMAGES_DIR = join(__dirname, 'rgp-journal-images')
const MIN_IMAGE_SIZE_BYTES = 100 * 1024
const POST_TITLE = 'Дневник — импорт'
const POST_SLUG = 'rgp-journal-import'

type BlockNode =
  | { type: 'paragraph'; children: unknown[]; format?: 'left' | 'center' | 'right' }
  | { type: 'heading'; tag: string; children: unknown[] }
  | { type: 'image'; _path: string }

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, '\u00A0')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function applyStyleToTextNodes(nodes: unknown[], style: string): void {
  for (const node of nodes) {
    if (typeof node === 'object' && node !== null && 'type' in node && (node as any).type === 'text') {
      const existing = (node as any).style || ''
      ;(node as any).style = existing ? `${existing}; ${style}` : style
    }
    if (typeof node === 'object' && node !== null && 'children' in node && Array.isArray((node as any).children)) {
      applyStyleToTextNodes((node as any).children, style)
    }
  }
}

function parseInlineHtml(htmlStr: string): unknown[] {
  const result: unknown[] = []
  let i = 0
  while (i < htmlStr.length) {
    if (htmlStr[i] === '<') {
      const tagEnd = htmlStr.indexOf('>', i)
      if (tagEnd === -1) break
      const tagContent = htmlStr.substring(i + 1, tagEnd)
      const isClosing = tagContent.startsWith('/')
      const tagName = (isClosing ? tagContent.substring(1) : tagContent).split(/\s/)[0].toLowerCase()
      if (tagName === 'br' || tagName === 'br/') {
        result.push({ type: 'linebreak', version: 1 })
        i = tagEnd + 1
        continue
      }
      if (tagName === 'strong' || tagName === 'b') {
        const endTag = `</${tagName}>`
        const end = htmlStr.indexOf(endTag, tagEnd)
        if (end !== -1) {
          const inner = htmlStr.substring(tagEnd + 1, end)
          const textNodes = parseInlineHtml(inner)
          for (const node of textNodes) {
            if (typeof node === 'object' && node !== null && 'type' in node && (node as any).type === 'text') {
              (node as any).format = ((node as any).format || 0) | 1
            }
            result.push(node)
          }
          i = end + endTag.length
          continue
        }
      }
      if (tagName === 'em' || tagName === 'i') {
        const endTag = `</${tagName}>`
        const end = htmlStr.indexOf(endTag, tagEnd)
        if (end !== -1) {
          const inner = htmlStr.substring(tagEnd + 1, end)
          const textNodes = parseInlineHtml(inner)
          for (const node of textNodes) {
            if (typeof node === 'object' && node !== null && 'type' in node && (node as any).type === 'text') {
              (node as any).format = ((node as any).format || 0) | 2
            }
            result.push(node)
          }
          i = end + endTag.length
          continue
        }
      }
      if (tagName === 'u') {
        const end = htmlStr.indexOf('</u>', tagEnd)
        if (end !== -1) {
          const inner = htmlStr.substring(tagEnd + 1, end)
          const textNodes = parseInlineHtml(inner)
          applyStyleToTextNodes(textNodes, 'text-decoration: underline')
          result.push(...textNodes)
          i = end + 4
          continue
        }
      }
      if (tagName === 'a' && !isClosing) {
        const hrefMatch = tagContent.match(/href=["']([^"']+)["']/)
        const aEnd = htmlStr.indexOf('</a>', tagEnd)
        if (aEnd !== -1 && hrefMatch) {
          const aContent = htmlStr.substring(tagEnd + 1, aEnd)
          const children = parseInlineHtml(aContent)
          if (children.length > 0) {
            result.push({
              children,
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'link',
              rel: null,
              target: '_blank',
              title: null,
              url: hrefMatch[1],
              version: 1,
            })
          }
          i = aEnd + 4
          continue
        }
      }
      if (tagName === 'font' && !isClosing) {
        const colorMatch = tagContent.match(/color=["']([^"']+)["']/i)
        const end = htmlStr.indexOf('</font>', tagEnd)
        if (end !== -1) {
          const inner = htmlStr.substring(tagEnd + 1, end)
          const textNodes = parseInlineHtml(inner)
          if (colorMatch) {
            applyStyleToTextNodes(textNodes, `color: ${colorMatch[1].trim()}`)
          }
          result.push(...textNodes)
          i = end + 7
          continue
        }
      }
      if (tagName === 'span' && !isClosing) {
        const styleMatch = tagContent.match(/style=["']([^"']*)["']/i)
        const endTag = '</span>'
        const end = htmlStr.indexOf(endTag, tagEnd)
        if (end !== -1) {
          const inner = htmlStr.substring(tagEnd + 1, end)
          const textNodes = parseInlineHtml(inner)
          if (styleMatch && styleMatch[1].trim()) {
            applyStyleToTextNodes(textNodes, styleMatch[1].trim())
          }
          result.push(...textNodes)
          i = end + endTag.length
          continue
        }
      }
      i = tagEnd + 1
    } else {
      const nextTag = htmlStr.indexOf('<', i)
      const text = nextTag === -1 ? htmlStr.substring(i) : htmlStr.substring(i, nextTag)
      const decoded = decodeHtmlEntities(text)
      if (decoded.trim()) {
        result.push({
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: decoded,
          type: 'text',
          version: 1,
        })
      }
      i = nextTag === -1 ? htmlStr.length : nextTag
    }
  }
  return result
}

function parseSegmentToInlines(segment: string): unknown[] {
  const inlines: unknown[] = []
  let pos = 0
  while (pos < segment.length) {
    const nextP = segment.indexOf('<p', pos)
    const nextBr = segment.match(/<br\s*\/?>/i)
    const nextBrIndex = nextBr ? segment.indexOf(nextBr[0], pos) : -1
    let next = segment.length
    let kind: 'p' | 'br' | null = null
    if (nextP !== -1 && nextP < next) {
      next = nextP
      kind = 'p'
    }
    if (nextBrIndex !== -1 && nextBrIndex < next) {
      next = nextBrIndex
      kind = 'br'
    }
    const chunk = segment.substring(pos, next).trim()
    if (chunk) {
      inlines.push(...parseInlineHtml(chunk))
    }
    if (kind === 'br') {
      inlines.push({ type: 'linebreak', version: 1 })
      const brLen = nextBr ? nextBr[0].length : 5
      pos = next + brLen
    } else if (kind === 'p') {
      const openEnd = segment.indexOf('>', next) + 1
      const pEnd = segment.indexOf('</p>', openEnd)
      if (pEnd !== -1) {
        const inner = segment.substring(openEnd, pEnd)
        inlines.push(...parseInlineHtml(inner))
        pos = pEnd + 4
      } else {
        pos = openEnd
      }
    } else {
      break
    }
  }
  return inlines
}

function parseBodyToBlocks(bodyHtml: string, align?: 'left' | 'center' | 'right'): BlockNode[] {
  const blocks: BlockNode[] = []
  let i = 0
  const pushParagraph = (children: unknown[]) => {
    if (children.length > 0) {
      blocks.push({ type: 'paragraph', children, format: align })
    }
  }
  while (i < bodyHtml.length) {
    const nextImg = bodyHtml.indexOf('<img', i)
    const nextDiv = bodyHtml.indexOf('<div', i)
    let nextBlock = bodyHtml.length
    let blockType: 'img' | 'div' | null = null
    if (nextImg !== -1 && nextImg < nextBlock) {
      nextBlock = nextImg
      blockType = 'img'
    }
    if (nextDiv !== -1 && nextDiv < nextBlock) {
      nextBlock = nextDiv
      blockType = 'div'
    }
    const segment = bodyHtml.substring(i, nextBlock).trim()
    if (segment) {
      const inlines = parseSegmentToInlines(segment)
      if (inlines.length > 0) pushParagraph(inlines)
    }
    if (blockType === 'img') {
      const srcMatch = bodyHtml.substring(nextBlock).match(/src=["']([^"']+)["']/)
      if (srcMatch) {
        const src = srcMatch[1]
        if (src.includes('rgp-journal-images/')) {
          const path = src.startsWith('rgp-journal-images/') ? src : src.replace(/^.*?rgp-journal-images\//, 'rgp-journal-images/')
          blocks.push({ type: 'image', _path: path })
        }
      }
      const close = bodyHtml.indexOf('>', nextBlock)
      i = close === -1 ? nextBlock + 4 : close + 1
    } else if (blockType === 'div') {
      const divStart = bodyHtml.substring(nextBlock)
      const alignMatch = divStart.match(/align=["'](center|left|right)["']/i)
      const divAlign = alignMatch ? (alignMatch[1].toLowerCase() as 'left' | 'center' | 'right') : align
      let depth = 1
      let pos = bodyHtml.indexOf('>', nextBlock) + 1
      while (pos < bodyHtml.length && depth > 0) {
        const nextOpen = bodyHtml.indexOf('<div', pos)
        const nextClose = bodyHtml.indexOf('</div>', pos)
        if (nextClose === -1) break
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++
          pos = nextOpen + 4
        } else {
          depth--
          if (depth === 0) {
            const inner = bodyHtml.substring(bodyHtml.indexOf('>', nextBlock) + 1, nextClose)
            const innerBlocks = parseBodyToBlocks(inner, divAlign)
            blocks.push(...innerBlocks)
            i = nextClose + 6
            break
          }
          pos = nextClose + 6
        }
      }
      if (depth !== 0) i = nextBlock + 4
    } else {
      break
    }
  }
  return blocks
}

function extractBodyFromFragment(frag: string): string {
  const startMatch = frag.match(/<div[^>]*class="rgp-post-body"[^>]*>/i)
  if (!startMatch) return ''
  const openStart = startMatch.index!
  const openEnd = frag.indexOf('>', openStart) + 1
  let depth = 1
  let i = openEnd
  while (i < frag.length && depth > 0) {
    const nextOpen = frag.indexOf('<div', i)
    const nextClose = frag.indexOf('</div>', i)
    if (nextClose === -1) break
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++
      i = nextOpen + 4
    } else {
      depth--
      if (depth === 0) return frag.substring(openEnd, nextClose)
      i = nextClose + 6
    }
  }
  return ''
}

function extractArticles(html: string): { title: string; time: string; body: string }[] {
  const articles: { title: string; time: string; body: string }[] = []
  const articleRe = /<article[^>]*>([\s\S]*?)<\/article>/gi
  let m: RegExpExecArray | null
  while ((m = articleRe.exec(html)) !== null) {
    const frag = m[1]
    const h2Match = frag.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const timeMatch = frag.match(/<time[^>]*>([\s\S]*?)<\/time>/i)
    const title = h2Match ? decodeHtmlEntities(h2Match[1].replace(/<[^>]+>/g, '').trim()) : 'Запись'
    const time = timeMatch ? decodeHtmlEntities(timeMatch[1].replace(/<[^>]+>/g, ' ').trim()) : ''
    const body = extractBodyFromFragment(frag)
    articles.push({ title, time, body })
  }
  return articles
}

function blockToLexicalNode(block: BlockNode, pathToMediaId: Map<string, string>): unknown | null {
  if (block.type === 'paragraph') {
    return {
      children: block.children,
      direction: 'ltr',
      format: block.format || 'left',
      indent: 0,
      type: 'paragraph',
      version: 1,
    }
  }
  if (block.type === 'heading') {
    return {
      children: block.children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'heading',
      tag: block.tag,
      version: 1,
    }
  }
  if (block.type === 'image') {
    const mediaId = pathToMediaId.get(block._path)
    if (!mediaId) return null
    return {
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'image',
      src: '',
      alt: '',
      mediaId,
      version: 1,
    }
  }
  return null
}

function buildLexicalRoot(blocks: BlockNode[], pathToMediaId: Map<string, string>): string {
  const children = blocks
    .map((b) => blockToLexicalNode(b, pathToMediaId))
    .filter((n): n is object => n !== null)
  return JSON.stringify({
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  })
}

async function main(): Promise<void> {
  if (!existsSync(HTML_PATH)) {
    throw new Error(`HTML file not found: ${HTML_PATH}`)
  }
  const existing = await postsService.findOne({ slug: POST_SLUG, includeDeleted: true })
  if (existing) {
    await postsService.hardDelete(existing.id)
    console.log(`Deleted existing post: ${existing.id} (${POST_SLUG})`)
  }
  const html = readFileSync(HTML_PATH, { encoding: 'utf-8' })
  const articles = extractArticles(html)
  const blocks: BlockNode[] = []
  for (const art of articles) {
    blocks.push({
      type: 'heading',
      tag: 'h2',
      children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: art.title, type: 'text', version: 1 }],
    })
    if (art.time) {
      blocks.push({
        type: 'paragraph',
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: art.time, type: 'text', version: 1 }],
      })
    }
    blocks.push(...parseBodyToBlocks(art.body))
  }

  const textOnlyLexical = buildLexicalRoot(blocks, new Map())
  const post = await postsService.create({
    title: POST_TITLE,
    slug: POST_SLUG,
    lexical: textOnlyLexical,
    status: POST_STATUS.DRAFT,
  })
  console.log(`Created post: ${post.id} (${POST_SLUG})`)

  const imagePaths = [...new Set(blocks.filter((b): b is BlockNode & { type: 'image' } => b.type === 'image').map((b) => b._path))]
  const pathToMediaId = new Map<string, string>()
  const mimeByExt: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }

  for (const relPath of imagePaths) {
    const fullPath = join(__dirname, relPath)
    if (!existsSync(fullPath)) continue
    const stat = statSync(fullPath)
    if (stat.size < MIN_IMAGE_SIZE_BYTES) continue
    const ext = extname(fullPath).toLowerCase()
    const mimeType = mimeByExt[ext] || 'image/jpeg'
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as any)) continue
    try {
      const buffer = readFileSync(fullPath)
      const results = await mediaService.upload(
        'Post',
        post.id,
        [{ buffer, filename: basename(fullPath), mimeType, size: stat.size }],
        { collection: 'default' }
      )
      const mediaId = results[0]?.id
      if (mediaId) {
        pathToMediaId.set(relPath, mediaId)
        console.log(`Uploaded ${relPath} (${(stat.size / 1024).toFixed(1)} KB)`)
      }
    } catch (err) {
      console.warn(`Skip upload ${relPath}:`, err instanceof Error ? err.message : err)
    }
  }

  const fullLexical = buildLexicalRoot(blocks, pathToMediaId)
  await postsService.update(post.id, { lexical: fullLexical })
  console.log(`Updated post with ${pathToMediaId.size} images (skipped ${imagePaths.length - pathToMediaId.size} < ${MIN_IMAGE_SIZE_BYTES / 1024} KB)`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
