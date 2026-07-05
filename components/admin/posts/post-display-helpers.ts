import type { PostWithListRelations } from '@/lib/api/postsClient'
import { formatDateRelative, formatTime } from '@/lib/utils'

export function displayDate(post: PostWithListRelations) {
  const d = post.publishedAt || post.updatedAt
  if (!d) return '–'
  return `${formatDateRelative(d)}, ${formatTime(d)}`
}

export function authorNames(post: PostWithListRelations) {
  const list = post.authors?.map((a) => a.author?.name).filter(Boolean)
  return list?.length ? list.join(', ') : null
}

export function postSubtitle(post: PostWithListRelations) {
  if (post.deletedAt) return `Deleted ${formatDateRelative(post.deletedAt)}, ${formatTime(post.deletedAt)}`
  const authors = authorNames(post)
  const date = displayDate(post)
  const hasDate = date && date !== '–'
  if (authors && hasDate) return `By ${authors} – ${date}`
  if (authors) return `By ${authors}`
  if (hasDate) return date
  return '–'
}

export function postTags(post: PostWithListRelations) {
  return post.tags?.map((t) => t.tag).filter(Boolean) ?? []
}
