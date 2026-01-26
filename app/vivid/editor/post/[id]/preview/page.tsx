import { notFound } from 'next/navigation'
import Link from 'next/link'
import { postsService } from '@/services/posts.service'
import PostContent from '@/components/view/PostContent'

export default async function PostPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await postsService.findOne({ id })

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-6 max-w-3xl">
          <Link href={`/vivid/editor/post/${id}`} className="text-sm text-muted-foreground hover:underline">
            &larr; Back to editor
          </Link>
        </div>
        {'featuredMedia' in post && (post.featuredMedia as { url?: string } | null)?.url && (
          <div className="mb-10 w-full max-w-5xl mx-auto">
            <img
              src={(post.featuredMedia as { url: string; filename?: string | null })!.url}
              alt={(post.featuredMedia as { filename?: string | null })!.filename ?? ''}
              className="w-full aspect-[16/10] rounded-xl object-cover"
            />
          </div>
        )}
        <article className="prose prose-lg dark:prose-invert font-reading max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">{post.title || 'Untitled'}</h1>
          {post.publishedAt && (
            <p className="text-sm text-muted-foreground mb-6">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
          <PostContent lexicalJson={post.lexical} />
        </article>
      </div>
    </div>
  )
}
