import Link from 'next/link'

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

export default function TagsSidebar({ tags }: TagsSidebarProps) {
  return (
    <div className="pb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        TOPICS
      </h3>
      <ul className="space-y-2">
        {tags.map((tag) => (
          <li key={tag.id}>
            <Link
              href={`/tag/${tag.slug}`}
              className="flex items-center justify-between gap-2 text-sm text-foreground hover:opacity-80"
            >
              <span className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color || 'var(--muted-foreground)' }}
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
    </div>
  )
}
