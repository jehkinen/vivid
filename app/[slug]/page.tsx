import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { postsService } from '@/services/posts.service'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'
import { formatPostDate } from '@/lib/utils'
import { getAuthCookieName, verifyAuthToken } from '@/lib/auth'
import PublicLayout from '@/components/public/PublicLayout'
import PostContent from '@/components/view/PostContent'
import PostEditButton from '@/components/public/PostEditButton'
import PostBackButton from '@/components/public/PostBackButton'
import ReadingSettingsPanel from '@/components/public/ReadingSettingsPanel'

const RESERVED_SLUGS = ['tag', 'vivid', 'login', 'api']

async function isLoggedIn(): Promise<boolean> {
  const token = (await cookies()).get(getAuthCookieName())?.value
  if (!token) return false
  try {
    await verifyAuthToken(token)
    return true
  } catch {
    return false
  }
}

export default async function PostBySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  if (RESERVED_SLUGS.includes(slug)) notFound()

  const [post, loggedIn] = await Promise.all([
    postsService.findOne({ slug }),
    isLoggedIn(),
  ])
  const isPreview = Boolean(loggedIn && resolvedSearchParams?.preview)
  if (!post) notFound()
  if (!isPreview && (post.status !== POST_STATUS.PUBLISHED || post.visibility !== POST_VISIBILITY.PUBLIC)) {
    notFound()
  }

  const tags = 'tags' in post && Array.isArray(post.tags)
    ? (post.tags as { tag: { id: string; name: string; slug: string; color?: string | null } }[]).map((t) => t.tag)
    : []

  return (
    <PublicLayout showReadingSettingsInHeader={false}>
      <div className="flex gap-4 items-start">
        <div className="group sticky top-[50vh] -translate-y-1/2 shrink-0 w-14 flex flex-col items-center gap-3 pr-4">
          <PostBackButton />
          <ReadingSettingsPanel iconOnly />
          {loggedIn && <PostEditButton postId={post.id} />}
        </div>
        <article className="relative max-w-3xl mx-auto flex-1 min-w-0 font-reading">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground mb-4">
            <time>{formatPostDate(post.publishedAt)}</time>
            {tags.length > 0 && (
              <>
                <span className="text-border select-none">·</span>
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {tags.map((tag, i) => (
                    <span key={tag.id} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-border select-none">·</span>}
                      <Link
                        href={`/tag/${tag.slug}`}
                        className="inline-flex items-center gap-1.5 italic hover:text-foreground hover:font-normal rounded px-1.5 py-0.5 -mx-1.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        {tag.color && (
                          <span
                            className="shrink-0 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                            aria-hidden
                            suppressHydrationWarning
                          />
                        )}
                        {tag.name}
                      </Link>
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {post.title || 'Untitled'}
          </h1>
          {'featuredMedia' in post && (post.featuredMedia as { url?: string })?.url && (
            <figure className="mt-6 -mx-4 sm:mx-0">
              <img
                src={(post.featuredMedia as { url: string }).url}
                alt={
                  (post.featuredMedia as { meta?: { alt?: string }; filename?: string }).meta?.alt ??
                  (post.featuredMedia as { filename?: string }).filename ??
                  post.title ??
                  ''
                }
                className="w-full rounded-lg"
              />
              {(post.featuredMedia as { meta?: { caption?: string } }).meta?.caption && (
                <figcaption className="mt-2 text-sm text-muted-foreground text-center">
                  {(post.featuredMedia as { meta?: { caption?: string } }).meta!.caption}
                </figcaption>
              )}
            </figure>
          )}
        </header>
        <PostContent lexicalJson={post.lexical} />
        </article>
      </div>
    </PublicLayout>
  )
}
