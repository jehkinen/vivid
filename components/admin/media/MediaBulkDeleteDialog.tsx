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

type MediaBulkDeleteDialogProps = {
  open: boolean
  count: number
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function MediaBulkDeleteDialog({
  open,
  count,
  isPending,
  onOpenChange,
  onConfirm,
}: MediaBulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {count} file{count === 1 ? '' : 's'} permanently?</DialogTitle>
          <DialogDescription>
            Files will be removed from storage and the library. This cannot be undone. Files still used
            as a cover or inside a post will be skipped.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
