'use client'

import { PostsFilters } from '@/components/admin/posts/PostsFilters'
import { PostsTable } from '@/components/admin/posts/PostsTable'
import { PostDeleteDialogs } from '@/components/admin/posts/PostDeleteDialogs'
import { usePostsAdminPage } from '@/components/admin/posts/usePostsAdminPage'

export default function PostsPage() {
  const {
    status,
    visibility,
    tagId,
    sort,
    tags,
    tagPopoverOpen,
    posts,
    postsLoading,
    isFetchingNextPage,
    loadMoreRef,
    postToDelete,
    permanentDeletePost,
    editingTagsPostId,
    editingTagsSelected,
    softDeletePending,
    hardDeletePending,
    restorePending,
    setStatus,
    setVisibility,
    setTagId,
    setSort,
    setTagPopoverOpen,
    setPostToDelete,
    setPermanentDeletePost,
    setEditingTagsSelected,
    handleDeletePost,
    handleConfirmHardDelete,
    closeQuickTagEdit,
    openQuickTagEdit,
    handleCreateTag,
    restorePost,
  } = usePostsAdminPage()

  return (
    <div className="p-8">
      <PostsFilters
        status={status}
        visibility={visibility}
        tagId={tagId}
        sort={sort}
        tags={tags}
        tagPopoverOpen={tagPopoverOpen}
        onStatusChange={setStatus}
        onVisibilityChange={setVisibility}
        onTagIdChange={setTagId}
        onSortChange={setSort}
        onTagPopoverOpenChange={setTagPopoverOpen}
      />
      <PostsTable
        posts={posts}
        postsLoading={postsLoading}
        tags={tags}
        editingTagsPostId={editingTagsPostId}
        editingTagsSelected={editingTagsSelected}
        restorePending={restorePending}
        hardDeletePending={hardDeletePending}
        isFetchingNextPage={isFetchingNextPage}
        loadMoreRef={loadMoreRef}
        onEditingTagsSelectedChange={setEditingTagsSelected}
        onOpenQuickTagEdit={openQuickTagEdit}
        onCloseQuickTagEdit={() => closeQuickTagEdit()}
        onCreateTag={handleCreateTag}
        onRestore={(postId) => restorePost.mutate(postId)}
        onPermanentDelete={setPermanentDeletePost}
        onSoftDelete={setPostToDelete}
      />
      <PostDeleteDialogs
        postToDelete={postToDelete}
        permanentDeletePost={permanentDeletePost}
        softDeletePending={softDeletePending}
        hardDeletePending={hardDeletePending}
        onPostToDeleteChange={setPostToDelete}
        onPermanentDeletePostChange={setPermanentDeletePost}
        onConfirmSoftDelete={handleDeletePost}
        onConfirmHardDelete={handleConfirmHardDelete}
      />
    </div>
  )
}
