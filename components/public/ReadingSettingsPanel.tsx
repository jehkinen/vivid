'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SlidersIcon, BookOpenText } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface ReadingSettingsPanelProps {
  iconOnly?: boolean
}

const READING_FONT_KEY = 'readingFont'
const READING_FONT_SIZE_KEY = 'readingFontSize'

const FONT_MIN = 14
const FONT_MAX = 28
const FONT_DEFAULT = 20

type ReadingFontId = 'bitter' | 'tiempo' | 'bookerly' | 'source'

const FONTS: { id: ReadingFontId; label: string }[] = [
  { id: 'bitter', label: 'Bitter' },
  { id: 'tiempo', label: 'Tiempo' },
  { id: 'bookerly', label: 'Bookerly Light' },
  { id: 'source', label: 'Source Serif 4' },
]

function getStoredFont(): ReadingFontId {
  if (typeof window === 'undefined') return 'bitter'
  const stored = localStorage.getItem(READING_FONT_KEY)
  if (stored === 'bitter' || stored === 'tiempo' || stored === 'bookerly' || stored === 'source') return stored
  return 'bitter'
}

function getStoredFontSize(): number {
  if (typeof window === 'undefined') return FONT_DEFAULT
  const stored = localStorage.getItem(READING_FONT_SIZE_KEY)
  const n = stored ? parseInt(stored, 10) : NaN
  if (!Number.isNaN(n) && n >= FONT_MIN && n <= FONT_MAX) return n
  return FONT_DEFAULT
}

function applyFont(id: ReadingFontId) {
  document.body.dataset.readingFont = id
  localStorage.setItem(READING_FONT_KEY, id)
}

function applyFontSize(px: number) {
  document.body.style.setProperty('--reading-font-size', `${px}px`)
  localStorage.setItem(READING_FONT_SIZE_KEY, String(px))
}

export default function ReadingSettingsPanel({ iconOnly = false }: ReadingSettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [font, setFont] = useState<ReadingFontId>('bitter')
  const [fontSize, setFontSize] = useState(FONT_DEFAULT)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const storedFont = getStoredFont()
    const storedSize = getStoredFontSize()
    setFont(storedFont)
    setFontSize(storedSize)
    document.body.dataset.readingFont = storedFont
    document.body.style.setProperty('--reading-font-size', `${storedSize}px`)
  }, [mounted])

  const handleFont = (id: ReadingFontId) => {
    setFont(id)
    applyFont(id)
  }

  const handleFontSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!Number.isNaN(value) && value >= FONT_MIN && value <= FONT_MAX) {
      setFontSize(value)
      applyFontSize(value)
    }
  }

  if (!mounted) {
    return (
      <Button
        variant={iconOnly ? 'outline' : 'ghost'}
        size="icon"
        className={cn(
          iconOnly && 'h-9 w-9 rounded-full opacity-20 transition-opacity group-hover:opacity-100 hover:opacity-100'
        )}
        aria-label="Reading settings"
        type="button"
      >
        {iconOnly ? <BookOpenText className="size-4" /> : <SlidersIcon size={18} />}
        {!iconOnly && <span className="hidden sm:inline">Reading</span>}
      </Button>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={iconOnly ? 'outline' : 'ghost'}
          size="icon"
          className={cn(
            !iconOnly && 'gap-1.5 text-muted-foreground hover:text-foreground',
            iconOnly && 'h-9 w-9 rounded-full opacity-20 transition-opacity group-hover:opacity-100 hover:opacity-100'
          )}
          aria-label="Reading settings"
        >
          {iconOnly ? <BookOpenText className="size-4" /> : <SlidersIcon size={18} />}
          {!iconOnly && <span className="hidden sm:inline">Reading</span>}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 sm:w-80 flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Reading settings</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 overflow-auto">
          <section className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">Font</label>
            <div className="flex flex-col gap-0.5">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFont(f.id)}
                  className={cn(
                    'w-full rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                    font === f.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>
          <section className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Text size</label>
              <span className="text-sm tabular-nums text-foreground">{fontSize} px</span>
            </div>
            <input
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              step={1}
              value={fontSize}
              onChange={handleFontSize}
              className="w-full h-2 rounded-full appearance-none bg-muted accent-foreground [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
              aria-label="Text size"
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
