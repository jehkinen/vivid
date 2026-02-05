'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useTag, useTags, useCreateTag, useUpdateTag, useDeleteTag, useMergeTag } from '@/hooks/api/use-tags'
import { slugify } from '@/lib/utils'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'
import Loader from '@/components/ui/Loader'

export default function TagEditPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const isNew = slug === 'new'

  const { data: tag, isLoading } = useTag(isNew ? '' : slug)
  const { data: allTags = [] } = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()
  const mergeTag = useMergeTag()

  const [name, setName] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [color, setColor] = useState(() =>
    isNew ? TAG_DEFAULT_COLORS[Math.floor(Math.random() * TAG_DEFAULT_COLORS.length)] : '#000000'
  )
  const [description, setDescription] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergePopoverOpen, setMergePopoverOpen] = useState(false)
  const slugSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (slugSyncTimerRef.current) clearTimeout(slugSyncTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (tag && !isNew) {
      setName(tag.name || '')
      setSlugValue(tag.slug || '')
      setColor(tag.color || '#000000')
      setDescription(tag.description || '')
    }
  }, [tag, isNew])

  const handleSave = async () => {
    if (!name.trim() || !slugValue.trim()) {
      return
    }

    if (isNew) {
      createTag.mutate(
        { name, slug: slugValue, color },
        {
          onSuccess: () => {
            router.push('/vivid/tags')
          },
        }
      )
    } else {
      updateTag.mutate(
        { slug, data: { name, slug: slugValue, color, description } },
        {
          onSuccess: () => {
            router.push('/vivid/tags')
          },
        }
      )
    }
  }

  const handleDelete = () => {
    if (!tag) return
    deleteTag.mutate(slug, {
      onSuccess: () => {
        router.push('/vivid/tags')
      },
    })
    setDeleteDialogOpen(false)
  }

  const otherTags = (allTags as { id: string; name: string; slug: string }[]).filter(
    (t) => t.id !== tag?.id
  )

  const handleMerge = () => {
    if (!tag || !mergeTargetId) return
    mergeTag.mutate(
      { sourceTagId: tag.id, targetTagId: mergeTargetId },
      {
        onSuccess: (data) => {
          setMergeDialogOpen(false)
          setMergeTargetId('')
          router.push(data?.targetTagSlug ? `/vivid/tags/${data.targetTagSlug}` : '/vivid/tags')
        },
      }
    )
  }

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {isNew ? 'New Tag' : 'Edit Tag'}
          </h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              value={name}
              onChange={(e) => {
                const value = e.target.value
                setName(value)
                if (slugSyncTimerRef.current) clearTimeout(slugSyncTimerRef.current)
                slugSyncTimerRef.current = setTimeout(() => {
                  slugSyncTimerRef.current = null
                  setSlugValue(slugify(value))
                }, 500)
              }}
              placeholder="Tag name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <Input
              value={slugValue}
              onChange={(e) => setSlugValue(e.target.value)}
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
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="grid grid-cols-5 gap-1.5">
                  {TAG_DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded border-2 shrink-0 transition-colors ${
                        (color?.toLowerCase() ?? '') === c.toLowerCase()
                          ? 'border-foreground ring-1 ring-offset-1'
                          : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tag description (optional)"
            />
          </div>

          {!isNew && otherTags.length > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h3 className="text-sm font-medium">Merge into another tag</h3>
              <p className="text-sm text-muted-foreground">
                All posts with this tag will get the chosen tag. This tag will be removed.
              </p>
              <Button variant="outline" size="sm" onClick={() => setMergeDialogOpen(true)}>
                Merge into...
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div>
              {!isNew && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/vivid/tags')}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createTag.isPending || updateTag.isPending}
              >
                {createTag.isPending || updateTag.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tag? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTag.isPending}
            >
              {deleteTag.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge tag</DialogTitle>
            <DialogDescription>
              Choose the tag to merge into. All posts with «{tag?.name}» will get the chosen tag,
              then this tag will be removed.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium mb-2">Target tag</label>
            <Popover open={mergePopoverOpen} onOpenChange={setMergePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal h-9 px-3 text-sm"
                >
                  <span className="truncate">
                    {mergeTargetId
                      ? otherTags.find((t) => t.id === mergeTargetId)?.name ?? 'Select tag...'
                      : 'Select tag...'}
                  </span>
                  <span className="shrink-0 opacity-50">⌄</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search tags..." />
                  <CommandList>
                    <CommandEmpty>No tag found.</CommandEmpty>
                    <CommandGroup>
                      {otherTags.map((t) => (
                        <CommandItem
                          key={t.id}
                          value={`${t.name} ${t.slug}`}
                          onSelect={() => {
                            setMergeTargetId(t.id)
                            setMergePopoverOpen(false)
                          }}
                        >
                          {t.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeTargetId || mergeTag.isPending}
            >
              {mergeTag.isPending ? 'Merging...' : 'Merge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}