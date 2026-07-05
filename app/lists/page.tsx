import Link from 'next/link'
import { listsService } from '@/services/lists.service'
import { PublicLayout } from '@/components/public/PublicLayout'
import { TagsSidebar } from '@/components/public/TagsSidebar'
import { tagsService } from '@/services/tags.service'

export default async function ListsIndexPage() {
  const [lists, tagsWithCount] = await Promise.all([
    listsService.findManyPublic(),
    tagsService.findManyWithPublishedPostCount(),
  ])

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
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Lists</h1>
        {lists.length === 0 ? (
          <p className="text-muted-foreground">No public lists yet.</p>
        ) : (
          <ul className="space-y-4">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/lists/${list.slug}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <h2 className="font-semibold text-lg">{list.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {list.items.length} item{list.items.length === 1 ? '' : 's'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PublicLayout>
  )
}
