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

type PostEditorDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  isDeleting: boolean
  onConfirmDelete: () => void
}

export default function PostEditorDeleteDialog({
  open,
  onOpenChange,
  title,
  isDeleting,
  onConfirmDelete,
}: PostEditorDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete post</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete «{title.trim() ? title : 'this post'}»? It will be moved to Deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
