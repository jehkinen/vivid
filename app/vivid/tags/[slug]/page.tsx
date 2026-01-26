'use client'

import { useState, useEffect } from 'react'
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
import { useTag, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/api/use-tags'
import { slugify } from '@/lib/utils'
import { TAG_DEFAULT_COLORS } from '@/shared/constants'
import Loader from '@/components/ui/Loader'

export default function TagEditPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const isNew = slug === 'new'

  const { data: tag, isLoading } = useTag(isNew ? '' : slug)
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const [name, setName] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [color, setColor] = useState(() =>
    isNew ? TAG_DEFAULT_COLORS[Math.floor(Math.random() * TAG_DEFAULT_COLORS.length)] : '#000000'
  )
  const [description, setDescription] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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
          onSuccess: (data) => {
            router.push(`/vivid/tags/${data.slug}`)
          },
        }
      )
    } else {
      updateTag.mutate(
        { slug, data: { name, slug: slugValue, color, description } },
        {
          onSuccess: () => {
            if (slugValue !== slug) {
              router.push(`/vivid/tags/${slugValue}`)
            }
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
                setName(e.target.value)
                if (isNew && !slugValue) {
                  setSlugValue(slugify(e.target.value))
                }
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
            <div className="flex items-center gap-4">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tag description (optional)"
            />
          </div>

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
    </div>
  )
}