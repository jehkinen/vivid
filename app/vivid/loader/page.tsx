'use client'

import type React from 'react'

const EXPERIMENTS: { id: string; label: string; Loader: () => React.ReactElement }[] = [
  {
    id: 'dots',
    label: 'Dots',
    Loader: () => (
      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }}
          />
        ))}
      </div>
    ),
  },
  {
    id: 'ring',
    label: 'Ring',
    Loader: () => (
      <div
        className="size-10 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/70 animate-spin"
        aria-hidden
      />
    ),
  },
  {
    id: 'bar',
    label: 'Bar',
    Loader: () => (
      <div className="w-24 h-1 rounded-full bg-muted-foreground/20 overflow-hidden" aria-hidden>
        <div
          className="h-full w-1/2 rounded-full bg-muted-foreground/50"
          style={{ animation: 'loader-bar 1.2s ease-in-out infinite' }}
        />
      </div>
    ),
  },
  {
    id: 'pulse',
    label: 'Pulse',
    Loader: () => (
      <div
        className="size-10 rounded-full bg-muted-foreground/40 animate-pulse"
        aria-hidden
      />
    ),
  },
  {
    id: 'ellipsis',
    label: 'Ellipsis',
    Loader: () => (
      <div className="flex items-end justify-center gap-0.5 h-5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-muted-foreground/60"
            style={{
              height: '4px',
              animation: 'loader-ellipsis 0.6s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    id: 'line',
    label: 'Line',
    Loader: () => (
      <div className="w-20 h-0.5 rounded-full bg-muted-foreground/20 overflow-hidden" aria-hidden>
        <div
          className="h-full w-8 rounded-full bg-muted-foreground/50"
          style={{
            animation: 'loader-line 1.4s ease-in-out infinite',
          }}
        />
      </div>
    ),
  },
]

export default function LoaderPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <style>{`
        @keyframes loader-bar {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes loader-line {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
        }
        @keyframes loader-ellipsis {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
      <h1 className="text-2xl font-semibold text-center text-foreground mb-12">
        Loader experiments
      </h1>
      <div className="flex flex-wrap justify-center gap-x-16 gap-y-14">
        {EXPERIMENTS.map(({ id, label, Loader }) => (
          <div key={id} className="flex flex-col items-center gap-3">
            <div className="w-[140px] h-[140px] flex items-center justify-center rounded-lg border border-border/50 bg-muted/30">
              <Loader />
            </div>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
