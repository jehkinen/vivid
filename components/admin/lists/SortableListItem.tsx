'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { TrashIcon, DotsSixVertical, CheckCircle, Circle } from '@phosphor-icons/react'
import type { ListItem } from '@/hooks/api/use-lists'

type SortableListItemProps = {
  item: ListItem
  onToggle: (itemId: string, checked: boolean) => void
  onDelete: (itemId: string) => void
}

export function SortableListItem({ item, onToggle, onDelete }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded text-sm group ${
        isDragging ? 'opacity-50 bg-muted z-10' : ''
      }`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <DotsSixVertical size={14} />
      </button>
      <button
        type="button"
        onClick={() => onToggle(item.id, !item.checked)}
        className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-label={item.checked ? 'Mark unchecked' : 'Mark done'}
      >
        {item.checked ? (
          <CheckCircle size={18} weight="fill" className="text-green-600 dark:text-green-500" />
        ) : (
          <Circle size={18} />
        )}
      </button>
      <span className={`flex-1 min-w-0 truncate ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
        {item.text}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label="Delete item"
      >
        <TrashIcon size={12} />
      </Button>
    </div>
  )
}
