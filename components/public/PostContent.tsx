'use client'

import { useState, useCallback, useMemo, useRef, ReactNode, Fragment } from 'react'
import Link from 'next/link'
import { ImageBrokenIcon, MusicNotesIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { LEXICAL_NODE_TYPE } from '@/shared/constants'
import { getPostIdFromLexicalLinkNode } from '@/lib/editor/post-link-helpers'
import { Lightbox } from '@/components/ui/lightbox'
import { collectMediaIds } from '@/lib/lexical-renderer'
import { useMediaUrls } from '@/hooks/use-media-url'
import { getImageCardWidthClass } from '@/lib/editor/lexical/image-layout'
import { resolveMediaSrc } from '@/lib/editor/lexical/resolve-media-src'
import { PostLinkWithPreview } from '@/components/public/PostLinkWithPreview'
import type { PostPreviewMeta } from '@/types/post-references'

interface PostContentProps {
  lexicalJson: string | null
  className?: string
  urlMap?: Record<string, string>
  postSlugMap?: Record<string, string>
  postPreviewMap?: Record<string, PostPreviewMeta>
}

type LexJson = Record<string, unknown>

function lexicalReactKey(node: LexJson): string | number {
  const k = node.key
  if (typeof k === 'string' || typeof k === 'number') return k
  return Math.random()
}

function numAttr(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function ImgWithFallback({
  src,
  alt,
  className,
  style,
  ...rest
}: { src: string; alt?: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [hasError, setHasError] = useState(false)
  if (hasError) {
    return (
      <div
        className={cn(
          'flex min-h-[100px] flex-col items-center justify-center gap-1 bg-muted text-muted-foreground',
          className
        )}
        style={style}
      >
        <ImageBrokenIcon size={32} className="shrink-0" />
        <span className="text-xs">Image unavailable</span>
      </div>
    )
  }
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      style={style}
      onError={() => setHasError(true)}
      {...rest}
    />
  )
}

function parseStyleString(str: string): React.CSSProperties {
  const out: Record<string, string> = {}
  for (const part of str.split(';')) {
    const colon = part.indexOf(':')
    if (colon <= 0) continue
    const key = part.slice(0, colon).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const value = part.slice(colon + 1).trim()
    if (key && value) out[key] = value
  }
  return out as React.CSSProperties
}

function PostLink({
  href,
  target,
  postId,
  postSlugMap,
  postPreviewMap,
  children,
}: {
  href: string
  target: string
  postId?: string
  postSlugMap?: Record<string, string>
  postPreviewMap?: Record<string, PostPreviewMeta>
  children: ReactNode
}) {
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  if (postId) {
    const slug = postSlugMap?.[postId]
    if (!slug) {
      return (
        <span className="text-muted-foreground line-through">{children}</span>
      )
    }
    return (
      <PostLinkWithPreview slug={slug} preview={postPreviewMap?.[postId]}>
        {children}
      </PostLinkWithPreview>
    )
  }

  return (
    <a
      href={href}
      target={target}
      rel="noopener noreferrer"
      className="text-primary hover:underline select-text"
      onMouseDown={(e) => {
        pointerDownRef.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={(e) => {
        const down = pointerDownRef.current
        pointerDownRef.current = null
        if (down) {
          const dx = Math.abs(e.clientX - down.x)
          const dy = Math.abs(e.clientY - down.y)
          if (dx > 4 || dy > 4) {
            e.preventDefault()
            return
          }
        }
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) {
          e.preventDefault()
        }
      }}
    >
      {children}
    </a>
  )
}

function renderText(node: LexJson): ReactNode {
  let text: ReactNode = String(node.text ?? '')
  const fmt = Number(node.format ?? 0)
  if (fmt & 1) text = <strong>{text}</strong>
  if (fmt & 2) text = <em>{text}</em>
  if (fmt & 4) text = <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{text}</code>
  if (typeof node.style === 'string') {
    const styleObj = parseStyleString(node.style)
    if (Object.keys(styleObj).length > 0) text = <span style={styleObj}>{text}</span>
  }
  return text
}

const DECORATOR_BLOCK_TYPES: readonly string[] = [
  LEXICAL_NODE_TYPE.IMAGE,
  LEXICAL_NODE_TYPE.GALLERY,
  LEXICAL_NODE_TYPE.AUDIO,
  LEXICAL_NODE_TYPE.YOUTUBE,
  LEXICAL_NODE_TYPE.POST_CARD,
]

function isDecoratorBlock(type: string): boolean {
  return DECORATOR_BLOCK_TYPES.includes(type)
}

export function PostContent({
  lexicalJson,
  className = '',
  urlMap: urlMapProp,
  postSlugMap = {},
  postPreviewMap = {},
}: PostContentProps) {
  const [lightbox, setLightbox] = useState<{
    images: { src: string; alt?: string }[]
    index: number
  } | null>(null)

  const handleImageClick = useCallback((images: { src: string; alt?: string }[], index: number) => {
    setLightbox({ images, index })
  }, [])

  const mediaIds = useMemo(() => collectMediaIds(lexicalJson ?? ''), [lexicalJson])
  const fetchedUrlMap = useMediaUrls(urlMapProp ? [] : mediaIds)
  const urlMap = urlMapProp ?? fetchedUrlMap

  const parsedRoot = useMemo(() => {
    if (!lexicalJson) return null
    try {
      const parsed = JSON.parse(lexicalJson)
      const root = parsed?.root
      if (!root?.children) return null
      return root
    } catch {
      return null
    }
  }, [lexicalJson])

  if (!lexicalJson || !parsedRoot) return <div className={className} />

  try {
    const root = parsedRoot

    const renderNode = (node: LexJson): ReactNode => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE) {
        const mid = node.mediaId != null ? String(node.mediaId) : undefined
        const src = resolveMediaSrc(mid, String(node.src ?? ''), urlMap)
        const cardWidthClass = getImageCardWidthClass(
          typeof node.cardWidth === 'string' ? node.cardWidth : null
        )
        return (
          <figure
            key={lexicalReactKey(node)}
            className={`my-6 ${cardWidthClass}`}
          >
            <button
              type="button"
              onClick={() => handleImageClick([{ src, alt: String(node.alt ?? '') }], 0)}
              className="block w-full text-left"
            >
              <ImgWithFallback
                src={src}
                alt={String(node.alt ?? '')}
                width={numAttr(node.width)}
                height={numAttr(node.height)}
                className="rounded-lg cursor-zoom-in w-full h-auto"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </button>
            {node.title != null && String(node.title).trim() !== '' && (
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                {String(node.title)}
              </figcaption>
            )}
          </figure>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.GALLERY) {
        const imgs = Array.isArray(node.images) ? node.images : []
        const imagesResolved = imgs.map((raw) => {
          const img = raw as LexJson
          const mid = img.mediaId != null ? String(img.mediaId) : undefined
          return {
            src: resolveMediaSrc(mid, String(img.src ?? ''), urlMap),
            alt: img.alt != null ? String(img.alt) : undefined,
          }
        })
        return (
          <figure key={lexicalReactKey(node)} className="my-6">
            <div className="kg-gallery-container grid grid-cols-2 md:grid-cols-3 gap-2">
              {imagesResolved.map((img: { src: string; alt?: string }, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleImageClick(imagesResolved, i)}
                  className="relative aspect-square overflow-hidden rounded-lg text-left"
                >
                  <ImgWithFallback
                    src={img.src}
                    alt={img.alt || ''}
                    className="w-full h-full object-cover cursor-zoom-in"
                  />
                </button>
              ))}
            </div>
          </figure>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.AUDIO) {
        const mid = node.mediaId != null ? String(node.mediaId) : undefined
        const src = resolveMediaSrc(mid, String(node.src ?? ''), urlMap)
        return (
          <figure key={lexicalReactKey(node)} className="my-6">
            {src ? (
              <div className="rounded-lg border border-border bg-muted p-4">
                <audio controls className="w-full max-w-full" preload="metadata">
                  <source src={src} />
                </audio>
              </div>
            ) : (
              <div className="flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted py-6 text-muted-foreground">
                <MusicNotesIcon size={32} className="shrink-0" />
                <span>Audio unavailable</span>
              </div>
            )}
            {node.title != null && String(node.title).trim() !== '' && (
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                {String(node.title)}
              </figcaption>
            )}
          </figure>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.YOUTUBE && node.videoId) {
        const embedSrc = `https://www.youtube.com/embed/${encodeURIComponent(String(node.videoId))}`
        return (
          <figure key={lexicalReactKey(node)} className="my-6">
            <div className="relative aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden border border-border bg-muted">
              <iframe
                src={embedSrc}
                title="YouTube video"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </figure>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.POST_CARD && node.postId) {
        const postId = String(node.postId)
        const slug = postSlugMap[postId] ?? (node.slug ? String(node.slug) : null)
        const title = node.title != null ? String(node.title) : 'Untitled'
        if (!slug || !postSlugMap[postId]) {
          return (
            <figure
              key={lexicalReactKey(node)}
              className="my-6 rounded-lg border border-dashed border-border bg-muted/30 p-4 max-w-xl"
            >
              <p className="text-sm text-muted-foreground">{title} (unavailable)</p>
            </figure>
          )
        }
        return (
          <Link
            key={lexicalReactKey(node)}
            href={`/${slug}`}
            className="my-6 block rounded-lg border border-border bg-card p-4 max-w-xl hover:bg-accent/40 transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Post preview
            </p>
            <p className="font-semibold text-foreground">{title}</p>
          </Link>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.TEXT || node.type === LEXICAL_NODE_TYPE.EXTENDED_TEXT) {
        return <span key={lexicalReactKey(node)}>{renderText(node)}</span>
      }
      if (node.type === LEXICAL_NODE_TYPE.LINEBREAK) {
        return <br key={lexicalReactKey(node)} />
      }
      const blockTypes: readonly string[] = [
        LEXICAL_NODE_TYPE.PARAGRAPH,
        LEXICAL_NODE_TYPE.HEADING,
        LEXICAL_NODE_TYPE.EXTENDED_HEADING,
        LEXICAL_NODE_TYPE.QUOTE,
        LEXICAL_NODE_TYPE.LIST,
        LEXICAL_NODE_TYPE.CODE,
      ]
      const isBlock = (t: string) => blockTypes.includes(t)
      if (node.type === LEXICAL_NODE_TYPE.PARAGRAPH) {
        const runs: ReactNode[] = []
        let inlines: ReactNode[] = []
        const key = lexicalReactKey(node)
        const alignClass =
          node.format === 'center'
            ? 'text-center'
            : node.format === 'right'
              ? 'text-right'
              : node.format === 'justify'
                ? 'text-justify'
                : ''
        const pClassName = alignClass ? `mb-4 ${alignClass}` : 'mb-4'
        const paragraphChildren = Array.isArray(node.children) ? node.children : []
        for (const raw of paragraphChildren) {
          const c = raw as LexJson
          const r = renderNode(c)
          const t = typeof c.type === 'string' ? c.type : ''
          const childIsBlock = isDecoratorBlock(t) || isBlock(t)
          if (childIsBlock) {
            if (inlines.length > 0) {
              runs.push(<p key={`${key}-p-${runs.length}`} className={pClassName}>{inlines}</p>)
              inlines = []
            }
            runs.push(r)
          } else {
            inlines.push(r)
          }
        }
        if (inlines.length > 0) {
          runs.push(<p key={`${key}-p-${runs.length}`} className={pClassName}>{inlines}</p>)
        }
        if (runs.length === 0) {
          return <p key={key} className={pClassName} />
        }
        return <Fragment key={key}>{runs}</Fragment>
      }
      if (node.type === LEXICAL_NODE_TYPE.HEADING || node.type === LEXICAL_NODE_TYPE.EXTENDED_HEADING) {
        const Tag = (String(node.tag || 'h1')) as 'h1' | 'h2' | 'h3' | 'h4'
        const hc = Array.isArray(node.children) ? node.children : []
        const children = hc.map((c) => renderNode(c as LexJson))
        return <Tag key={lexicalReactKey(node)} className="font-bold mb-4">{children}</Tag>
      }
      if (node.type === LEXICAL_NODE_TYPE.LIST) {
        const Tag = node.listType === 'number' ? 'ol' : 'ul'
        const lc = Array.isArray(node.children) ? node.children : []
        const children = lc.map((c) => renderNode(c as LexJson))
        return <Tag key={lexicalReactKey(node)} className="my-4 ml-6">{children}</Tag>
      }
      if (node.type === LEXICAL_NODE_TYPE.LISTITEM) {
        const lic = Array.isArray(node.children) ? node.children : []
        const children = lic.map((c) => renderNode(c as LexJson))
        return <li key={lexicalReactKey(node)} className="mb-2">{children}</li>
      }
      if (node.type === LEXICAL_NODE_TYPE.QUOTE) {
        const qc = Array.isArray(node.children) ? node.children : []
        const children = qc.map((c) => renderNode(c as LexJson))
        return (
          <blockquote
            key={lexicalReactKey(node)}
            className="border-l-4 border-border pl-4 italic my-4"
          >
            {children}
          </blockquote>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.CODE) {
        return (
          <pre
            key={lexicalReactKey(node)}
            className="bg-muted p-4 rounded overflow-x-auto my-4"
          >
            <code>{String(node.code ?? '')}</code>
          </pre>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.LINK || node.type === LEXICAL_NODE_TYPE.AUTOLINK) {
        const lc = Array.isArray(node.children) ? node.children : []
        const children = lc.map((c) => renderNode(c as LexJson))
        if (node.type === LEXICAL_NODE_TYPE.AUTOLINK && node.isUnlinked) {
          return <Fragment key={lexicalReactKey(node)}>{children}</Fragment>
        }
        return (
          <PostLink
            key={lexicalReactKey(node)}
            href={String(node.url ?? '#')}
            target={String(node.target ?? '_blank')}
            postId={getPostIdFromLexicalLinkNode(node)}
            postSlugMap={postSlugMap}
            postPreviewMap={postPreviewMap}
          >
            {children}
          </PostLink>
        )
      }
      if (node.children && Array.isArray(node.children)) {
        return (node.children as unknown[]).map((c) => renderNode(c as LexJson))
      }
      return null
    }

    const nodes = (root.children as unknown[]).map((node) => renderNode(node as LexJson))

    return (
      <div className={className}>
        {nodes}
        {lightbox && (
          <Lightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </div>
    )
  } catch {
    return <div className={className} />
  }
}
