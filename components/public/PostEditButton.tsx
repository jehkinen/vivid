'use client'

import Link from 'next/link'
import { PencilSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface PostEditButtonProps {
  postId: string
}

export default function PostEditButton({ postId }: PostEditButtonProps) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link
        href={`/vivid/editor/post/${postId}`}
        aria-label="Редактировать пост"
      >
        <PencilSimple className="size-4" />
      </Link>
    </Button>
  )
}
