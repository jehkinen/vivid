'use client'

import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { XIcon } from '@phosphor-icons/react'
import { POST_VISIBILITY, type PostVisibility } from '@/shared/constants'

function toDateLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toTimeLocal(iso: string | null): string {
  if (!iso) return '00:00'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export interface PostSettingsPanelProps {
  slug: string
  onSlugChange: (v: string) => void
  visibility: PostVisibility
  onVisibilityChange: (v: PostVisibility) => void
  publishedAt: string | null
  onPublishedAtChange: (v: string | null) => void
  selectedTagIds: string[]
  onSelectedTagIdsChange: (v: string[]) => void
  tags: Array<{ id: string; name: string; color: string | null }>
  onCreateTag?: (name: string) => Promise<{ value: string; label: string; color?: string | null } | null>
  isNew: boolean
  postId: string | undefined
  onClose: () => void
}

export default function PostSettingsPanel({
  slug,
  onSlugChange,
  visibility,
  onVisibilityChange,
  publishedAt,
  onPublishedAtChange,
  selectedTagIds,
  onSelectedTagIdsChange,
  tags,
  onCreateTag,
  isNew,
  postId,
  onClose,
}: PostSettingsPanelProps) {
  return (
    <aside className="w-[360px] shrink-0 border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="font-medium">Post settings</span>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Publish date</label>
          <div className="flex gap-2 [color-scheme:dark]">
            <input
              type="date"
              value={toDateLocal(publishedAt)}
              onChange={(e) => {
                const v = e.target.value
                if (v) {
                  onPublishedAtChange(new Date(v + 'T' + (toTimeLocal(publishedAt) || '00:00')).toISOString())
                } else {
                  onPublishedAtChange(null)
                }
              }}
              className="flex-1 h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:[filter:brightness(0)_invert(1)]"
            />
            <input
              type="time"
              value={toTimeLocal(publishedAt)}
              onChange={(e) => {
                const v = e.target.value
                const dateVal = toDateLocal(publishedAt)
                if (dateVal) {
                  onPublishedAtChange(new Date(dateVal + 'T' + (v || '00:00')).toISOString())
                }
              }}
              className="w-[100px] h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:[filter:brightness(0)_invert(1)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <MultiSelect
            options={tags.map((t) => ({ value: t.id, label: t.name, color: t.color }))}
            selected={selectedTagIds}
            onSelectedChange={onSelectedTagIdsChange}
            placeholder="Select tags"
            creatable={!!onCreateTag}
            onCreate={onCreateTag}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Post access</label>
          <ToggleGroup
            type="single"
            value={visibility}
            onValueChange={(v) => v && onVisibilityChange(v as PostVisibility)}
            variant="outline"
            className="w-full rounded-lg border border-input p-0.5 bg-muted/50 [&_[data-slot=toggle-group-item]]:flex-1"
          >
            <ToggleGroupItem value={POST_VISIBILITY.PUBLIC} className="py-2">
              Public
            </ToggleGroupItem>
            <ToggleGroupItem value={POST_VISIBILITY.PRIVATE} className="py-2">
              Private
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Post URL</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="post-slug"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
    </aside>
  )
}
