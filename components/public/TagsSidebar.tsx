'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const VISIBLE_LIMIT = 20

interface TagItem {
  id: string
  name: string
  slug: string
  color: string | null
  postCount: number
}

interface TagsSidebarProps {
  tags: TagItem[]
}

export function TagsSidebar({ tags }: TagsSidebarProps) {
  const [expanded, setExpanded] = useState(false)

  const sortedTags = useMemo(
    () =>
      tags
        .filter((tag) => tag.postCount > 0)
        .sort((a, b) => {
          const countDiff = b.postCount - a.postCount
          return countDiff !== 0 ? countDiff : a.name.localeCompare(b.name, 'ru')
        }),
    [tags]
  )

  const visibleTags = expanded ? sortedTags : sortedTags.slice(0, VISIBLE_LIMIT)
  const hiddenCount = sortedTags.length - VISIBLE_LIMIT

  return (
    <div className="pb-4 space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          TOPICS
        </h3>
        <ul className="space-y-2">
          {visibleTags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/tag/${tag.slug}`}
                className="flex items-center justify-between gap-2 text-sm text-foreground hover:opacity-80"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="shrink-0 w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color || 'var(--muted-foreground)' }}
                    suppressHydrationWarning
                  />
                  <span className="break-words">{tag.name}</span>
                </span>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {tag.postCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? 'Show less' : `Show more (${hiddenCount})`}
          </button>
        )}
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          LISTS
        </h3>
        <Link
          href="/lists"
          className="text-sm text-foreground hover:opacity-80"
        >
          All lists
        </Link>
      </div>
    </div>
  )
}
