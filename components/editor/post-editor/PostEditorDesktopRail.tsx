'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InsertBlockPlus } from '@/components/editor/floating/InsertBlockPlus'
import { ReadingSettingsPanel } from '@/components/public/ReadingSettingsPanel'
import { MEDIABLE_TYPES } from '@/shared/constants'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SlidersHorizontalIcon, Eye, Trash } from '@phosphor-icons/react'
import type { LexicalEditor } from 'lexical'

type PostEditorDesktopRailProps = {
  editor: LexicalEditor | null
  resolvedId: string | undefined
  slug: string
  settingsOpen: boolean
  isNew: boolean
  onSettingsToggle: () => void
  onDeleteClick: () => void
}

export function PostEditorDesktopRail({
  editor,
  resolvedId,
  slug,
  settingsOpen,
  isNew,
  onSettingsToggle,
  onDeleteClick,
}: PostEditorDesktopRailProps) {
  return (
    <div className="hidden w-10 shrink-0 flex-col md:flex">
      <div className="sticky top-[50vh] flex shrink-0 -translate-y-1/2 flex-col items-center gap-3 pt-8">
        <InsertBlockPlus
          editor={editor}
          mediableType={MEDIABLE_TYPES.POST}
          mediableId={resolvedId}
          triggerClassName="h-9 w-9 rounded-md opacity-20 transition-opacity hover:opacity-100"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'h-9 w-9 rounded-md opacity-20 transition-opacity hover:opacity-100',
                settingsOpen && 'bg-accent text-accent-foreground opacity-100'
              )}
              aria-label={settingsOpen ? 'Close post settings' : 'Post settings'}
              onClick={onSettingsToggle}
            >
              <SlidersHorizontalIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            {settingsOpen ? 'Close post settings' : 'Post settings'}
          </TooltipContent>
        </Tooltip>
        <ReadingSettingsPanel iconOnly triggerClassName="h-9 w-9 rounded-md opacity-20 transition-opacity hover:opacity-100" />
        {slug ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-md opacity-20 transition-opacity hover:opacity-100"
                aria-label="Preview"
                asChild
              >
                <Link href={`/${encodeURIComponent(slug)}?preview=1`} target="_blank" rel="noopener noreferrer">
                  <Eye className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              Preview
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 cursor-not-allowed rounded-md opacity-20"
                aria-label="Set a slug to preview"
                disabled
              >
                <Eye className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              Set a slug to preview
            </TooltipContent>
          </Tooltip>
        )}
        {!isNew && resolvedId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-md opacity-20 transition-opacity hover:opacity-100"
                aria-label="Delete post"
                onClick={onDeleteClick}
              >
                <Trash className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              Delete post
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
