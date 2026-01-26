'use client'

import { cn } from '@/lib/utils'

export default function Loader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  )
}
