'use client'

import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'
import { routes } from '@/lib/routes'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type PostEditorBackLinkProps = {
  resolvedId: string | null
}

export function PostEditorBackLink({ resolvedId }: PostEditorBackLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={
            resolvedId
              ? `${routes.VIVID_POSTS.path}?returnTo=${encodeURIComponent(resolvedId)}`
              : routes.VIVID_POSTS.path
          }
          className="fixed top-[4.25rem] left-4 z-10 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground opacity-20 transition-opacity hover:bg-muted/50 hover:text-foreground hover:opacity-100"
          aria-label="Back"
        >
          <CaretLeft className="size-5" weight="bold" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        Back
      </TooltipContent>
    </Tooltip>
  )
}
