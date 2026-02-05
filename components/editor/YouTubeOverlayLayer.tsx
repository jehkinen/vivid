'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $isElementNode } from 'lexical'
import type { LexicalNode } from 'lexical'
import { $isYouTubeNode } from './nodes/YouTubeNode'
import type { YouTubeNode } from './nodes/YouTubeNode'
import { useCallback, useEffect, useRef, useState } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { $getNodeByKey } from 'lexical'

const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/'
const CACHE_MAX = 30

const iframeCache = new Map<string, HTMLIFrameElement>()

function getOrCreateIframe(nodeKey: string, videoId: string): HTMLIFrameElement {
  let iframe = iframeCache.get(nodeKey)
  if (iframe) return iframe
  if (iframeCache.size >= CACHE_MAX) {
    const firstKey = iframeCache.keys().next().value
    if (firstKey) {
      const old = iframeCache.get(firstKey)
      if (old?.parentNode) old.parentNode.removeChild(old)
      iframeCache.delete(firstKey)
    }
  }
  iframe = document.createElement('iframe')
  iframe.src = `${YOUTUBE_EMBED_BASE}${encodeURIComponent(videoId)}`
  iframe.title = 'YouTube video'
  iframe.className = 'absolute inset-0 w-full h-full'
  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')
  iframe.allowFullscreen = true
  iframeCache.set(nodeKey, iframe)
  return iframe
}

export function removeYouTubeFromCache(nodeKey: string) {
  iframeCache.delete(nodeKey)
}

interface YouTubeItem {
  nodeKey: string
  videoId: string
  top: number
  left: number
  width: number
  height: number
}

function collectYouTubeNodes(editor: ReturnType<typeof useLexicalComposerContext>[0]): { nodeKey: string; videoId: string }[] {
  const result: { nodeKey: string; videoId: string }[] = []
  const state = editor.getEditorState()
  state.read(() => {
    const root = $getRoot()
    function visit(node: LexicalNode) {
      if ($isYouTubeNode(node)) {
        result.push({ nodeKey: node.getKey(), videoId: (node as YouTubeNode).getVideoId() })
      }
      if ($isElementNode(node)) {
        node.getChildren().forEach(visit)
      }
    }
    root.getChildren().forEach(visit)
  })
  return result
}

function useYouTubeRects(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  containerRef: React.RefObject<HTMLElement | null>
): YouTubeItem[] {
  const [items, setItems] = useState<YouTubeItem[]>([])
  const rafRef = useRef<number | null>(null)

  const update = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const pairs = collectYouTubeNodes(editor)
    const next: YouTubeItem[] = []
    const containerRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop ?? 0
    const scrollLeft = container.scrollLeft ?? 0

    for (const { nodeKey, videoId } of pairs) {
      const el = editor.getElementByKey(nodeKey)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      next.push({
        nodeKey,
        videoId,
        top: rect.top - containerRect.top + scrollTop,
        left: rect.left - containerRect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
      })
    }
    setItems(next)
  }, [editor, containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const run = () => {
      rafRef.current = null
      update()
    }

    const schedule = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(run)
    }

    const unregister = editor.registerUpdateListener(schedule)
    container.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { passive: true, capture: true })

    const rafId = requestAnimationFrame(() => {
      update()
      requestAnimationFrame(update)
    })
    const t = setTimeout(update, 150)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t)
      unregister()
      container.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, { capture: true })
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [editor, update, containerRef])

  return items
}

export default function YouTubeOverlayLayer({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [editor] = useLexicalComposerContext()
  const overlayRef = useRef<HTMLDivElement>(null)
  const items = useYouTubeRects(editor, containerRef)

  useEffect(() => {
    const container = containerRef.current
    const overlay = overlayRef.current
    if (!container || !overlay) return
    const syncHeight = () => {
      overlay.style.height = `${container.scrollHeight}px`
    }
    syncHeight()
    const ro = new ResizeObserver(syncHeight)
    ro.observe(container)
    return () => ro.disconnect()
  }, [containerRef, items.length])

  return (
    <div
      ref={overlayRef}
      className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
      style={{ minHeight: '100%' }}
      aria-hidden
    >
      {items.map(({ nodeKey, videoId, top, left, width, height }) => (
        <div
          key={nodeKey}
          className="pointer-events-auto absolute"
          style={{ top, left, width, height }}
        >
          <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-muted group">
            <div
              className="absolute inset-0"
              ref={(node) => {
                if (!node) return
                const iframe = getOrCreateIframe(nodeKey, videoId)
                if (iframe.parentNode !== node) {
                  if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
                  node.appendChild(iframe)
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                editor.update(() => {
                  const node = $getNodeByKey(nodeKey)
                  if (node && $isYouTubeNode(node)) node.remove()
                })
                removeYouTubeFromCache(nodeKey)
              }}
              className="absolute right-2 top-2 z-[100] rounded p-1.5 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
              aria-label="Remove video"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
