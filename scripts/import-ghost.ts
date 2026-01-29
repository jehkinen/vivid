import initSqlJs, { Database } from 'sql.js'
import { readFileSync, existsSync, statSync, readdirSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { postsService } from '../services/posts.service'
import { tagsService } from '../services/tags.service'
import { mediaService } from '../services/media.service'
import { POST_STATUS, POST_VISIBILITY } from '../shared/constants'
import { slugify, countWords } from '../lib/utils'
import { extractPlaintextFromLexical } from '../lib/lexical-utils'
import { generateId } from '../shared/id'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface GhostPost {
  id: string
  uuid: string
  title: string | null
  slug: string
  mobiledoc: string | null
  lexical: string | null
  html: string | null
  plaintext: string | null
  feature_image: string | null
  type: string
  status: string
  visibility: string
  created_at: string
  updated_at: string | null
  published_at: string | null
}

interface GhostTag {
  id: string
  name: string
  slug: string
  description: string | null
  feature_image: string | null
  visibility: string
  created_at: string
  updated_at: string | null
}

function mobiledocToLexical(mobiledocJson: string | null, ghostContentPath?: string): string | null {
  if (!mobiledocJson) return null

  try {
    const doc = JSON.parse(mobiledocJson)
    const sections = doc.sections || []
    const atoms = doc.atoms || []
    const cards = doc.cards || []
    const lexical: any = {
      root: {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }

    function resolveMarker(markerIndex: number): any {
      if (markerIndex < 0 || markerIndex >= atoms.length) return null
      return atoms[markerIndex]
    }

    function resolveCard(cardIndex: number): any {
      if (cardIndex < 0 || cardIndex >= cards.length) return null
      return cards[cardIndex]
    }

    for (const section of sections) {
      if (section[0] === 1) {
        const tag = section[1]
        const markers = section[2] || []
        const children: any[] = []

        for (const marker of markers) {
          if (marker[0] === 0) {
            const text = marker[3] || ''
            const formats = marker[1] || []
            let format = 0
            if (formats.includes('b') || formats.includes('strong')) format |= 1
            if (formats.includes('i') || formats.includes('em')) format |= 2
            if (formats.includes('code')) format |= 4

            if (text.trim()) {
              children.push({
                detail: 0,
                format,
                mode: 'normal',
                style: '',
                text,
                type: 'text',
                version: 1,
              })
            }
          } else if (marker[0] === 1) {
            const atom = resolveMarker(marker[1])
            if (atom && atom[0] === 'soft-break') {
              children.push({
                type: 'linebreak',
                version: 1,
              })
            }
          }
        }

        if (children.length > 0) {
          const nodeType = tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6'
            ? 'heading'
            : tag === 'blockquote'
              ? 'quote'
              : 'paragraph'

          lexical.root.children.push({
            children,
            direction: 'ltr',
            format: '',
            indent: 0,
            type: nodeType,
            ...(nodeType === 'heading' && { tag }),
            version: 1,
          })
        }
      } else if (section[0] === 10) {
        const cardIndex = section[1]
        const card = resolveCard(cardIndex)
        if (!card) continue

        const cardName = card[0]
        const payload = card[1] || {}

        if (cardName === 'image' && payload.src) {
          lexical.root.children.push({
            children: [],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'image',
            src: payload.src,
            alt: payload.alt || '',
            version: 1,
          })
        } else if (cardName === 'gallery' && Array.isArray(payload.images)) {
          lexical.root.children.push({
            children: [],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'gallery',
            images: payload.images.map((img: any) => ({
              src: img.src || '',
              alt: img.alt || '',
            })),
            version: 1,
          })
        } else if (cardName === 'html' && payload.html) {
          const htmlLexical = htmlToLexical(payload.html, ghostContentPath)
          if (htmlLexical) {
            try {
              const parsed = JSON.parse(htmlLexical)
              if (parsed.root?.children) {
                lexical.root.children.push(...parsed.root.children)
              }
            } catch {}
          }
        }
      }
    }

    return JSON.stringify(lexical)
  } catch (error) {
    console.error('Error converting Mobiledoc to Lexical:', error)
    return null
  }
}

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

function normalizeLexicalNodeTypes(lexicalJson: string): string {
  try {
    const parsed = JSON.parse(lexicalJson) as any
    function walk(node: any): void {
      if (!node || typeof node !== 'object') return
      if (node.type === 'extended-text') node.type = 'text'
      if (node.type === 'extended-heading') node.type = 'heading'
      if (node.type === 'markdown') {
        node.type = 'paragraph'
        const value = node.value ?? node.text ?? ''
        if (typeof value === 'string' && value.trim()) {
          node.children = [{
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: value,
            type: 'text',
            version: 1,
          }]
        } else if (!Array.isArray(node.children) || node.children.length === 0) {
          node.children = []
        }
        delete node.value
        delete node.text
      }
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
    walk(parsed)
    return JSON.stringify(parsed)
  } catch {
    return lexicalJson
  }
}

function htmlToLexical(html: string | null, ghostContentPath?: string): string | null {
  if (!html) return null

  const lexical: any = {
    root: {
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }

  function checkImageExists(src: string): boolean {
    if (!ghostContentPath) return true
    
    const normalizedUrl = src.replace(/^__GHOST_URL__/, '').replace(/^https?:\/\/[^\/]+/, '')
    let filePath: string | null = null
    
    if (normalizedUrl.startsWith('/content/images/')) {
      const relativePath = normalizedUrl.substring('/content/images/'.length)
      filePath = join(ghostContentPath, 'images', relativePath)
    } else if (normalizedUrl.includes('/content/images/')) {
      const relativePath = normalizedUrl.split('/content/images/')[1]
      filePath = join(ghostContentPath, 'images', relativePath)
    } else if (normalizedUrl.startsWith('/images/')) {
      const relativePath = normalizedUrl.substring('/images/'.length)
      filePath = join(ghostContentPath, 'images', relativePath)
    }
    
    if (filePath && existsSync(filePath)) {
      return true
    }
    
    if (normalizedUrl.includes('wordpress')) {
      const fileName = basename(normalizedUrl)
      const storyLocPath = join(__dirname, '../../story.loc/wp-content/uploads')
      if (existsSync(storyLocPath)) {
        const foundPath = findFileRecursive(storyLocPath, fileName)
        if (foundPath) return true
      }
    }
    
    const fileName = basename(normalizedUrl)
    const imagesDir = join(ghostContentPath, 'images')
    if (existsSync(imagesDir)) {
      const foundPath = findFileRecursive(imagesDir, fileName)
      if (foundPath) return true
    }
    
    return false
  }

  function parseHtml(htmlStr: string): any[] {
    const result: any[] = []
    let i = 0
    
    while (i < htmlStr.length) {
      if (htmlStr[i] === '<') {
        const tagEnd = htmlStr.indexOf('>', i)
        if (tagEnd === -1) break
        
        const tagContent = htmlStr.substring(i + 1, tagEnd)
        const isClosing = tagContent.startsWith('/')
        const tagName = (isClosing ? tagContent.substring(1) : tagContent).split(/\s/)[0].toLowerCase()
        
        if (tagName === 'p' && !isClosing) {
          const pEnd = htmlStr.indexOf('</p>', tagEnd)
          if (pEnd !== -1) {
            const pContent = htmlStr.substring(tagEnd + 1, pEnd)
            const children = parseInlineHtml(pContent)
            if (children.length > 0) {
              result.push({
                children,
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              })
            }
            i = pEnd + 4
            continue
          }
        } else if (tagName === 'br' || tagName === 'br/') {
          result.push({
            type: 'linebreak',
            version: 1,
          })
        } else if (tagName === 'img' && !isClosing) {
          const srcMatch = tagContent.match(/src=["']([^"']+)["']/)
          const altMatch = tagContent.match(/alt=["']([^"']*)["']/)
          if (srcMatch && checkImageExists(srcMatch[1])) {
            console.log(`✅ Image node created (file found): ${basename(srcMatch[1])}`)
            result.push({
              children: [],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'image',
              src: srcMatch[1],
              alt: altMatch ? altMatch[1] : '',
              version: 1,
            })
          }
        } else if (tagName === 'a' && !isClosing) {
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
                target: null,
                title: null,
                url: hrefMatch[1],
                version: 1,
              })
            }
            i = aEnd + 4
            continue
          }
        }
        
        i = tagEnd + 1
      } else {
        const nextTag = htmlStr.indexOf('<', i)
        const text = nextTag === -1 ? htmlStr.substring(i) : htmlStr.substring(i, nextTag)
        if (text.trim()) {
          const children = parseInlineHtml(text)
          if (children.length > 0) {
            result.push({
              children,
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            })
          }
        }
        i = nextTag === -1 ? htmlStr.length : nextTag
      }
    }
    
    return result
  }

  function parseInlineHtml(htmlStr: string): any[] {
    const result: any[] = []
    let i = 0
    
    while (i < htmlStr.length) {
      if (htmlStr[i] === '<') {
        const tagEnd = htmlStr.indexOf('>', i)
        if (tagEnd === -1) break
        
        const tagContent = htmlStr.substring(i + 1, tagEnd)
        const isClosing = tagContent.startsWith('/')
        const tagName = (isClosing ? tagContent.substring(1) : tagContent).split(/\s/)[0].toLowerCase()
        
        if (tagName === 'br' || tagName === 'br/') {
          result.push({
            type: 'linebreak',
            version: 1,
          })
        } else if (tagName === 'span' && !isClosing) {
          const styleMatch = tagContent.match(/style=["']([^"']+)["']/)
          const spanEnd = htmlStr.indexOf('</span>', tagEnd)
          if (spanEnd !== -1) {
            const spanContent = htmlStr.substring(tagEnd + 1, spanEnd)
            const colorMatch = styleMatch?.[1]?.match(/color:\s*([^;]+)/)
            const style = colorMatch ? `color: ${colorMatch[1].trim()}` : ''
            
            const textNodes = parseInlineHtml(spanContent)
            for (const node of textNodes) {
              if (node.type === 'text' && style) {
                node.style = style
              }
              result.push(node)
            }
            i = spanEnd + 7
            continue
          }
        } else if (tagName === 'strong' || tagName === 'b') {
          const strongEnd = htmlStr.indexOf(`</${tagName}>`, tagEnd)
          if (strongEnd !== -1) {
            const strongContent = htmlStr.substring(tagEnd + 1, strongEnd)
            const textNodes = parseInlineHtml(strongContent)
            for (const node of textNodes) {
              if (node.type === 'text') {
                node.format = (node.format || 0) | 1
              }
              result.push(node)
            }
            i = strongEnd + tagName.length + 3
            continue
          }
        } else if (tagName === 'em' || tagName === 'i') {
          const emEnd = htmlStr.indexOf(`</${tagName}>`, tagEnd)
          if (emEnd !== -1) {
            const emContent = htmlStr.substring(tagEnd + 1, emEnd)
            const textNodes = parseInlineHtml(emContent)
            for (const node of textNodes) {
              if (node.type === 'text') {
                node.format = (node.format || 0) | 2
              }
              result.push(node)
            }
            i = emEnd + tagName.length + 3
            continue
          }
        }
        
        i = tagEnd + 1
      } else {
        const nextTag = htmlStr.indexOf('<', i)
        let text = nextTag === -1 ? htmlStr.substring(i) : htmlStr.substring(i, nextTag)
        text = decodeHtmlEntities(text)
        if (text.trim()) {
          result.push({
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            type: 'text',
            version: 1,
          })
        }
        i = nextTag === -1 ? htmlStr.length : nextTag
      }
    }
    
    return result
  }

  const parsed = parseHtml(html)
  lexical.root.children = parsed

  return JSON.stringify(lexical)
}

