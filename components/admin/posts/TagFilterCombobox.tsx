'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Tag } from '@/hooks/api/use-tags'

type TagFilterComboboxProps = {
  tags: Tag[]
  tagId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagIdChange: (tagId: string) => void
}

export function TagFilterCombobox({
  tags,
  tagId,
  open,
  onOpenChange,
  onTagIdChange,
}: TagFilterComboboxProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[160px] justify-between font-normal h-9 px-3 text-sm"
        >
          <span className="truncate">
            {tagId ? tags.find((t) => t.id === tagId)?.name ?? 'All tags' : 'All tags'}
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
              <CommandItem
                value="all tags"
                onSelect={() => {
                  onTagIdChange('')
                  onOpenChange(false)
                }}
              >
                All tags
              </CommandItem>
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={`${tag.name} ${tag.slug}`}
                  onSelect={() => {
                    onTagIdChange(tag.id)
                    onOpenChange(false)
                  }}
                >
                  {tag.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
