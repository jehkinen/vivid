'use client'

import { useQuery } from '@tanstack/react-query'
import { PostReferencesPanel } from '@/components/public/PostReferencesPanel'
import { queryKeys } from '@/lib/query-keys'
import type { PostReferencesBundle } from '@/types/post-references'

async function fetchPostReferences(postId: string): Promise<PostReferencesBundle> {
  const res = await fetch(`/api/posts/${postId}/references`)
  if (!res.ok) throw new Error('Failed to load references')
  return res.json()
}

export function PostEditorReferencesPanel({ postId }: { postId?: string }) {
  const { data } = useQuery({
    queryKey: queryKeys.posts.references(postId ?? ''),
    queryFn: () => fetchPostReferences(postId!),
    enabled: !!postId,
  })

  if (!postId || !data) return null

  return (
    <PostReferencesPanel
      incoming={data.incoming}
      outgoing={data.outgoing}
      buildHref={(item) => `/vivid/editor/post/${item.id}`}
      className="border-t-0 pt-0 mt-0"
    />
  )
}
