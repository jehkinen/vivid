'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Feather, LockIcon, TrashIcon } from '@phosphor-icons/react'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'
import type { PostWithListRelations } from '@/lib/api/postsClient'

type PostRowActionsProps = {
  post: PostWithListRelations
  restorePending: boolean
  hardDeletePending: boolean
  onRestore: (postId: string) => void
  onPermanentDelete: (post: { id: string; title: string }) => void
  onSoftDelete: (post: { id: string; title: string }) => void
}

export function PostRowActions({
  post,
  restorePending,
  hardDeletePending,
  onRestore,
  onPermanentDelete,
  onSoftDelete,
}: PostRowActionsProps) {
  return (
    <>
      {!post.deletedAt && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 shrink-0">
          {post.status === POST_STATUS.DRAFT && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0 text-[#3eb8b5]">
                  <Feather size={18} />
                </span>
              </TooltipTrigger>
              <TooltipContent>Draft</TooltipContent>
            </Tooltip>
          )}
          {post.visibility === POST_VISIBILITY.PRIVATE && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0">
                  <LockIcon size={16} className="text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Private post</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      <div className="shrink-0 flex items-center gap-2">
        {post.deletedAt ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(post.id)}
              disabled={restorePending}
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                onPermanentDelete({ id: post.id, title: post.title || 'Untitled' })
              }
              disabled={hardDeletePending}
            >
              Delete permanently
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon-xl"
            className="rounded-md text-muted-foreground hover:bg-muted/70 hover:text-destructive"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation()
              onSoftDelete({ id: post.id, title: post.title || 'Untitled' })
            }}
            aria-label="Delete"
          >
            <TrashIcon className="size-5" />
          </Button>
        )}
      </div>
    </>
  )
}
