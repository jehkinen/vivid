'use client'

import Link from 'next/link'
import { FlowerLotus } from '@phosphor-icons/react'

export default function PublicLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
    >
      <FlowerLotus className="size-8 text-[#3eb8b5]" weight="regular" />
      <span className="text-2xl font-bold font-sans uppercase logo-gradient">
        Vivid
      </span>
    </Link>
  )
}
