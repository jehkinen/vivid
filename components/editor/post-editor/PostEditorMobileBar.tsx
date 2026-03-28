'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import InsertBlockPlus from '@/components/editor/InsertBlockPlus'
import ReadingSettingsPanel from '@/components/public/ReadingSettingsPanel'
import { MEDIABLE_TYPES } from '@/shared/constants'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SlidersHorizontalIcon, Eye, Check, CaretUpIcon, CaretDownIcon, SelectionPlus } from '@phosphor-icons/react'
import { countWords } from '@/lib/utils'
import { extractPlaintextFromLexical } from '@/lib/lexical-utils'
import type { LexicalEditor } from 'lexical'

type PostEditorMobileBarProps = {
  editor: LexicalEditor | null
  resolvedId: string | undefined
  slug: string
  lexical: string | null
  statusLabel: string
  settingsOpen: boolean
  mobileBarCollapsed: boolean
  onMobileBarCollapsedChange: (v: boolean) => void
  onSettingsToggle: () => void
}

export default function PostEditorMobileBar({
  editor,
  resolvedId,
  slug,
  lexical,
  statusLabel,
  settingsOpen,
  mobileBarCollapsed,
  onMobileBarCollapsedChange,
  onSettingsToggle,
}: PostEditorMobileBarProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-20 flex items-center overflow-hidden border-t bg-background transition-[height] duration-200 md:hidden',
        mobileBarCollapsed ? 'h-10 justify-end' : 'h-12'
      )}
      aria-label="Editor actions"
    >
      {mobileBarCollapsed ? (
        <button
          type="button"
          onClick={() => onMobileBarCollapsedChange(false)}
          className="flex h-full w-12 items-center justify-center pr-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Expand menu"
        >
          <CaretUpIcon className="size-5" weight="bold" />
        </button>
      ) : (
        <div className="flex h-12 min-w-0 w-full items-center justify-between gap-4 px-4">
          <div className="flex shrink-0 items-center gap-4">
            <div className="shrink-0">
              <InsertBlockPlus
                editor={editor}
                mediableType={MEDIABLE_TYPES.POST}
                mediableId={resolvedId}
                tooltipSide="top"
                trigger={
                  <button
                    type="button"
                    disabled={!editor}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Add block"
                  >
                    <SelectionPlus className="size-5" />
                  </button>
                }
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-9 w-9 shrink-0 rounded-md text-muted-foreground hover:text-foreground',
                    settingsOpen && 'bg-accent text-accent-foreground'
                  )}
                  aria-label={
                    settingsOpen ? 'Close post settings' : 'Post settings'
                  }
                  onClick={onSettingsToggle}
                >
                  <SlidersHorizontalIcon className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {settingsOpen ? 'Close post settings' : 'Post settings'}
              </TooltipContent>
            </Tooltip>
            <div className="shrink-0">
              <ReadingSettingsPanel iconOnly triggerClassName="h-9 w-9 rounded-md opacity-80 hover:opacity-100" />
            </div>
            {slug ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/${encodeURIComponent(slug)}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    aria-label="Preview"
                  >
                    <Eye className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">Preview</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground opacity-50">
                    <Eye className="size-5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Set a slug to preview</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex min-w-0 shrink-0 flex-col items-end justify-center gap-0.5 text-xs text-muted-foreground opacity-70">
            <span className="tabular-nums">{countWords(extractPlaintextFromLexical(lexical))} words</span>
            <span className="inline-flex items-center gap-1.5">
              {statusLabel}
              {statusLabel.includes('Saved') && (
                <Check className="size-3.5 shrink-0 text-green-500/70" weight="bold" />
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onMobileBarCollapsedChange(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Collapse menu"
          >
            <CaretDownIcon className="size-5" weight="bold" />
          </button>
        </div>
      )}
    </nav>
  )
}
