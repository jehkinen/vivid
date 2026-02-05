'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { SlidersIcon, BookOpenText } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { READING_FONTS, type ReadingFontId } from '@/shared/constants'

export interface ReadingSettingsPanelProps {
  iconOnly?: boolean
  triggerClassName?: string
  sheetBelowHeader?: boolean
  variant?: 'sheet' | 'popover'
  trigger?: React.ReactElement
}

const READING_FONT_KEY = 'readingFont'
const READING_FONT_SIZE_KEY = 'readingFontSize'

const FONT_MIN = 14
const FONT_MAX = 28
const FONT_DEFAULT = 20

function getStoredFont(): ReadingFontId {
  if (typeof window === 'undefined') return READING_FONTS[0].id
  const stored = localStorage.getItem(READING_FONT_KEY)
  if (stored && READING_FONTS.some((f) => f.id === stored)) return stored as ReadingFontId
  return READING_FONTS[0].id
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

const settingsContent = (
  font: ReadingFontId,
  fontSize: number,
  handleFontSize: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleFont: (id: ReadingFontId) => void
) => (
  <div className="flex flex-col gap-6">
    <section className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">Font</label>
      <div className="flex flex-col gap-0.5">
        {READING_FONTS.map((f) => (
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
)

export default function ReadingSettingsPanel({ iconOnly = false, triggerClassName, sheetBelowHeader = false, variant = 'sheet', trigger }: ReadingSettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [font, setFont] = useState<ReadingFontId>(READING_FONTS[0].id)
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

  const iconOnlyTriggerClass = iconOnly ? cn('h-9 w-9 rounded-full transition-opacity', triggerClassName ?? 'opacity-20 group-hover:opacity-100 hover:opacity-100') : undefined

  const triggerButton = (
    <Button
      variant={iconOnly ? 'outline' : 'ghost'}
      size="icon"
      className={cn(
        !iconOnly && 'gap-1.5 text-muted-foreground hover:text-foreground',
        iconOnlyTriggerClass
      )}
      aria-label="Reading settings"
    >
      {iconOnly ? <BookOpenText className="size-4" /> : <SlidersIcon size={18} />}
      {!iconOnly && <span className="hidden sm:inline">Reading</span>}
    </Button>
  )

  if (!mounted) {
    return (
      <Button
        variant={iconOnly ? 'outline' : 'ghost'}
        size="icon"
        className={iconOnlyTriggerClass}
        aria-label="Reading settings"
        type="button"
      >
        {iconOnly ? <BookOpenText className="size-4" /> : <SlidersIcon size={18} />}
        {!iconOnly && <span className="hidden sm:inline">Reading</span>}
      </Button>
    )
  }

  const triggerEl = trigger ?? triggerButton

  if (variant === 'popover') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {triggerEl}
        </PopoverTrigger>
        <PopoverContent align="end" side="bottom" className="w-72">
          <p className="text-sm font-medium mb-3">Reading settings</p>
          {settingsContent(font, fontSize, handleFontSize, handleFont)}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {triggerEl}
      </SheetTrigger>

      <SheetContent
        side="right"
        className={cn(
          'w-72 sm:w-80 flex flex-col',
          sheetBelowHeader && 'top-[4.5rem] h-[calc(100vh-4.5rem)]'
        )}
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Reading settings</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 overflow-auto">
          {settingsContent(font, fontSize, handleFontSize, handleFont)}
        </div>
      </SheetContent>
    </Sheet>
  )
}
