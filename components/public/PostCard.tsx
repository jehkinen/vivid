import Link from 'next/link'
import { formatPostDate } from '@/lib/utils'

const EXCERPT_LENGTH = 200

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  const end = lastSpace > 0 ? lastSpace : maxLength
  return cut.slice(0, end).trim() + '...'
}

interface PostCardProps {
  title: string | null
  slug: string
  plaintext: string | null
  publishedAt: string | Date | null
  wordCount: number | null
  tags?: { tag: { id: string; name: string; slug: string; color?: string | null } }[]
}

export default function PostCard({ title, slug, plaintext, publishedAt, wordCount, tags }: PostCardProps) {
  const excerpt = plaintext ? truncateAtWord(plaintext, EXCERPT_LENGTH) : ''
  const dateStr = formatPostDate(publishedAt)
  const words = wordCount ?? 0
  const tagList = tags?.map((t) => t.tag) ?? []

  return (
    <article className="border-b border-border py-8 first:pt-0">
      <h2 className="text-2xl font-bold mb-2">
        <Link href={`/${slug}`} className="text-foreground hover:opacity-80">
          {title || 'Untitled'}
        </Link>
      </h2>
      {excerpt && (
        <p className="text-muted-foreground mb-4 line-clamp-3 font-reading">
          {excerpt}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {dateStr}
        {dateStr && ' • '}
        {words} {words === 1 ? 'word' : 'words'}
      </p>
      {tagList.length > 0 && (
        <p className="text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {tagList.map((tag, i) => (
            <span key={tag.id} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-border select-none">·</span>}
              {tag.color && (
                <span
                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden
                />
              )}
              <Link
                href={`/tag/${tag.slug}`}
                className="italic hover:text-foreground hover:font-normal rounded px-1.5 py-0.5 -mx-1.5 bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                {tag.name}
              </Link>
            </span>
          ))}
        </p>
      )}
    </article>
  )
}
