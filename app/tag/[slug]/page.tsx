import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { POST_STATUS } from '@/shared/constants'

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await prisma.tag.findUnique({
    where: { slug },
  })

  if (!tag) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tag not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go to home
          </Link>
        </div>
      </div>
    )
  }

  const posts = await prisma.post.findMany({
    where: {
      status: POST_STATUS.PUBLISHED,
        tags: {
          some: {
            tag: {
              slug,
            },
          },
        },
      },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {tag.color && (
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            )}
            <h1 className="text-4xl font-bold">{tag.name}</h1>
          </div>
          {tag.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400">{tag.description}</p>
          )}
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No posts found with this tag.
            </p>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow font-reading"
              >
                <h2 className="text-2xl font-bold mb-2">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.publishedAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {post.plaintext && (
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                    {post.plaintext.substring(0, 200)}...
                  </p>
                )}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map(({ tag: postTag }) => (
                      <Link
                        key={postTag.id}
                        href={`/tag/${postTag.slug}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {postTag.color && (
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1"
                            style={{ backgroundColor: postTag.color }}
                          />
                        )}
                        {postTag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
