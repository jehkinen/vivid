'use client'

import { POST_STATUS, type PostStatus } from '@/shared/constants'
import { cn } from '@/lib/utils'
import { PublicLogo } from '@/components/public/PublicLogo'

type PostEditorHeaderProps = {
  status: PostStatus
  resolvedId: string | null
  isSaving: boolean
  onStatusChange: (s: PostStatus) => void
  onSaveDraft: () => void
  onSavePublished: () => void
}

export function PostEditorHeader({
  status,
  resolvedId,
  isSaving,
  onStatusChange,
  onSaveDraft,
  onSavePublished,
}: PostEditorHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
      <div className="flex items-center gap-4">
        <PublicLogo />
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => (resolvedId ? onStatusChange(POST_STATUS.DRAFT) : onSaveDraft())}
            disabled={!resolvedId && isSaving}
            className={cn(
              'rounded px-3 py-1.5 text-sm',
              status === POST_STATUS.DRAFT
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() =>
              resolvedId ? onStatusChange(POST_STATUS.PUBLISHED) : onSavePublished()
            }
            disabled={!resolvedId && isSaving}
            className={cn(
              'rounded px-3 py-1.5 text-sm',
              status === POST_STATUS.PUBLISHED
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            Published
          </button>
        </div>
      </div>
    </header>
  )
}
