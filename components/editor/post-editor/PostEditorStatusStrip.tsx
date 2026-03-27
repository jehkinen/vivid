'use client'

import { Check } from '@phosphor-icons/react'
import { countWords } from '@/lib/utils'
import { extractPlaintextFromLexical } from '@/lib/lexical-utils'

type PostEditorStatusStripProps = {
  lexical: string | null
  statusLabel: string
}

export default function PostEditorStatusStrip({ lexical, statusLabel }: PostEditorStatusStripProps) {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-10 hidden flex-col gap-0.5 px-6 pb-4 text-xs text-muted-foreground opacity-70 md:flex">
      <span className="tabular-nums">{countWords(extractPlaintextFromLexical(lexical))} words</span>
      <span className="inline-flex items-center gap-1.5">
        {statusLabel}
        {statusLabel.includes('Saved') && (
          <Check className="size-3.5 shrink-0 text-green-500/70" weight="bold" />
        )}
      </span>
    </div>
  )
}
