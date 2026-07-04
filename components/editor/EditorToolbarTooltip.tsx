'use client'

import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ShortcutKey = string

type EditorToolbarTooltipProps = {
  label: string
  shortcuts?: ShortcutKey[]
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

function ShortcutBadge({ children }: { children: ReactNode }) {
  return (
    <kbd className="pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center rounded border border-white/15 bg-white/10 px-1 font-mono text-[10px] font-medium">
      {children}
    </kbd>
  )
}

export default function EditorToolbarTooltip({
  label,
  shortcuts,
  children,
  side = 'top',
}: EditorToolbarTooltipProps) {
  return (
    <Tooltip delayDuration={0} skipDelayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={8} className="flex items-center gap-2 px-3 py-1.5">
        <span>{label}</span>
        {shortcuts && shortcuts.length > 0 && (
          <span className={cn('flex items-center gap-0.5')}>
            {shortcuts.map((key) => (
              <ShortcutBadge key={key}>{key}</ShortcutBadge>
            ))}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
