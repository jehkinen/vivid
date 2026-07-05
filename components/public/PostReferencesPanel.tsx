import Link from 'next/link'
import { formatPostDate } from '@/lib/utils'
import { POST_STATUS } from '@/shared/constants'
import type { PostReferenceItem } from '@/types/post-references'

interface PostReferencesPanelProps {
  incoming: PostReferenceItem[]
  outgoing: PostReferenceItem[]
  linkPrefix?: string
  buildHref?: (item: PostReferenceItem) => string
  className?: string
}

function isBroken(item: PostReferenceItem): boolean {
  return item.deletedAt != null || item.status !== POST_STATUS.PUBLISHED
}

function ReferenceList({
  items,
  linkPrefix,
  buildHref,
  emptyLabel,
}: {
  items: PostReferenceItem[]
  linkPrefix: string
  buildHref?: (item: PostReferenceItem) => string
  emptyLabel: string
}) {
  const hrefFor = (item: PostReferenceItem) =>
    buildHref ? buildHref(item) : `${linkPrefix}/${item.slug}`
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const broken = isBroken(item)
        const href = hrefFor(item)
        return (
          <li key={item.id}>
            {broken ? (
              <span className="text-sm text-muted-foreground line-through">
                {item.title || 'Untitled'} (unavailable)
              </span>
            ) : (
              <Link
                href={href}
                className="text-sm text-foreground hover:opacity-80 block"
              >
                <span className="font-medium">{item.title || 'Untitled'}</span>
                {item.publishedAt && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {formatPostDate(item.publishedAt)}
                  </span>
                )}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function PostReferencesPanel({
  incoming,
  outgoing,
  linkPrefix = '',
  buildHref,
  className = '',
}: PostReferencesPanelProps) {
  if (incoming.length === 0 && outgoing.length === 0) return null

  return (
    <aside className={`space-y-6 border-t border-border pt-8 mt-8 ${className}`}>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Links to
        </h2>
        <ReferenceList
          items={outgoing}
          linkPrefix={linkPrefix}
          buildHref={buildHref}
          emptyLabel="No outgoing links."
        />
      </div>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Linked from
        </h2>
        <ReferenceList
          items={incoming}
          linkPrefix={linkPrefix}
          buildHref={buildHref}
          emptyLabel="No incoming links."
        />
      </div>
    </aside>
  )
}
