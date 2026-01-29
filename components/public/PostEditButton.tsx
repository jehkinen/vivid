'use client'

import Link from 'next/link'
import { PencilSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface PostEditButtonProps {
  postId: string
}

export default function PostEditButton({ postId }: PostEditButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-full opacity-20 transition-opacity group-hover:opacity-100 hover:opacity-100"
      asChild
    >
      <Link
        href={`/vivid/editor/post/${postId}`}
        aria-label="Редактировать пост"
      >
        <PencilSimple className="size-4" weight="bold" />
      </Link>
    </Button>
  )
}
