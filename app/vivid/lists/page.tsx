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
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PlusIcon, TrashIcon, DotsSixVertical, CheckCircle, Circle } from '@phosphor-icons/react'
import { LIST_VISIBILITY } from '@/shared/constants'
import { slugify } from '@/lib/utils'
import {
  useLists,
  useCreateList,
  useDeleteList,
  useAddListItem,
  useUpdateListItem,
  useDeleteListItem,
  useReorderListItems,
  type List,
  type ListItem,
} from '@/hooks/api/use-lists'
import Loader from '@/components/ui/Loader'

function SortableListItem({
  item,
  listId,
  onToggle,
  onDelete,
}: {
  item: ListItem
  listId: string
  onToggle: (itemId: string, checked: boolean) => void
  onDelete: (itemId: string) => void
}) {
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

function ListCard({ list }: { list: List }) {
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
                  listId={list.id}
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

export default function ListsPage() {
  const { data: lists = [], isLoading } = useLists()
  const createList = useCreateList()
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')

  const handleCreateOpen = (open: boolean) => {
    setCreateOpen(open)
    if (!open) {
      setNewTitle('')
      setNewSlug('')
    }
  }

  const handleTitleChange = (value: string) => {
    setNewTitle(value)
    setNewSlug(slugify(value || ''))
  }

  const handleCreate = () => {
    const title = newTitle.trim()
    const slug = newSlug.trim()
    if (!title || !slug) return
    createList.mutate(
      { title, slug },
      {
        onSuccess: () => handleCreateOpen(false),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Lists</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon size={18} className="mr-1.5" />
          New list
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,340px))]">
        {lists.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No lists yet. Create one to get started.</p>
        ) : (
          lists.map((list: List) => <ListCard key={list.id} list={list} />)
        )}
      </div>
      <Dialog open={createOpen} onOpenChange={handleCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="List title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="url-slug"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || !newSlug.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
