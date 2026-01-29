'use client'

import { useEffect, useState } from 'react'
import { TextAa } from '@phosphor-icons/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const READING_FONT_KEY = 'readingFont'

type ReadingFontId = 'bitter' | 'tiempo' | 'bookerly' | 'source'

const FONTS: { id: ReadingFontId; label: string }[] = [
  { id: 'bitter', label: 'Bitter' },
  { id: 'tiempo', label: 'Tiempo' },
  { id: 'bookerly', label: 'Bookerly Light' },
  { id: 'source', label: 'Source Serif 4' },
]

function getStoredFont(): ReadingFontId {
  if (typeof window === 'undefined') return 'source'
  const stored = localStorage.getItem(READING_FONT_KEY)
  if (stored === 'bitter' || stored === 'tiempo' || stored === 'bookerly' || stored === 'source') return stored
  return 'source'
}

export default function FontSwitcher() {
  const [font, setFont] = useState<ReadingFontId>('source')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const stored = getStoredFont()
    setFont(stored)
    document.body.dataset.readingFont = stored
  }, [mounted])

  const apply = (id: ReadingFontId) => {
    setFont(id)
    document.body.dataset.readingFont = id
    localStorage.setItem(READING_FONT_KEY, id)
    setOpen(false)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        aria-label="Switch reading font"
        type="button"
      >
        <TextAa size={18} />
        <span className="hidden sm:inline">Font</span>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Switch reading font"
        >
          <TextAa size={18} />
          <span className="hidden sm:inline">Font</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        {FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => apply(f.id)}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              font === f.id
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
