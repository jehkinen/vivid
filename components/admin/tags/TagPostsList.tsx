'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'

type TagPostsListProps = {
  isNew: boolean
  name: string
  slugValue: string
  color: string
  description: string
  hasOtherTags: boolean
  savePending: boolean
  onNameChange: (value: string) => void
  onSlugChange: (value: string) => void
  onColorChange: (color: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onDeleteClick: () => void
  onMergeClick: () => void
}

export function TagPostsList({
  isNew,
  name,
  slugValue,
  color,
  description,
  hasOtherTags,
  savePending,
  onNameChange,
  onSlugChange,
  onColorChange,
  onDescriptionChange,
  onSave,
  onDeleteClick,
  onMergeClick,
}: TagPostsListProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Tag name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Slug</label>
        <Input
          value={slugValue}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="tag-slug"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Color</label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-9 w-9 rounded-md border border-input shrink-0 transition-opacity hover:opacity-90"
              style={{ backgroundColor: color }}
              aria-label="Choose color"
              suppressHydrationWarning
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-5 gap-1.5">
              {TAG_DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onColorChange(c)}
                  className={`h-7 w-7 rounded border-2 shrink-0 transition-colors ${
                    (color?.toLowerCase() ?? '') === c.toLowerCase()
                      ? 'border-foreground ring-1 ring-offset-1'
                      : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  suppressHydrationWarning
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Tag description (optional)"
        />
      </div>

      {!isNew && hasOtherTags && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-sm font-medium">Merge into another tag</h3>
          <p className="text-sm text-muted-foreground">
            All posts with this tag will get the chosen tag. This tag will be removed.
          </p>
          <Button variant="outline" size="sm" onClick={onMergeClick}>
            Merge into...
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <div>
          {!isNew && (
            <Button variant="destructive" onClick={onDeleteClick}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/vivid/tags')}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={savePending}>
            {savePending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
