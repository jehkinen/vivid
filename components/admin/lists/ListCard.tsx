'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { LIST_VISIBILITY } from '@/shared/constants'
import {
  useAddListItem,
  useUpdateListItem,
  useDeleteListItem,
  useDeleteList,
  useReorderListItems,
  type List,
} from '@/hooks/api/use-lists'
import { SortableListItem } from '@/components/admin/lists/SortableListItem'

type ListCardProps = {
  list: List
}

export function ListCard({ list }: ListCardProps) {
  const [newItemText, setNewItemText] = useState('')
  const addItem = useAddListItem()
  const updateItem = useUpdateListItem()
  const deleteItem = useDeleteListItem()
  const deleteList = useDeleteList()
  const reorderItems = useReorderListItems()
  const [listToDelete, setListToDelete] = useState<List | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const itemIds = list.items.map((i) => i.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = itemIds.indexOf(active.id as string)
    const newIndex = itemIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(list.items, oldIndex, newIndex)
    reorderItems.mutate({
      listId: list.id,
      itemIds: reordered.map((i) => i.id),
    })
  }

  const handleAddItem = () => {
    const text = newItemText.trim()
    if (!text) return
    addItem.mutate({ listId: list.id, data: { text } })
    setNewItemText('')
  }

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-sm truncate">{list.title}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">/{list.slug}</span>
          <span
            className={`text-[10px] px-1 py-0.5 rounded shrink-0 ${
              list.visibility === LIST_VISIBILITY.PUBLIC
                ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {list.visibility}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => setListToDelete(list)}
          aria-label="Delete list"
        >
          <TrashIcon size={14} />
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0 mb-2">
            {list.items.map((item) => (
              <li key={item.id}>
                <SortableListItem
                  item={item}
                  onToggle={(itemId, checked) =>
                    updateItem.mutate({ listId: list.id, itemId, data: { checked } })
                  }
                  onDelete={(itemId) => deleteItem.mutate({ listId: list.id, itemId })}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="flex gap-1.5 items-center">
        <Input
          placeholder="New item"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          className="flex-1 h-8 text-sm"
        />
        <Button
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          aria-label="Add item"
        >
          <PlusIcon size={16} />
        </Button>
      </div>
      <Dialog open={!!listToDelete} onOpenChange={(open) => !open && setListToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete list</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete &quot;{listToDelete?.title}&quot;? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (listToDelete) {
                  deleteList.mutate(listToDelete.id, { onSettled: () => setListToDelete(null) })
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
