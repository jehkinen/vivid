'use client'

import { useEffect, useState } from 'react'
import { XIcon, CaretLeftIcon, CaretRightIcon, ImageBrokenIcon } from '@phosphor-icons/react'

interface LightboxProps {
  images: { src: string; alt?: string }[]
  initialIndex: number
  onClose: () => void
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
        aria-label="Close"
      >
        <XIcon className="h-6 w-6" />
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((i) => (i - 1 + images.length) % images.length)
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
          aria-label="Previous"
        >
          <CaretLeftIcon className="h-10 w-10" />
        </button>
      )}

      {hasError ? (
        <div
          className="flex flex-col items-center justify-center gap-3 text-white/70"
          onClick={(e) => e.stopPropagation()}
        >
          <ImageBrokenIcon className="h-16 w-16" />
          <span>Image unavailable</span>
        </div>
      ) : (
        <img
          src={current.src}
          alt={current.alt || ''}
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          onError={() => setHasError(true)}
        />
      )}

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((i) => (i + 1) % images.length)
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
          aria-label="Next"
        >
          <CaretRightIcon className="h-10 w-10" />
        </button>
      )}

      {hasMultiple && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {index + 1} / {images.length}
        </span>
      )}
    </div>
  )
}
