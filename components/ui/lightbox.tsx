'use client'

import { useEffect, useState } from 'react'
import { XIcon, CaretLeftIcon, CaretRightIcon, ImageBrokenIcon } from '@phosphor-icons/react'

export type LightboxSlide = {
  src: string
  alt?: string
  mimeType?: string | null
}

interface LightboxProps {
  images: LightboxSlide[]
  initialIndex: number
  onClose: () => void
  rightPanel?: (current: LightboxSlide, index: number) => React.ReactNode
}

export function Lightbox({ images, initialIndex, onClose, rightPanel }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [hasError, setHasError] = useState(false)
  const current = images[index]
  const hasMultiple = images.length > 1

  useEffect(() => {
    setHasError(false)
  }, [index])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasMultiple) setIndex((i) => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight' && hasMultiple) setIndex((i) => (i + 1) % images.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, hasMultiple, images.length])

  if (!current) return null

  const mime = (current.mimeType || '').toLowerCase()

  const mainContent =
    mime.startsWith('video/') ? (
      <video
        key={current.src}
        src={current.src}
        controls
        playsInline
        className="max-h-[min(90vh,90dvh)] max-w-[70vw] h-auto w-auto"
        onClick={(e) => e.stopPropagation()}
      />
    ) : mime.startsWith('audio/') ? (
      <audio
        key={current.src}
        src={current.src}
        controls
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      />
    ) : mime === 'application/pdf' ? (
      <iframe
        key={current.src}
        src={current.src}
        title={current.alt || 'Document'}
        className="h-[min(90vh,90dvh)] w-[min(90vw,56rem)] max-w-full rounded border border-white/10 bg-white"
        onClick={(e) => e.stopPropagation()}
      />
    ) : !mime || mime.startsWith('image/') ? (
      hasError ? (
        <div className="flex flex-col items-center justify-center gap-3 text-white/70">
          <ImageBrokenIcon className="h-16 w-16" />
          <span>Image unavailable</span>
        </div>
      ) : (
        <img
          src={current.src}
          alt={current.alt || ''}
          className="max-h-[90vh] max-w-[70vw] h-auto w-auto object-contain"
          draggable={false}
          onError={() => setHasError(true)}
        />
      )
    ) : (
      <div
        className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-white/10 bg-black/40 px-8 py-10 text-center text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm">{current.alt}</span>
        <a
          href={current.src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-400 underline underline-offset-2"
        >
          Open file
        </a>
      </div>
    )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
        aria-label="Close"
      >
        <XIcon className="h-6 w-6" />
      </button>

      <div className="flex h-full w-full items-center justify-center px-6" onClick={onClose}>
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i - 1 + images.length) % images.length)
            }}
            className="mx-2 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
            aria-label="Previous"
          >
            <CaretLeftIcon className="h-10 w-10" />
          </button>
        )}

        <div
          className="flex max-h-[90vh] max-w-[90vw] items-start gap-8"
          onClick={(e) => e.stopPropagation()}
        >
          {mainContent}
          {rightPanel && (
            <div className="hidden max-h-[80vh] w-64 flex-col overflow-y-auto rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/80 md:flex">
              {rightPanel(current, index)}
            </div>
          )}
        </div>

        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i + 1) % images.length)
            }}
            className="mx-2 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
            aria-label="Next"
          >
            <CaretRightIcon className="h-10 w-10" />
          </button>
        )}
      </div>

      {hasMultiple && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
          {index + 1} / {images.length}
        </span>
      )}
    </div>
  )
}
