'use client'

import * as React from 'react'
import { XIcon, CircleNotchIcon } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface TagInputOption {
  value: string
  label: string
  color?: string | null
}

interface TagInputProps {
  options: TagInputOption[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  creatable?: boolean
  onCreate?: (name: string) => Promise<{ value: string; label: string; color?: string | null } | null>
}

const SEPARATOR_KEYS = ['Enter', 'Tab', ',']

export function TagInput({
  options,
  selected,
  onSelectedChange,
  placeholder = 'Add tag...',
  className,
  creatable,
  onCreate,
}: TagInputProps) {
  const [query, setQuery] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const add = React.useCallback(
    (value: string) => {
      if (selected.includes(value)) return
      onSelectedChange([...selected, value])
      setQuery('')
    },
    [selected, onSelectedChange]
  )

  const remove = React.useCallback(
    (value: string) => {
      onSelectedChange(selected.filter((s) => s !== value))
    },
    [selected, onSelectedChange]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.filter((o) => !selected.includes(o.value))
    return options.filter(
      (o) =>
        !selected.includes(o.value) &&
        o.label.toLowerCase().includes(q)
    )
  }, [options, selected, query])

  const canCreate = creatable && onCreate && query.trim().length > 0
  const createLabel = query.trim()
  const showSuggestions = focused && (filtered.length > 0 || canCreate)
  const suggestionCount = (canCreate ? 1 : 0) + filtered.length

  React.useEffect(() => {
    setHighlightedIndex(0)
  }, [query, filtered.length, canCreate])

  React.useEffect(() => {
    if (!showSuggestions || !listRef.current) return
    const el = listRef.current.querySelector(`#tag-suggestion-${highlightedIndex}`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlightedIndex, showSuggestions])

  const handleCreate = React.useCallback(() => {
    const name = query.trim()
    if (!name || !onCreate) return
    setIsCreating(true)
    onCreate(name)
      .then((result) => {
        if (result) add(result.value)
      })
      .finally(() => setIsCreating(false))
  }, [query, onCreate, add])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestionCount > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => (i + 1) % suggestionCount)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => (i - 1 + suggestionCount) % suggestionCount)
        return
      }
      if (SEPARATOR_KEYS.includes(e.key)) {
        e.preventDefault()
        if (canCreate && highlightedIndex === 0) {
          handleCreate()
        } else {
          const optIndex = canCreate ? highlightedIndex - 1 : highlightedIndex
          if (filtered[optIndex]) add(filtered[optIndex].value)
        }
        return
      }
    } else if (SEPARATOR_KEYS.includes(e.key)) {
      e.preventDefault()
      if (filtered.length > 0) add(filtered[0].value)
      else if (canCreate) handleCreate()
      return
    }
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      remove(selected[selected.length - 1])
    }
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-9 rounded-md border border-input bg-background px-2 py-1.5 text-sm',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background'
        )}
      >
        {selected.map((id) => {
          const opt = options.find((o) => o.value === id)
          return (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 pr-0.5 font-normal"
            >
              {opt?.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                  suppressHydrationWarning
                />
              )}
              <span className="truncate max-w-[120px]">{opt?.label ?? id}</span>
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted-foreground/20 outline-none focus:ring-1 focus:ring-ring"
                onClick={() => remove(id)}
                aria-label="Remove tag"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )
        })}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent border-0 outline-none py-1 placeholder:text-muted-foreground"
        />
      </div>
      {showSuggestions && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
          role="listbox"
          aria-activedescendant={suggestionCount > 0 ? `tag-suggestion-${highlightedIndex}` : undefined}
        >
          {canCreate && (
            <li
              id="tag-suggestion-0"
              role="option"
              aria-selected={highlightedIndex === 0}
            >
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-2 py-2 text-left text-sm w-full rounded-sm',
                  highlightedIndex === 0
                    ? 'bg-accent text-accent-foreground ring-1 ring-ring'
                    : 'hover:bg-accent/50 hover:text-accent-foreground disabled:opacity-50'
                )}
                onClick={handleCreate}
                onMouseEnter={() => setHighlightedIndex(0)}
                disabled={isCreating}
              >
                {isCreating ? (
                  <CircleNotchIcon className="h-4 w-4 animate-spin shrink-0" />
                ) : null}
                <span>{isCreating ? 'Creating...' : `Create "${createLabel}"`}</span>
              </button>
            </li>
          )}
          {filtered.map((opt, i) => {
            const index = (canCreate ? 1 : 0) + i
            const isHighlighted = highlightedIndex === index
            return (
              <li
                key={opt.value}
                id={`tag-suggestion-${index}`}
                role="option"
                aria-selected={isHighlighted}
              >
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-2 py-2 text-left text-sm w-full rounded-sm',
                    isHighlighted
                      ? 'bg-accent text-accent-foreground ring-1 ring-ring'
                      : 'hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                  onClick={() => add(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {opt.color && (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: opt.color }}
                      suppressHydrationWarning
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
