'use client'

import * as React from 'react'
import { CheckIcon, CircleNotchIcon, XIcon, CaretUpDownIcon } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
  color?: string | null
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  creatable?: boolean
  onCreate?: (name: string) => Promise<{ value: string; label: string; color?: string | null } | null>
}

export function MultiSelect({
  options,
  selected,
  onSelectedChange,
  placeholder = 'Select items...',
  className,
  creatable,
  onCreate,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  const handleUnselect = (item: string) => {
    onSelectedChange(selected.filter(s => s !== item))
  }

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      handleUnselect(item)
    } else {
      onSelectedChange([...selected, item])
      setOpen(false)
      setSearch('')
    }
  }

  const handleCreate = () => {
    const name = search.trim()
    if (!name || !onCreate) return
    setIsCreating(true)
    onCreate(name)
      .then((result) => {
        if (result) {
          onSelectedChange([...selected, result.value])
          setOpen(false)
          setSearch('')
        }
      })
      .finally(() => setIsCreating(false))
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch('') }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full h-auto min-h-9 justify-between py-2', className)}
        >
          <div className="flex flex-1 min-w-0 flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map(item => {
                const option = options.find(opt => opt.value === item)
                return (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="max-w-full shrink-0"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    {option?.color && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">{option?.label || item}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="shrink-0 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer inline-flex"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleUnselect(item)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUnselect(item)
                      }}
                    >
                      <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                )
              })
            )}
          </div>
          <CaretUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search tags..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            {creatable && onCreate && search.trim() && (
              <CommandGroup>
                <CommandItem
                  value={search.trim()}
                  onSelect={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <CircleNotchIcon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckIcon className="mr-2 h-4 w-4 opacity-0" />
                  )}
                  <span>{isCreating ? 'Creating...' : `Create "${search.trim()}"`}</span>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
