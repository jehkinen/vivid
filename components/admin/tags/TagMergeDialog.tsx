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

type MergeTagOption = {
  id: string
  name: string
  slug: string
}

type TagMergeDialogProps = {
  open: boolean
  tagName: string | undefined
  otherTags: MergeTagOption[]
  mergeTargetId: string
  mergePopoverOpen: boolean
  mergePending: boolean
  onOpenChange: (open: boolean) => void
  onMergeTargetIdChange: (id: string) => void
  onMergePopoverOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function TagMergeDialog({
  open,
  tagName,
  otherTags,
  mergeTargetId,
  mergePopoverOpen,
  mergePending,
  onOpenChange,
  onMergeTargetIdChange,
  onMergePopoverOpenChange,
  onConfirm,
}: TagMergeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge tag</DialogTitle>
          <DialogDescription>
            Choose the tag to merge into. All posts with «{tagName}» will get the chosen tag,
            then this tag will be removed.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label className="block text-sm font-medium mb-2">Target tag</label>
          <Popover open={mergePopoverOpen} onOpenChange={onMergePopoverOpenChange}>
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
                          onMergeTargetIdChange(t.id)
                          onMergePopoverOpenChange(false)
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!mergeTargetId || mergePending}>
            {mergePending ? 'Merging...' : 'Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
