'use client'

import { useState, useCallback, useMemo, ReactNode, Fragment } from 'react'
import { ImageBrokenIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { IMAGE_CARD_WIDTH, LEXICAL_NODE_TYPE } from '@/shared/constants'
import { Lightbox } from '@/components/ui/lightbox'
import { collectMediaIds } from '@/lib/lexical-renderer'
import { useMediaUrls } from '@/hooks/use-media-url'

interface PostContentProps {
  lexicalJson: string | null
  className?: string
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

export default function PostContent({ lexicalJson, className = '' }: PostContentProps) {
  const [lightbox, setLightbox] = useState<{
    images: { src: string; alt?: string }[]
    index: number
  } | null>(null)

  const handleImageClick = useCallback((images: { src: string; alt?: string }[], index: number) => {
    setLightbox({ images, index })
  }, [])

  const mediaIds = useMemo(() => collectMediaIds(lexicalJson ?? ''), [lexicalJson])
  const urlMap = useMediaUrls(mediaIds)

  if (!lexicalJson) return <div className={className} />

  try {
    const parsed = JSON.parse(lexicalJson)
    const root = parsed?.root
    if (!root?.children) return <div className={className} />

    const renderNode = (node: LexJson): ReactNode => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE) {
        const mid = node.mediaId != null ? String(node.mediaId) : ''
        const src = (mid && urlMap[mid]) || String(node.src ?? '')
        const cardWidthClass =
          node.cardWidth === IMAGE_CARD_WIDTH.FULL
            ? 'w-full'
            : node.cardWidth === IMAGE_CARD_WIDTH.WIDE
              ? 'max-w-4xl mx-auto'
              : 'max-w-2xl mx-auto'
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
          const mid = img.mediaId != null ? String(img.mediaId) : ''
          return {
            src: (mid && urlMap[mid]) || String(img.src ?? ''),
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
          const childIsBlock =
            t === LEXICAL_NODE_TYPE.IMAGE ||
            t === LEXICAL_NODE_TYPE.GALLERY ||
            t === LEXICAL_NODE_TYPE.YOUTUBE ||
            isBlock(t)
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
      if (node.type === LEXICAL_NODE_TYPE.LINK) {
        const lc = Array.isArray(node.children) ? node.children : []
        const children = lc.map((c) => renderNode(c as LexJson))
        return (
          <a
            key={lexicalReactKey(node)}
            href={String(node.url ?? '#')}
            target={String(node.target ?? '_blank')}
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
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