async function importTag(ghostTag: GhostTag, existingTagsMap: Map<string, string>): Promise<{ id: string; isNew: boolean }> {
  const name = ghostTag.name || 'Untitled'
  const slug = ghostTag.slug || slugify(name)

  const existingId = existingTagsMap.get(slug)
  if (existingId) return { id: existingId, isNew: false }

  const tag = await tagsService.create({
    name,
    slug,
    color: undefined,
  })

  return { id: tag.id, isNew: true }
}

function normalizeGhostImageUrl(url: string): string {
  let s = url.replace(/^__GHOST_URL__/, '').replace(/^https?:\/\/[^\/]+/, '')
  const q = s.indexOf('?')
  if (q !== -1) s = s.slice(0, q)
  return s
}

async function downloadAndUploadMedia(
  ghostUrl: string,
  ghostContentPath: string,
  mediableType: string,
  mediableId: string
): Promise<string | null> {
  if (!ghostUrl) return null

  const normalizedUrl = normalizeGhostImageUrl(ghostUrl)
  let filePath: string | null = null

  if (normalizedUrl.startsWith('/content/images/')) {
    filePath = join(ghostContentPath, 'images', normalizedUrl.substring('/content/images/'.length))
  } else if (normalizedUrl.startsWith('content/images/')) {
    filePath = join(ghostContentPath, 'images', normalizedUrl.substring('content/images/'.length))
  } else if (normalizedUrl.startsWith('/content/media/')) {
    filePath = join(ghostContentPath, 'media', normalizedUrl.substring('/content/media/'.length))
  } else if (normalizedUrl.includes('/content/images/')) {
    filePath = join(ghostContentPath, 'images', normalizedUrl.split('/content/images/')[1])
  } else if (normalizedUrl.startsWith('/images/')) {
    filePath = join(ghostContentPath, 'images', normalizedUrl.substring('/images/'.length))
  } else if (normalizedUrl.startsWith('images/')) {
    filePath = join(ghostContentPath, 'images', normalizedUrl.substring('images/'.length))
  }

  if (!filePath || !existsSync(filePath)) {
    const fileName = basename(normalizedUrl)
    const imagesDir = join(ghostContentPath, 'images')
    if (existsSync(imagesDir)) {
      const found = findFileRecursive(imagesDir, fileName) || findFileRecursive(imagesDir, fileName.toLowerCase())
      if (found) filePath = found
    }
    if ((!filePath || !existsSync(filePath)) && normalizedUrl.includes('wordpress')) {
      const wpDir = join(__dirname, '../../story.loc/wp-content/uploads')
      if (existsSync(wpDir)) {
        const found = findFileRecursive(wpDir, fileName)
        if (found) filePath = found
      }
    }
  }

  if (!filePath || !existsSync(filePath)) {
    console.warn(`⚠️  Media file not found: ${normalizedUrl}`)
    return null
  }

  try {
    const stats = statSync(filePath)
    const fileBuffer = readFileSync(filePath)
    const ext = extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
    }
    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    const results = await mediaService.upload(
      mediableType,
      mediableId,
      [{
        buffer: fileBuffer,
        filename: basename(filePath),
        mimeType,
        size: stats.size,
      }],
      { collection: 'default' }
    )

    return results[0]?.id || null
  } catch (error: any) {
    console.error(`❌ Error uploading media ${ghostUrl}:`, error.message)
    return null
  }
}

