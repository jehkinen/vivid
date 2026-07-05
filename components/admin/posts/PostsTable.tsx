'use client'

import type { RefObject } from 'react'
import type { PostWithListRelations } from '@/lib/api/postsClient'
import type { Tag } from '@/hooks/api/use-tags'
import { Loader } from '@/components/ui/loader'
import { PostRow } from '@/components/admin/posts/PostRow'

type PostsTableProps = {
  posts: PostWithListRelations[]
  postsLoading: boolean
  tags: Tag[]
  editingTagsPostId: string | null
  editingTagsSelected: string[]
  restorePending: boolean
  hardDeletePending: boolean
  isFetchingNextPage: boolean
  loadMoreRef: RefObject<HTMLDivElement | null>
  onEditingTagsSelectedChange: (ids: string[]) => void
  onOpenQuickTagEdit: (post: PostWithListRelations) => void
  onCloseQuickTagEdit: () => void
  onCreateTag: (name: string) => Promise<{ value: string; label: string; color: string | null } | null>
  onRestore: (postId: string) => void
  onPermanentDelete: (post: { id: string; title: string }) => void
  onSoftDelete: (post: { id: string; title: string }) => void
}

export function PostsTable({
  posts,
  postsLoading,
  tags,
  editingTagsPostId,
  editingTagsSelected,
  restorePending,
  hardDeletePending,
  isFetchingNextPage,
  loadMoreRef,
  onEditingTagsSelectedChange,
  onOpenQuickTagEdit,
  onCloseQuickTagEdit,
  onCreateTag,
  onRestore,
  onPermanentDelete,
  onSoftDelete,
}: PostsTableProps) {
  return (
    <div className="divide-y divide-border">
      {postsLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No posts found</div>
      ) : (
        <>
          {posts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              tags={tags}
              editingTagsPostId={editingTagsPostId}
              editingTagsSelected={editingTagsSelected}
              restorePending={restorePending}
              hardDeletePending={hardDeletePending}
              onEditingTagsSelectedChange={onEditingTagsSelectedChange}
              onOpenQuickTagEdit={onOpenQuickTagEdit}
              onCloseQuickTagEdit={onCloseQuickTagEdit}
              onCreateTag={onCreateTag}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
              onSoftDelete={onSoftDelete}
            />
          ))}
          <div ref={loadMoreRef} className="min-h-12 flex items-center justify-center py-4">
            {isFetchingNextPage && <Loader />}
          </div>
        </>
      )}
    </div>
  )
}
