'use client'

import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export default function PostBackButton() {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-full opacity-20 transition-opacity group-hover:opacity-100 hover:opacity-100"
      aria-label="Back to home"
      asChild
    >
      <Link href="/">
        <CaretLeft className="size-4" weight="bold" />
      </Link>
    </Button>
  )
}
