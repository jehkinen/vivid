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

function renderText(node: any): ReactNode {
  let text: ReactNode = node.text || ''
  const fmt = node.format || 0
  if (fmt & 1) text = <strong>{text}</strong>
  if (fmt & 2) text = <em>{text}</em>
  if (fmt & 4) text = <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{text}</code>
  if (node.style && typeof node.style === 'string') {
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

    const renderNode = (node: any): ReactNode => {
      if (node.type === LEXICAL_NODE_TYPE.IMAGE) {
        const src = urlMap[node.mediaId] ?? node.src
        const cardWidthClass =
          node.cardWidth === IMAGE_CARD_WIDTH.FULL
            ? 'w-full'
            : node.cardWidth === IMAGE_CARD_WIDTH.WIDE
              ? 'max-w-4xl mx-auto'
              : 'max-w-2xl mx-auto'
        return (
          <figure
            key={node.key || Math.random()}
            className={`my-6 ${cardWidthClass}`}
          >
            <button
              type="button"
              onClick={() => handleImageClick([{ src, alt: node.alt }], 0)}
              className="block w-full text-left"
            >
              <ImgWithFallback
                src={src}
                alt={node.alt || ''}
                width={node.width}
                height={node.height}
                className="rounded-lg cursor-zoom-in w-full h-auto"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </button>
            {node.title && (
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                {node.title}
              </figcaption>
            )}
          </figure>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.GALLERY) {
        const imagesResolved = (node.images || []).map((img: any) => ({
          src: urlMap[img.mediaId] ?? img.src,
          alt: img.alt,
        }))
        return (
          <figure key={node.key || Math.random()} className="my-6">
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
      if (node.type === LEXICAL_NODE_TYPE.TEXT || node.type === LEXICAL_NODE_TYPE.EXTENDED_TEXT) {
        return <span key={node.key || Math.random()}>{renderText(node)}</span>
      }
      if (node.type === LEXICAL_NODE_TYPE.LINEBREAK) {
        return <br key={node.key || Math.random()} />
      }
      const blockTypes = [
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
        const key = node.key || Math.random()
        const alignClass =
          node.format === 'center'
            ? 'text-center'
            : node.format === 'right'
              ? 'text-right'
              : node.format === 'justify'
                ? 'text-justify'
                : ''
        const pClassName = alignClass ? `mb-4 ${alignClass}` : 'mb-4'
        for (const c of node.children || []) {
          const r = renderNode(c)
          const childIsBlock =
            c?.type === LEXICAL_NODE_TYPE.IMAGE ||
            c?.type === LEXICAL_NODE_TYPE.GALLERY ||
            isBlock(c?.type)
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
        const Tag = (node.tag || 'h1') as 'h1' | 'h2' | 'h3' | 'h4'
        const children = (node.children || []).map((c: any) => renderNode(c))
        return <Tag key={node.key || Math.random()} className="font-bold mb-4">{children}</Tag>
      }
      if (node.type === LEXICAL_NODE_TYPE.LIST) {
        const Tag = node.listType === 'number' ? 'ol' : 'ul'
        const children = (node.children || []).map((c: any) => renderNode(c))
        return <Tag key={node.key || Math.random()} className="my-4 ml-6">{children}</Tag>
      }
      if (node.type === LEXICAL_NODE_TYPE.LISTITEM) {
        const children = (node.children || []).map((c: any) => renderNode(c))
        return <li key={node.key || Math.random()} className="mb-2">{children}</li>
      }
      if (node.type === LEXICAL_NODE_TYPE.QUOTE) {
        const children = (node.children || []).map((c: any) => renderNode(c))
        return (
          <blockquote
            key={node.key || Math.random()}
            className="border-l-4 border-border pl-4 italic my-4"
          >
            {children}
          </blockquote>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.CODE) {
        return (
          <pre
            key={node.key || Math.random()}
            className="bg-muted p-4 rounded overflow-x-auto my-4"
          >
            <code>{node.code || ''}</code>
          </pre>
        )
      }
      if (node.type === LEXICAL_NODE_TYPE.LINK) {
        const children = (node.children || []).map((c: any) => renderNode(c))
        return (
          <a
            key={node.key || Math.random()}
            href={node.url}
            target={node.target || '_blank'}
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        )
      }
      if (node.children && Array.isArray(node.children)) {
        return node.children.map((c: any) => renderNode(c))
      }
      return null
    }

    const nodes = root.children.map((node: any) => renderNode(node))

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
