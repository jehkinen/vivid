import { notFound } from 'next/navigation'
import Link from 'next/link'
import { listsService } from '@/services/lists.service'
import PublicLayout from '@/components/public/PublicLayout'
import TagsSidebar from '@/components/public/TagsSidebar'
import { tagsService } from '@/services/tags.service'

export default async function ListSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const list = await listsService.findBySlug(slug)
  if (!list) notFound()

  const tagsWithCount = await tagsService.findManyWithPublishedPostCount()
  const tags = tagsWithCount
    .filter((t) => (t.postCount ?? 0) > 0)
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      postCount: t.postCount,
    }))

  return (
    <PublicLayout sidebar={<TagsSidebar tags={tags} />}>
      <div className="space-y-6">
        <nav className="text-sm text-muted-foreground">
          <Link href="/lists" className="hover:text-foreground">
            Lists
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{list.title}</span>
        </nav>
        <h1 className="text-3xl font-bold">{list.title}</h1>
        <ul className="space-y-2">
          {list.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span
                className="shrink-0 w-5 h-5 rounded border border-input flex items-center justify-center text-xs"
                aria-hidden
              >
                {item.checked ? '✓' : ''}
              </span>
              <span
                className={item.checked ? 'line-through text-muted-foreground' : ''}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PublicLayout>
  )
}
