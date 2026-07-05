'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type PostDeleteDialogsProps = {
  postToDelete: { id: string; title: string } | null
  permanentDeletePost: { id: string; title: string } | null
  softDeletePending: boolean
  hardDeletePending: boolean
  onPostToDeleteChange: (post: { id: string; title: string } | null) => void
  onPermanentDeletePostChange: (post: { id: string; title: string } | null) => void
  onConfirmSoftDelete: () => void
  onConfirmHardDelete: () => void
}

export function PostDeleteDialogs({
  postToDelete,
  permanentDeletePost,
  softDeletePending,
  hardDeletePending,
  onPostToDeleteChange,
  onPermanentDeletePostChange,
  onConfirmSoftDelete,
  onConfirmHardDelete,
}: PostDeleteDialogsProps) {
  return (
    <>
      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && onPostToDeleteChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete «{postToDelete?.title ?? 'this post'}»? It will be moved to Deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onPostToDeleteChange(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmSoftDelete}
              disabled={softDeletePending}
            >
              {softDeletePending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!permanentDeletePost} onOpenChange={(open) => !open && onPermanentDeletePostChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete «{permanentDeletePost?.title ?? 'this post'}»? This cannot be undone and will remove all associated media.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onPermanentDeletePostChange(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmHardDelete}
              disabled={hardDeletePending}
            >
              {hardDeletePending ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