function findFileRecursive(dir: string, fileName: string, maxDepth: number = 5, currentDepth: number = 0): string | null {
  if (currentDepth >= maxDepth) return null
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      
      if (entry.isFile() && entry.name === fileName) {
        return fullPath
      }
      
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, fileName, maxDepth, currentDepth + 1)
        if (found) return found
      }
    }
  } catch (error) {
    return null
  }
  
  return null
}

function extractImageUrlsFromLexical(lexicalJson: string | null): string[] {
  if (!lexicalJson) return []
  try {
    const parsed = JSON.parse(lexicalJson)
    const urls: string[] = []
    const walk = (node: any) => {
      if (node.type === 'image' && node.src) urls.push(node.src)
      if (node.images) node.images.forEach((img: any) => img.src && urls.push(img.src))
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
    if (parsed?.root?.children) parsed.root.children.forEach(walk)
    return urls
  } catch {
    return []
  }
}

function extractImageUrlsFromHtml(html: string | null): string[] {
  if (!html) return []
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
  return Array.from(matches, m => m[1]).filter(url => 
    url.startsWith('/content/') || url.includes('/content/')
  )
}

function rewriteLexicalWithMediaIds(lexicalJson: string, urlToMediaId: Map<string, string>): string {
  try {
    const parsed = JSON.parse(lexicalJson) as any
    const walk = (node: any) => {
      if (node.type === 'image' && node.src) {
        const key = normalizeGhostImageUrl(node.src)
        const mediaId = urlToMediaId.get(key)
        if (mediaId) {
          node.mediaId = mediaId
        }
      }
      if (node.images) {
        node.images.forEach((img: any) => {
          if (img.src) {
            const key = normalizeGhostImageUrl(img.src)
            const mediaId = urlToMediaId.get(key)
            if (mediaId) img.mediaId = mediaId
          }
        })
      }
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
    if (parsed?.root?.children) parsed.root.children.forEach(walk)
    return JSON.stringify(parsed)
  } catch {
    return lexicalJson
  }
}

function getAllPostTags(db: Database): Map<string, string[]> {
  const stmt = db.prepare(`
    SELECT pt.post_id, pt.tag_id
    FROM posts_tags pt
    WHERE pt.post_id IS NOT NULL AND pt.tag_id IS NOT NULL
    ORDER BY pt.post_id, pt.sort_order ASC
  `)
  
  const postTagsMap = new Map<string, string[]>()
  while (stmt.step()) {
    const row = stmt.getAsObject() as any
    const postId = row.post_id
    const tagId = row.tag_id
    if (postId && tagId) {
      const existing = postTagsMap.get(postId) || []
      existing.push(tagId)
      postTagsMap.set(postId, existing)
    }
  }
  stmt.free()
  return postTagsMap
}

function getFeatureImageMetaByPostId(db: Database): Map<string, { caption?: string; alt?: string }> {
  try {
    const stmt = db.prepare(`
      SELECT post_id, feature_image_caption, feature_image_alt FROM posts_meta
    `)
    const map = new Map<string, { caption?: string; alt?: string }>()
    while (stmt.step()) {
      const row = stmt.getAsObject() as any
      const postId = row.post_id
      if (!postId) continue
      const meta: { caption?: string; alt?: string } = {}
      if (row.feature_image_caption != null && String(row.feature_image_caption).trim())
        meta.caption = String(row.feature_image_caption).trim()
      if (row.feature_image_alt != null && String(row.feature_image_alt).trim())
        meta.alt = String(row.feature_image_alt).trim()
      if (Object.keys(meta).length > 0) map.set(postId, meta)
    }
    stmt.free()
    return map
  } catch {
    return new Map()
  }
}

const CONCURRENCY = 15

async function cleanDatabase(): Promise<void> {
  const postMedia = await prisma.media.findMany({
    where: { mediableType: 'Post' },
    select: { id: true },
  })
  for (const m of postMedia) {
    console.log(`🗑️  Deleting media: ${m.id}`)
    await mediaService.hardDelete(m.id)
  }
  await prisma.post.deleteMany({})
  await prisma.tag.deleteMany({})
  console.log(`🗑️  Cleaned: ${postMedia.length} media, all posts, all tags`)
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let index = 0
  async function worker(): Promise<void> {
    while (true) {
      const i = index++
      if (i >= items.length) return
      await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
}

async function importPost(
  ghostPost: GhostPost,
  postTagsMap: Map<string, string[]>,
  tagMap: Map<string, string>,
  ghostContentPath: string,
  featureImageMetaMap: Map<string, { caption?: string; alt?: string }>,
  progress?: { current: number; total: number }
): Promise<void> {
  const prefix = progress ? `[${progress.current}/${progress.total}] ` : ''
  if (!ghostPost.title) {
    console.warn(`${prefix}⚠️  Post missing title, skipping`)
    return
  }

  const newSlug = slugify(ghostPost.title)
  const existing = await prisma.post.findFirst({ 
    where: { 
      slug: newSlug,
      type: 'post'
    } 
  })

  let lexical: string | null = null
  let plaintext: string | null = null

  if (ghostPost.lexical) {
    try {
      const parsed = JSON.parse(ghostPost.lexical)
      const children = parsed.root?.children
      const firstChildHtml = Array.isArray(children) && children[0]?.type === 'html' && typeof children[0].html === 'string'
      if (firstChildHtml) {
        lexical = htmlToLexical(children[0].html, ghostContentPath)
        plaintext = lexical ? extractPlaintextFromLexical(lexical) : null
      } else if (parsed.root) {
        lexical = ghostPost.lexical
        plaintext = extractPlaintextFromLexical(lexical)
      }
    } catch {}
  }

  if (!lexical) {
    if (ghostPost.mobiledoc) {
      lexical = mobiledocToLexical(ghostPost.mobiledoc, ghostContentPath)
      plaintext = extractPlaintextFromLexical(lexical)
    } else if (ghostPost.html) {
      lexical = htmlToLexical(ghostPost.html, ghostContentPath)
      plaintext = extractPlaintextFromLexical(lexical) || ghostPost.plaintext || null
    } else if (ghostPost.plaintext) {
      plaintext = ghostPost.plaintext
    }
  }

  if (lexical) {
    lexical = normalizeLexicalNodeTypes(lexical)
  }

  const status = ghostPost.status === 'published' ? POST_STATUS.PUBLISHED : POST_STATUS.DRAFT
  const visibility = ghostPost.visibility === 'public' ? POST_VISIBILITY.PUBLIC : POST_VISIBILITY.PRIVATE
  const publishedAt = ghostPost.published_at ? new Date(ghostPost.published_at) : null

  const postTagIds = postTagsMap.get(ghostPost.id) || []
  const tagIds: string[] = []
  for (const tagId of postTagIds) {
    if (tagMap.has(tagId)) {
      const mappedTagId = tagMap.get(tagId)
      if (mappedTagId) {
        tagIds.push(mappedTagId)
      }
    }
  }

  let post
  if (existing) {
    const lockResult = await prisma.$transaction(async (tx) => {
      const rows = (await tx.$queryRaw(
        Prisma.sql`SELECT 1 FROM vivid_react.posts WHERE id = ${existing.id} FOR UPDATE SKIP LOCKED`
      )) as unknown[]
      if (rows.length === 0) return { locked: false, mediaIds: [] as string[] }
      const existingMedia = await tx.media.findMany({
        where: {
          mediableType: 'Post',
          mediableId: existing.id,
        },
      })
      return { locked: true, mediaIds: existingMedia.map((m) => m.id) }
    })

    if (!lockResult.locked) {
      console.log(`${prefix}⏭️  Skipped (post locked by another worker): "${ghostPost.title}" (slug: ${newSlug})`)
      return
    }

    for (const mediaId of lockResult.mediaIds) {
      await mediaService.hardDelete(mediaId)
    }

    console.log(`${prefix}🔄 Updating post: "${ghostPost.title}" (slug: ${newSlug})`)
    post = await postsService.update(existing.id, {
      title: ghostPost.title,
      slug: newSlug,
      lexical,
      plaintext,
      status,
      visibility,
      publishedAt: publishedAt?.toISOString() || null,
      tagIds: tagIds.length > 0 ? tagIds.filter((id): id is string => Boolean(id)) : undefined,
    })
  } else {
    post = await postsService.create({
      title: ghostPost.title,
      slug: newSlug,
      lexical,
      plaintext,
      status,
      visibility,
      publishedAt: publishedAt?.toISOString() || null,
      tagIds: tagIds.length > 0 ? tagIds.filter((id): id is string => Boolean(id)) : undefined,
    })
    console.log(`${prefix}✅ Created post: "${ghostPost.title}" (${post.id})`)
  }

  const mediaUrls: string[] = []
  if (ghostPost.feature_image) mediaUrls.push(ghostPost.feature_image)
  const seenNorm = new Set<string>()
  for (const u of extractImageUrlsFromLexical(ghostPost.lexical)) {
    const n = normalizeGhostImageUrl(u)
    if (!seenNorm.has(n)) { seenNorm.add(n); mediaUrls.push(u) }
  }
  for (const u of extractImageUrlsFromHtml(ghostPost.html)) {
    const n = normalizeGhostImageUrl(u)
    if (!seenNorm.has(n)) { seenNorm.add(n); mediaUrls.push(u) }
  }

  const urlToMediaId = new Map<string, string>()
  for (const url of mediaUrls) {
    const mediaId = await downloadAndUploadMedia(url, ghostContentPath, 'Post', post.id)
    if (mediaId) urlToMediaId.set(normalizeGhostImageUrl(url), mediaId)
  }

  let finalLexical = lexical
  if (lexical && urlToMediaId.size > 0) {
    finalLexical = rewriteLexicalWithMediaIds(lexical, urlToMediaId)
  }
  if (finalLexical !== lexical) {
    await postsService.update(post.id, { lexical: finalLexical })
  }

  let featuredMediaId: string | null = null
  if (ghostPost.feature_image) {
    featuredMediaId = urlToMediaId.get(normalizeGhostImageUrl(ghostPost.feature_image)) ?? null
  }
  if (featuredMediaId) {
    await postsService.update(post.id, { featuredMediaId })
    const meta = featureImageMetaMap.get(ghostPost.id)
    if (meta && Object.keys(meta).length > 0) {
      await prisma.media.update({
        where: { id: featuredMediaId },
        data: { meta },
      })
    }
    console.log(`${prefix}✅ Featured image set for post: "${ghostPost.title}"`)
  } else if (ghostPost.feature_image) {
    const displayPath = ghostPost.feature_image.replace(/^__GHOST_URL__/, '').replace(/^https?:\/\/[^\/]+/, '')
    console.warn(`${prefix}⚠️  Feature image not found (file missing): ${displayPath.startsWith('/') ? displayPath : '/' + displayPath}`)
  }

  if (existing) {
    console.log(`${prefix}✅ Updated post: "${ghostPost.title}" (${post.id})`)
  }
}

async function importPostById(
  ghostPostId: string,
  context: {
    ghostPosts: GhostPost[]
    postTagsMap: Map<string, string[]>
    tagMap: Map<string, string>
    ghostContentPath: string
    featureImageMetaMap: Map<string, { caption?: string; alt?: string }>
  },
  progress?: { current: number; total: number }
): Promise<void> {
  const ghostPost = context.ghostPosts.find((p) => p.id === ghostPostId)
  if (!ghostPost) {
    console.warn(`⚠️  Post not found: ${ghostPostId}`)
    return
  }
  await importPost(
    ghostPost,
    context.postTagsMap,
    context.tagMap,
    context.ghostContentPath,
    context.featureImageMetaMap,
    progress
  )
}

async function main() {
  const ghostContentPath = join(__dirname, '../../andy.book/content')
  const ghostDbPath = process.env.GHOST_DB_PATH || join(ghostContentPath, 'data/ghost-local.db')

  if (!existsSync(ghostDbPath)) {
    console.error(`❌ Ghost database not found: ${ghostDbPath}`)
    console.error(`   Set GHOST_DB_PATH or place ghost-local.db in ${ghostContentPath}/data/`)
    process.exit(1)
  }

  if (!existsSync(ghostContentPath)) {
    console.error(`❌ Ghost content directory not found: ${ghostContentPath}`)
    process.exit(1)
  }

  const cleanFirst = process.env.GHOST_IMPORT_CLEAN === 'true' || process.env.GHOST_IMPORT_CLEAN === '1'
  if (cleanFirst) {
    await cleanDatabase()
  }

  const imagesDir = join(ghostContentPath, 'images')
  console.log(`📖 Reading Ghost database from: ${ghostDbPath}`)
  console.log(`📁 Media (images) from: ${imagesDir}`)

  const SQL = await initSqlJs()
  const dbBuffer = readFileSync(ghostDbPath)
  const db = new SQL.Database(dbBuffer)

  const postsStmt = db.prepare(`
    SELECT id, uuid, title, slug, mobiledoc, lexical, html, plaintext, feature_image, 
           type, status, visibility, created_at, updated_at, published_at
    FROM posts
    WHERE type = 'post'
    ORDER BY created_at ASC
  `)
  
  const ghostPosts: GhostPost[] = []
  while (postsStmt.step()) {
    const row = postsStmt.getAsObject() as any
    ghostPosts.push({
      id: row.id || '',
      uuid: row.uuid || '',
      title: row.title,
      slug: row.slug || '',
      mobiledoc: row.mobiledoc,
      lexical: row.lexical,
      html: row.html,
      plaintext: row.plaintext,
      feature_image: row.feature_image,
      type: row.type || 'post',
      status: row.status || 'draft',
      visibility: row.visibility || 'public',
      created_at: row.created_at || '',
      updated_at: row.updated_at,
      published_at: row.published_at,
    })
  }
  postsStmt.free()

  const tagsStmt = db.prepare(`
    SELECT id, name, slug, description, feature_image, visibility, created_at, updated_at
    FROM tags
    ORDER BY name ASC
  `)
  
  const ghostTags: GhostTag[] = []
  while (tagsStmt.step()) {
    const row = tagsStmt.getAsObject() as any
    ghostTags.push({
      id: row.id || '',
      name: row.name || '',
      slug: row.slug || '',
      description: row.description,
      feature_image: row.feature_image,
      visibility: row.visibility || 'public',
      created_at: row.created_at || '',
      updated_at: row.updated_at,
    })
  }
  tagsStmt.free()

  const postTagsMap = getAllPostTags(db)
  const featureImageMetaMap = getFeatureImageMetaByPostId(db)

  const allPostTagIds = new Set<string>()
  for (const tagIds of postTagsMap.values()) {
    for (const tagId of tagIds) {
      allPostTagIds.add(tagId)
    }
  }

  db.close()

  console.log(`📊 Found ${ghostPosts.length} posts, ${ghostTags.length} tags`)
  console.log(`📋 Found ${allPostTagIds.size} unique tags used in posts`)

  const tagsToImport = ghostTags.filter(tag => 
    tag.id && tag.name && allPostTagIds.has(tag.id)
  )

  const tagSlugsToCheck = tagsToImport.map(tag => tag.slug || slugify(tag.name || 'Untitled'))
  
  const existingTags = await prisma.tag.findMany({
    where: {
      slug: { in: tagSlugsToCheck }
    },
    select: {
      id: true,
      slug: true,
    }
  })

  const existingTagsMap = new Map<string, string>()
  for (const tag of existingTags) {
    existingTagsMap.set(tag.slug, tag.id)
  }

  const tagMap = new Map<string, string>()
  console.log(`\n📦 Importing ${tagsToImport.length} tags (${existingTags.length} already exist)...`)
  for (const ghostTag of tagsToImport) {
    const result = await importTag(ghostTag, existingTagsMap)
    tagMap.set(ghostTag.id, result.id)
    if (result.isNew) {
      console.log(`✅ Imported tag: "${ghostTag.name}"`)
    } else {
      console.log(`⏭️  Tag "${ghostTag.name}" already exists, skipping`)
    }
  }

  const postsToImport = ghostPosts.filter((p) => p.id)
  const totalCount = postsToImport.length
  console.log(`\n📝 Importing ${totalCount} posts (${CONCURRENCY} concurrent)...`)

  const context = {
    ghostPosts,
    postTagsMap,
    tagMap,
    ghostContentPath,
    featureImageMetaMap,
  }

  await runWithConcurrency(postsToImport, CONCURRENCY, async (ghostPost, i) => {
    const currentOneBased = i + 1
    try {
      await importPostById(ghostPost.id, context, {
        current: currentOneBased,
        total: totalCount,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[${currentOneBased}/${totalCount}] ❌ Failed: "${ghostPost.title ?? '(untitled)'}" (${ghostPost.id}): ${msg}`)
    }
  })

  console.log(`\n✨ Import complete! ${totalCount} posts processed.`)
}

export async function runImportForPostId(ghostPostId: string): Promise<void> {
  const ghostContentPath = join(__dirname, '../../andy.book/content')
  const ghostDbPath = process.env.GHOST_DB_PATH || join(ghostContentPath, 'data/ghost-local.db')

  if (!existsSync(ghostDbPath)) {
    throw new Error(`Ghost database not found: ${ghostDbPath}`)
  }
  if (!existsSync(ghostContentPath)) {
    throw new Error(`Ghost content directory not found: ${ghostContentPath}`)
  }

  const SQL = await initSqlJs()
  const dbBuffer = readFileSync(ghostDbPath)
  const db = new SQL.Database(dbBuffer)

  const postsStmt = db.prepare(`
    SELECT id, uuid, title, slug, mobiledoc, lexical, html, plaintext, feature_image,
           type, status, visibility, created_at, updated_at, published_at
    FROM posts WHERE type = 'post' ORDER BY created_at ASC
  `)
  const ghostPosts: GhostPost[] = []
  while (postsStmt.step()) {
    const row = postsStmt.getAsObject() as any
    ghostPosts.push({
      id: row.id || '',
      uuid: row.uuid || '',
      title: row.title,
      slug: row.slug || '',
      mobiledoc: row.mobiledoc,
      lexical: row.lexical,
      html: row.html,
      plaintext: row.plaintext,
      feature_image: row.feature_image,
      type: row.type || 'post',
      status: row.status || 'draft',
      visibility: row.visibility || 'public',
      created_at: row.created_at || '',
      updated_at: row.updated_at,
      published_at: row.published_at,
    })
  }
  postsStmt.free()

  const tagsStmt = db.prepare(`
    SELECT id, name, slug, description, feature_image, visibility, created_at, updated_at
    FROM tags ORDER BY name ASC
  `)
  const ghostTags: GhostTag[] = []
  while (tagsStmt.step()) {
    const row = tagsStmt.getAsObject() as any
    ghostTags.push({
      id: row.id || '',
      name: row.name || '',
      slug: row.slug || '',
      description: row.description,
      feature_image: row.feature_image,
      visibility: row.visibility || 'public',
      created_at: row.created_at || '',
      updated_at: row.updated_at,
    })
  }
  tagsStmt.free()

  const postTagsMap = getAllPostTags(db)
  const featureImageMetaMap = getFeatureImageMetaByPostId(db)
  db.close()

  const allPostTagIds = new Set<string>()
  for (const tagIds of postTagsMap.values()) {
    for (const tagId of tagIds) {
      allPostTagIds.add(tagId)
    }
  }

  const tagsToImport = ghostTags.filter((tag) => tag.id && tag.name && allPostTagIds.has(tag.id))
  const tagSlugsToCheck = tagsToImport.map((tag) => tag.slug || slugify(tag.name || 'Untitled'))
  const existingTags = await prisma.tag.findMany({
    where: { slug: { in: tagSlugsToCheck } },
    select: { id: true, slug: true },
  })
  const existingTagsMap = new Map<string, string>()
  for (const tag of existingTags) {
    existingTagsMap.set(tag.slug, tag.id)
  }

  const tagMap = new Map<string, string>()
  for (const ghostTag of tagsToImport) {
    const result = await importTag(ghostTag, existingTagsMap)
    tagMap.set(ghostTag.id, result.id)
  }

  const context = {
    ghostPosts,
    postTagsMap,
    tagMap,
    ghostContentPath,
    featureImageMetaMap,
  }

  await importPostById(ghostPostId, context)
}

const isMainModule = process.argv[1]?.endsWith('import-ghost.ts')
if (isMainModule) {
  main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e)
      prisma.$disconnect()
      process.exit(1)
    })
}

