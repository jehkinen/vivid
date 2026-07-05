'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { formatPostDate, formatTime } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PostPreviewMeta } from '@/types/post-references'

const HOVER_OPEN_MS = 400
const HOVER_CLOSE_MS = 120
const EXCERPT_LENGTH = 200

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  const end = lastSpace > 0 ? lastSpace : maxLength
  return `${cut.slice(0, end).trim()}...`
}

function PostPreviewDate({ publishedAt }: { publishedAt: PostPreviewMeta['publishedAt'] }) {
  const dateStr = formatPostDate(publishedAt)
  if (!dateStr) return null
  const timeStr = publishedAt ? formatTime(String(publishedAt)) : ''

  if (!timeStr) {
    return <time>{dateStr}</time>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time className="cursor-default transition-colors hover:text-foreground">{dateStr}</time>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {timeStr}
      </TooltipContent>
    </Tooltip>
  )
}

function PostPreviewCard({ meta }: { meta: PostPreviewMeta }) {
  const excerpt = meta.plaintext ? truncateAtWord(meta.plaintext, EXCERPT_LENGTH) : ''
  const words = meta.wordCount ?? 0
  const dateStr = formatPostDate(meta.publishedAt)

  return (
    <div className="w-80 max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-4 shadow-lg pointer-events-auto">
      <div className="font-semibold text-foreground leading-snug">{meta.title || 'Untitled'}</div>
      {excerpt && (
        <div className="mt-2 text-sm text-muted-foreground line-clamp-3 font-reading">{excerpt}</div>
      )}
      <div className="mt-3 text-xs text-muted-foreground flex flex-wrap items-center gap-x-1">
        {dateStr && <PostPreviewDate publishedAt={meta.publishedAt} />}
        {dateStr && <span className="text-border select-none">•</span>}
        <span>
          {words} {words === 1 ? 'word' : 'words'}
        </span>
      </div>
    </div>
  )
}

interface PostLinkWithPreviewProps {
  slug: string
  preview?: PostPreviewMeta
  children: ReactNode
}

export function PostLinkWithPreview({ slug, preview, children }: PostLinkWithPreviewProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const anchorRef = useRef<HTMLSpanElement>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, updatePosition])

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleOpen = useCallback(() => {
    if (!preview) return
    clearTimers()
    if (open) return
    openTimerRef.current = setTimeout(() => setOpen(true), HOVER_OPEN_MS)
  }, [clearTimers, open, preview])

  const scheduleClose = useCallback(() => {
    clearTimers()
    closeTimerRef.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS)
  }, [clearTimers])

  const keepOpen = useCallback(() => {
    clearTimers()
    setOpen(true)
  }, [clearTimers])

  return (
    <>
      <span
        ref={anchorRef}
        className="inline"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={preview ? () => setOpen(true) : undefined}
        onBlur={preview ? () => setOpen(false) : undefined}
      >
        <Link
          href={`/${slug}`}
          className="text-primary underline decoration-dotted underline-offset-2 hover:opacity-80 select-text"
        >
          {children}
        </Link>
      </span>
      {mounted &&
        preview &&
        open &&
        createPortal(
          <div
            className="fixed z-50"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={keepOpen}
            onMouseLeave={scheduleClose}
          >
            <PostPreviewCard meta={preview} />
          </div>,
          document.body
        )}
    </>
  )
}
