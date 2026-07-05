import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { postsService } from '@/services/posts.service'
import { mediaService } from '@/services/media.service'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'
import { formatPostDate } from '@/lib/utils'
import { getAuthCookieName, verifyAuthToken } from '@/lib/auth'
import { collectMediaIds } from '@/lib/editor/lexical/collect-media-ids'
import { extractPostReferenceTargetIds } from '@/lib/editor/lexical/extract-post-references'
import { postReferencesService } from '@/services/post-references.service'
import { PublicLayout } from '@/components/public/PublicLayout'
import { PostContent } from '@/components/public/PostContent'
import { PostReferencesPanel } from '@/components/public/PostReferencesPanel'
import { PostEditButton } from '@/components/public/PostEditButton'
import { PostBackButton } from '@/components/public/PostBackButton'
import { ReadingSettingsPanel } from '@/components/public/ReadingSettingsPanel'

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

  const mediaUrlMap = await mediaService.resolveUrlMap(collectMediaIds(post.lexical))
  const refTargetIds = extractPostReferenceTargetIds(post.lexical)
  const [references, postSlugMap, postPreviewMap] = await Promise.all([
    postReferencesService.findForPost(post.id),
    postReferencesService.findSlugMapByIds(refTargetIds),
    postReferencesService.findPreviewMapByIds(refTargetIds),
  ])

  return (
    <PublicLayout showReadingSettingsInHeader={false}>
      <PostBackButton postId={post.id} preview={isPreview} />
      <div className="flex min-h-full w-full max-w-none gap-3 px-4 md:mx-auto md:max-w-[calc(48rem+2.5rem+1.5rem)] md:gap-6 md:px-6">
        <div className="flex w-10 shrink-0 flex-col self-stretch">
          <div className="sticky top-[50vh] -translate-y-1/2 shrink-0 flex flex-col items-center gap-3 pt-8">
            <ReadingSettingsPanel iconOnly />
            {loggedIn && <PostEditButton postId={post.id} />}
          </div>
        </div>
        <article className="relative w-full min-w-0 max-w-3xl flex-1 font-reading">
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
        <PostContent
          lexicalJson={post.lexical}
          urlMap={mediaUrlMap}
          postSlugMap={postSlugMap}
          postPreviewMap={postPreviewMap}
        />
        <PostReferencesPanel incoming={references.incoming} outgoing={references.outgoing} />
        </article>
      </div>
    </PublicLayout>
  )
}
