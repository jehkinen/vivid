'use client'

import Link from 'next/link'
import { PencilSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PUBLIC_POST_TOOLTIP } from '@/shared/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface PostEditButtonProps {
  postId: string
}

export default function PostEditButton({ postId }: PostEditButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-md opacity-20 transition-opacity hover:opacity-100"
          asChild
        >
          <Link href={`/vivid/editor/post/${postId}`} aria-label={PUBLIC_POST_TOOLTIP.EDIT}>
            <PencilSimple className="size-4" weight="bold" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        {PUBLIC_POST_TOOLTIP.EDIT}
      </TooltipContent>
    </Tooltip>
  )
}
