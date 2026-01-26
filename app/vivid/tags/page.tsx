'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PencilIcon, TrashIcon } from '@phosphor-icons/react'
import { useTags, useDeleteTag } from '@/hooks/api/use-tags'

export default function TagsPage() {
  const router = useRouter()
  const { data: tags = [], isLoading } = useTags()
  const deleteTag = useDeleteTag()
  const [tagToDelete, setTagToDelete] = useState<{ slug: string; name: string } | null>(null)

  const handleDelete = () => {
    if (!tagToDelete) return
    deleteTag.mutate(tagToDelete.slug, {
      onSettled: () => setTagToDelete(null),
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tags</h1>
        <Button onClick={() => router.push('/vivid/tags/new')}>
          New tag
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>No. of Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No tags found
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag: any) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tag.color && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      <span className="font-medium">{tag.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                  <TableCell>{tag.postCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/vivid/tags/${tag.slug}`)}
                        aria-label="Edit"
                      >
                        <PencilIcon size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTagToDelete({ slug: tag.slug, name: tag.name || tag.slug })}
                        aria-label="Delete"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete «{tagToDelete?.name}»? This action cannot be undone.
              The tag will be unlinked from all posts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagToDelete(null)}>
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