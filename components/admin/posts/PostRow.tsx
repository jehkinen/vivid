'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/ui/tag-input'
import { ImageIcon, PencilSimple, Eye, Check } from '@phosphor-icons/react'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'
import type { PostWithListRelations } from '@/lib/api/postsClient'
import type { Tag } from '@/hooks/api/use-tags'
import { slugify } from '@/lib/utils'
import { postSubtitle, postTags } from '@/components/admin/posts/post-display-helpers'
import { PostRowActions } from '@/components/admin/posts/PostRowActions'

type PostRowProps = {
  post: PostWithListRelations
  tags: Tag[]
  editingTagsPostId: string | null
  editingTagsSelected: string[]
  restorePending: boolean
  hardDeletePending: boolean
  onEditingTagsSelectedChange: (ids: string[]) => void
  onOpenQuickTagEdit: (post: PostWithListRelations) => void
  onCloseQuickTagEdit: () => void
  onCreateTag: (name: string) => Promise<{ value: string; label: string; color: string | null } | null>
  onRestore: (postId: string) => void
  onPermanentDelete: (post: { id: string; title: string }) => void
  onSoftDelete: (post: { id: string; title: string }) => void
}

export function PostRow({
  post,
  tags,
  editingTagsPostId,
  editingTagsSelected,
  restorePending,
  hardDeletePending,
  onEditingTagsSelectedChange,
  onOpenQuickTagEdit,
  onCloseQuickTagEdit,
  onCreateTag,
  onRestore,
  onPermanentDelete,
  onSoftDelete,
}: PostRowProps) {
  const tagsForPost = postTags(post)

  return (
    <div
      data-post-id={post.id}
      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
    >
      <div
        className="w-16 h-16 shrink-0 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden relative group"
        {...(!post.deletedAt && post.slug ? { 'data-vivid-pointer': '' } : {})}
      >
        {post.featuredMedia?.url ? (
          <img
            src={post.featuredMedia.url}
            alt=""
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <ImageIcon size={24} className="text-muted-foreground pointer-events-none" />
        )}
        {!post.deletedAt && post.slug ? (
          <Link
            href={`/${post.slug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            data-vivid-pointer
            aria-label="Preview"
          >
            <Eye className="size-6 text-white pointer-events-none" />
          </Link>
        ) : null}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <Link
          href={`/vivid/editor/post/${post.id}`}
          className="min-w-0 cursor-pointer"
        >
          <div className="font-medium truncate">
            <span className="truncate">{post.title || 'Untitled'}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {postSubtitle(post)}
          </div>
        </Link>
        {!post.deletedAt && (
          <div
            className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {editingTagsPostId === post.id ? (
              <>
                <TagInput
                  options={[...tags]
                    .sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0))
                    .map((t) => ({ value: t.id, label: t.name, color: t.color }))}
                  selected={editingTagsSelected}
                  onSelectedChange={onEditingTagsSelectedChange}
                  placeholder="Type to add tag..."
                  creatable
                  onCreate={onCreateTag}
                  className="min-w-[200px]"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                  onClick={onCloseQuickTagEdit}
                >
                  <Check className="size-4" weight="bold" />
                </Button>
              </>
            ) : (
              <>
                {tagsForPost.length > 0 ? (
                  tagsForPost.map((tag, i) => (
                    <span key={tag.id} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-border select-none">·</span>}
                      <Link
                        href={`/tag/${tag.slug}`}
                        className="inline-flex items-center gap-1.5 italic rounded px-2 py-1 -mx-0.5 bg-muted/30 hover:bg-muted/80 hover:text-foreground hover:font-normal text-muted-foreground transition-colors"
                        data-vivid-pointer
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
                  ))
                ) : (
                  <span className="text-muted-foreground italic">No tags</span>
                )}
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onOpenQuickTagEdit(post)}
                  aria-label="Edit tags"
                >
                  <PencilSimple className="size-4" weight="bold" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <PostRowActions
        post={post}
        restorePending={restorePending}
        hardDeletePending={hardDeletePending}
        onRestore={onRestore}
        onPermanentDelete={onPermanentDelete}
        onSoftDelete={onSoftDelete}
      />
    </div>
  )
}
