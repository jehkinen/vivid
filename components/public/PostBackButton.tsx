'use client'

import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'
import { routes } from '@/lib/routes'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type PostBackButtonProps = {
  postId?: string
  preview?: boolean
}

export function PostBackButton({ postId, preview }: PostBackButtonProps) {
  const href =
    preview && postId ? routes.VIVID_EDITOR_POST.path(postId) : routes.HOME.path

  const label = preview ? 'Back to editor' : 'Back to home'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className="fixed top-28 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground opacity-20 transition-opacity hover:bg-muted/50 hover:text-foreground hover:opacity-100"
          aria-label={label}
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
